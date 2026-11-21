from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ImageItem(BaseModel):
    id: int
    filename: str
    original_name: str
    url: str
    thumbnail_url: Optional[str] = None
    width: int
    height: int
    file_size: int
    mime_type: str
    tags: List[str] = []
    created_at: str

class SearchResultItem(BaseModel):
    image: ImageItem
    similarity: float
    similarity_percentage: float
    rank: int

class SearchResponse(BaseModel):
    query_type: str
    query_text: Optional[str] = None
    query_image_url: Optional[str] = None
    results: List[SearchResultItem]
    total_found: int
    search_time_ms: float

class SearchHistoryItem(BaseModel):
    id: int
    query_type: str
    query_text: Optional[str] = None
    query_image_url: Optional[str] = None
    result_count: int
    created_at: str

class UpdateTagsRequest(BaseModel):
    tags: List[str]

class StatsResponse(BaseModel):
    total_images: int
    total_searches: int
    total_tags: int
    total_storage_bytes: int
    indexed_vectors: int
    model_name: str
