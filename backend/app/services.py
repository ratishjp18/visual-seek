import os
import io
import time
import hashlib
import uuid
import logging
from PIL import Image
from typing import List, Dict, Any, Optional, Tuple

from .config import UPLOAD_DIR, THUMBNAIL_DIR
from .model import ClipModelManager
from .indexer import FaissIndexManager
from .database import (
    insert_image,
    find_image_by_hash,
    get_image_by_id,
    get_images_by_ids,
    get_all_images,
    delete_image,
    update_image_tags,
    insert_search_history,
    get_search_history,
    clear_search_history,
    get_db_stats,
    get_all_unique_tags
)

logger = logging.getLogger("visual_seek.services")

QUERY_DIR = UPLOAD_DIR / "queries"
QUERY_DIR.mkdir(parents=True, exist_ok=True)

def format_image_item(img: Dict[str, Any]) -> Dict[str, Any]:
    filename = img["filename"]
    thumb_path = THUMBNAIL_DIR / filename
    return {
        "id": img["id"],
        "filename": filename,
        "original_name": img["original_name"],
        "url": f"/uploads/{filename}",
        "thumbnail_url": f"/uploads/thumbnails/{filename}" if thumb_path.exists() else f"/uploads/{filename}",
        "width": img["width"],
        "height": img["height"],
        "file_size": img["file_size"],
        "mime_type": img["mime_type"],
        "tags": img.get("tags") or [],
        "created_at": str(img.get("created_at") or "")
    }

def process_and_index_image(file_bytes: bytes, original_filename: str) -> Tuple[Dict[str, Any], bool]:
    """
    Ingests an image:
    1. Computes hash and detects duplicates
    2. Opens with PIL, extracts dimensions
    3. Saves full image and creates a web-optimized thumbnail
    4. Computes CLIP embedding
    5. Predicts tags using zero-shot CLIP
    6. Stores in SQLite and FAISS
    Returns (image_dict, is_new)
    """
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    existing = find_image_by_hash(file_hash)
    if existing:
        return format_image_item(existing), False

    # Open image with PIL
    pil_image = Image.open(io.BytesIO(file_bytes))
    width, height = pil_image.size
    mime_type = Image.MIME.get(pil_image.format, "image/jpeg") if pil_image.format else "image/jpeg"
    ext = os.path.splitext(original_filename)[1].lower()
    if not ext or ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]:
        ext = ".jpg"

    unique_filename = f"{uuid.uuid4().hex[:14]}{ext}"
    dest_path = UPLOAD_DIR / unique_filename
    thumb_path = THUMBNAIL_DIR / unique_filename

    # Save original file
    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    # Generate and save thumbnail (max 400x400)
    try:
        thumb_img = pil_image.copy()
        if thumb_img.mode in ("RGBA", "P"):
            thumb_img = thumb_img.convert("RGB")
        thumb_img.thumbnail((400, 400), Image.Resampling.LANCZOS)
        thumb_img.save(thumb_path, "JPEG", quality=85)
    except Exception as e:
        logger.warning(f"Could not generate thumbnail for {unique_filename}: {e}")

    # Generate CLIP embedding & tags
    model_mgr = ClipModelManager.get_instance()
    embedding = model_mgr.embed_image(pil_image)
    predicted_tags = model_mgr.predict_tags(embedding, top_k=4)

    file_size = len(file_bytes)
    # Store in SQLite
    image_id = insert_image(
        filename=unique_filename,
        original_name=original_filename,
        filepath=str(dest_path),
        width=width,
        height=height,
        file_size=file_size,
        mime_type=mime_type,
        file_hash=file_hash,
        tags=predicted_tags
    )

    # Store in FAISS
    indexer = FaissIndexManager.get_instance()
    indexer.add(image_id, embedding)

    fresh_record = get_image_by_id(image_id)
    return format_image_item(fresh_record), True

