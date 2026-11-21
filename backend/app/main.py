from contextlib import asynccontextmanager
import logging
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import UPLOAD_DIR, CLIP_MODEL_NAME
from .database import (
    init_db,
    get_all_images,
    get_image_by_id,
    update_image_tags,
    get_search_history,
    clear_search_history,
    get_all_unique_tags,
    get_db_stats
)
from .indexer import FaissIndexManager
from .model import ClipModelManager
from .services import (
    process_and_index_image,
    search_by_text,
    search_by_image,
    delete_single_image,
    rebuild_faiss_index,
    format_image_item
)
from .schemas import (
    ImageItem,
    SearchResponse,
    SearchHistoryItem,
    UpdateTagsRequest,
    StatsResponse
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("visual_seek.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing VisualSeek database...")
    init_db()
    
    logger.info("Initializing FAISS Index Manager...")
    faiss_mgr = FaissIndexManager.get_instance()
    
    logger.info("Pre-warming OpenCLIP model...")
    try:
        ClipModelManager.get_instance()
    except Exception as e:
        logger.error(f"Failed to load OpenCLIP model on startup: {e}")
        
    yield
    
    logger.info("Saving FAISS index before shutdown...")
    faiss_mgr.save()

app = FastAPI(
    title="VisualSeek API",
    description="AI Image Search Engine powered by OpenCLIP, FAISS, and FastAPI",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images statically
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "VisualSeek",
        "model": CLIP_MODEL_NAME
    }

@app.get("/api/stats", response_model=StatsResponse)
def get_stats():
    db_stats = get_db_stats()
    indexer = FaissIndexManager.get_instance()
    return {
        **db_stats,
        "indexed_vectors": indexer.count(),
        "model_name": CLIP_MODEL_NAME
    }

@app.post("/api/upload")
async def upload_images(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    results = []
    errors = []
    for file in files:
        try:
            contents = await file.read()
            if not contents:
                continue
            item, is_new = process_and_index_image(contents, file.filename or "uploaded_image.jpg")
            results.append({
                "item": item,
                "is_new": is_new,
                "filename": file.filename
            })
        except Exception as e:
            logger.error(f"Error processing {file.filename}: {e}", exc_info=True)
            errors.append({"filename": file.filename, "error": str(e)})

    return {
        "uploaded_count": len(results),
        "error_count": len(errors),
        "results": results,
        "errors": errors
    }

@app.post("/api/search/text", response_model=SearchResponse)
def search_text_endpoint(
    query: str = Form(...),
    top_k: int = Form(20)
):
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return search_by_text(query=query, top_k=top_k)

@app.post("/api/search/image", response_model=SearchResponse)
async def search_image_endpoint(
    file: UploadFile = File(...),
    top_k: int = Form(20)
):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image file")
    try:
        return search_by_image(file_bytes=contents, top_k=top_k)
    except Exception as e:
        logger.error(f"Error searching by image: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process query image: {str(e)}")

@app.get("/api/images")
def list_images(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    tag: Optional[str] = None,
    search: Optional[str] = None
):
    items, total = get_all_images(limit=limit, offset=offset, tag=tag, search=search)
    return {
        "images": [format_image_item(x) for x in items],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@app.get("/api/images/{image_id}")
def get_single_image(image_id: int):
    record = get_image_by_id(image_id)
    if not record:
        raise HTTPException(status_code=404, detail="Image not found")
    return format_image_item(record)

@app.delete("/api/images/{image_id}")
def delete_image_endpoint(image_id: int):
    success = delete_single_image(image_id)
    if not success:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"status": "deleted", "image_id": image_id}

@app.patch("/api/images/{image_id}/tags")
def update_tags_endpoint(image_id: int, payload: UpdateTagsRequest):
    record = get_image_by_id(image_id)
    if not record:
        raise HTTPException(status_code=404, detail="Image not found")
    
    cleaned_tags = list(dict.fromkeys([t.strip().lower() for t in payload.tags if t.strip()]))
    update_image_tags(image_id, cleaned_tags)
    updated = get_image_by_id(image_id)
    return format_image_item(updated)

@app.get("/api/tags")
def get_tags_endpoint():
    tags = get_all_unique_tags()
    return {"tags": tags}

@app.get("/api/history", response_model=List[SearchHistoryItem])
def get_history_endpoint(limit: int = Query(20, ge=1, le=100)):
    records = get_search_history(limit=limit)
    return [
        {
            "id": r["id"],
            "query_type": r["query_type"],
            "query_text": r["query_text"],
            "query_image_url": r["query_image_path"],
            "result_count": r["result_count"],
            "created_at": str(r["created_at"])
        }
        for r in records
    ]

@app.delete("/api/history")
def clear_history_endpoint():
    cleared = clear_search_history()
    return {"status": "cleared", "deleted_count": cleared}

@app.post("/api/reindex")
def reindex_all():
    count = rebuild_faiss_index()
    return {"status": "reindexed", "indexed_count": count}
