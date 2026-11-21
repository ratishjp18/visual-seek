import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = BASE_DIR / "uploads"
THUMBNAIL_DIR = BASE_DIR / "uploads" / "thumbnails"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = str(DATA_DIR / "visual_seek.db")
FAISS_INDEX_PATH = str(DATA_DIR / "faiss.index")

# CLIP Model Settings
# ViT-B-32 with OpenAI weights is cached, fast on CPU, and high accuracy
CLIP_MODEL_NAME = "ViT-B-32-quickgelu"
CLIP_PRETRAINED = "openai"
EMBEDDING_DIM = 512

# Common zero-shot candidate tags for automatic tagging
DEFAULT_CANDIDATE_TAGS = [
    "nature", "landscape", "sunset", "sunrise", "mountains", "forest", "beach", "ocean",
    "animals", "dogs", "cats", "wildlife", "birds",
    "urban", "cityscape", "architecture", "street", "building", "night",
    "vehicles", "cars", "airplane", "boat", "train", "motorcycle",
    "people", "portrait", "crowd",
    "technology", "computers", "gadgets", "workspace",
    "food", "beverages", "fruits", "coffee", "restaurant",
    "indoor", "outdoor", "macro", "minimalist", "art", "flowers"
]

TAG_CONFIDENCE_THRESHOLD = 0.16
DEFAULT_TOP_K = 20
MAX_TOP_K = 100