def search_by_text(query: str, top_k: int = 20) -> Dict[str, Any]:
    start_time = time.time()
    query = query.strip()
    if not query:
        return {
            "query_type": "text",
            "query_text": query,
            "results": [],
            "total_found": 0,
            "search_time_ms": 0.0
        }

    model_mgr = ClipModelManager.get_instance()
    indexer = FaissIndexManager.get_instance()

    query_vec = model_mgr.embed_text(query)
    matches = indexer.search(query_vec, top_k=top_k)

    if not matches:
        elapsed = (time.time() - start_time) * 1000
        insert_search_history(query_type="text", query_text=query, result_count=0)
        return {
            "query_type": "text",
            "query_text": query,
            "results": [],
            "total_found": 0,
            "search_time_ms": round(elapsed, 2)
        }

    image_ids = [m[0] for m in matches]
    db_records = get_images_by_ids(image_ids)

    results = []
    rank = 1
    for img_id, raw_sim in matches:
        if img_id in db_records:
            # Cosine similarity for CLIP typically ranges between 0.15 and 0.90 for matches
            # Rescale to a friendly 0-100% score
            pct = round(max(0.0, min(1.0, (raw_sim + 0.1) / 1.1)) * 100, 1)
            results.append({
                "image": format_image_item(db_records[img_id]),
                "similarity": round(float(raw_sim), 4),
                "similarity_percentage": pct,
                "rank": rank
            })
            rank += 1

    elapsed = (time.time() - start_time) * 1000
    insert_search_history(query_type="text", query_text=query, result_count=len(results))

    return {
        "query_type": "text",
        "query_text": query,
        "results": results,
        "total_found": len(results),
        "search_time_ms": round(elapsed, 2)
    }

def search_by_image(file_bytes: bytes, top_k: int = 20) -> Dict[str, Any]:
    start_time = time.time()
    pil_image = Image.open(io.BytesIO(file_bytes))
    
    # Save a small reference thumbnail for search history
    query_filename = f"query_{uuid.uuid4().hex[:10]}.jpg"
    query_file_path = QUERY_DIR / query_filename
    try:
        thumb = pil_image.copy()
        if thumb.mode in ("RGBA", "P"):
            thumb = thumb.convert("RGB")
        thumb.thumbnail((250, 250))
        thumb.save(query_file_path, "JPEG", quality=80)
        query_image_url = f"/uploads/queries/{query_filename}"
    except Exception:
        query_image_url = None

    model_mgr = ClipModelManager.get_instance()
    indexer = FaissIndexManager.get_instance()

    query_vec = model_mgr.embed_image(pil_image)
    matches = indexer.search(query_vec, top_k=top_k)

    if not matches:
        elapsed = (time.time() - start_time) * 1000
        insert_search_history(query_type="image", query_image_path=query_image_url, result_count=0)
        return {
            "query_type": "image",
            "query_image_url": query_image_url,
            "results": [],
            "total_found": 0,
            "search_time_ms": round(elapsed, 2)
        }

    image_ids = [m[0] for m in matches]
    db_records = get_images_by_ids(image_ids)

    results = []
    rank = 1
    for img_id, raw_sim in matches:
        if img_id in db_records:
            pct = round(max(0.0, min(1.0, raw_sim)) * 100, 1)
            results.append({
                "image": format_image_item(db_records[img_id]),
                "similarity": round(float(raw_sim), 4),
                "similarity_percentage": pct,
                "rank": rank
            })
            rank += 1

    elapsed = (time.time() - start_time) * 1000
    insert_search_history(query_type="image", query_image_path=query_image_url, result_count=len(results))

    return {
        "query_type": "image",
        "query_image_url": query_image_url,
        "results": results,
        "total_found": len(results),
        "search_time_ms": round(elapsed, 2)
    }

def delete_single_image(image_id: int) -> bool:
    img = delete_image(image_id)
    if not img:
        return False

    indexer = FaissIndexManager.get_instance()
    indexer.remove(image_id)

    # Delete physical files
    try:
        if os.path.exists(img["filepath"]):
            os.remove(img["filepath"])
        thumb = THUMBNAIL_DIR / img["filename"]
        if thumb.exists():
            thumb.unlink()
    except Exception as e:
        logger.warning(f"Error removing physical files for image {image_id}: {e}")

    return True

def rebuild_faiss_index() -> int:
    """
    Reads all existing images from SQLite, computes embeddings, and re-populates FAISS.
    """
    items, _ = get_all_images(limit=100000)
    model_mgr = ClipModelManager.get_instance()
    indexer = FaissIndexManager.get_instance()
    indexer.reset()

    count = 0
    ids = []
    vectors = []
    for item in items:
        fpath = item["filepath"]
        if os.path.exists(fpath):
            try:
                pil_img = Image.open(fpath)
                vec = model_mgr.embed_image(pil_img)
                ids.append(item["id"])
                vectors.append(vec)
                count += 1
            except Exception as e:
                logger.warning(f"Failed to re-embed image {item['id']}: {e}")

    if ids and vectors:
        indexer.add_batch(ids, vectors)

    return count
