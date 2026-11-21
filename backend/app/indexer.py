import os
import faiss
import numpy as np
import logging
from typing import List, Tuple, Optional
from .config import FAISS_INDEX_PATH, EMBEDDING_DIM

logger = logging.getLogger("visual_seek.indexer")

class FaissIndexManager:
    _instance: Optional["FaissIndexManager"] = None

    def __init__(self):
        self.dimension = EMBEDDING_DIM
        self.index_path = FAISS_INDEX_PATH
        self.index = self._load_or_create_index()

    @classmethod
    def get_instance(cls) -> "FaissIndexManager":
        if cls._instance is None:
            cls._instance = FaissIndexManager()
        return cls._instance

    def _load_or_create_index(self) -> faiss.IndexIDMap2:
        if os.path.exists(self.index_path):
            try:
                loaded = faiss.read_index(self.index_path)
                logger.info(f"Loaded existing FAISS index from {self.index_path} with {loaded.ntotal} vectors.")
                return loaded
            except Exception as e:
                logger.warning(f"Could not load index from {self.index_path}: {e}. Initializing new index.")

        # Create IndexFlatIP (Inner Product) wrapped in IndexIDMap2 for custom ID support
        base_index = faiss.IndexFlatIP(self.dimension)
        id_index = faiss.IndexIDMap2(base_index)
        logger.info(f"Created new FAISS IndexFlatIP (dim={self.dimension}) with IDMap2.")
        return id_index

    def save(self):
        try:
            os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
            faiss.write_index(self.index, self.index_path)
            logger.info(f"FAISS index saved to {self.index_path} (ntotal={self.index.ntotal}).")
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")

    def add(self, image_id: int, vector: np.ndarray):
        vec = vector.reshape(1, -1).astype(np.float32)
        # Ensure L2 normalized
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        ids = np.array([image_id], dtype=np.int64)
        
        # If ID already exists in index, remove it first to avoid duplicate entries
        self.remove(image_id, save_after=False)
        self.index.add_with_ids(vec, ids)
        self.save()

    def add_batch(self, image_ids: List[int], vectors: List[np.ndarray]):
        if not image_ids or not vectors:
            return
        mat = np.vstack(vectors).astype(np.float32)
        norms = np.linalg.norm(mat, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        mat = mat / norms
        ids = np.array(image_ids, dtype=np.int64)
        
        # Remove any existing ids
        for iid in image_ids:
            self.remove(iid, save_after=False)
            
        self.index.add_with_ids(mat, ids)
        self.save()

    def remove(self, image_id: int, save_after: bool = True):
        try:
            selector = faiss.IDSelectorArray([image_id])
            self.index.remove_ids(selector)
            if save_after:
                self.save()
        except Exception as e:
            logger.warning(f"Failed to remove id {image_id} from FAISS: {e}")

    def search(self, query_vector: np.ndarray, top_k: int = 20) -> List[Tuple[int, float]]:
        if self.index.ntotal == 0:
            return []
        
        vec = query_vector.reshape(1, -1).astype(np.float32)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm

        k = min(top_k, self.index.ntotal)
        if k <= 0:
            return []

        distances, ids = self.index.search(vec, k)
        
        results = []
        for dist, idx in zip(distances[0], ids[0]):
            if idx != -1:
                results.append((int(idx), float(dist)))
        return results

    def reset(self):
        base_index = faiss.IndexFlatIP(self.dimension)
        self.index = faiss.IndexIDMap2(base_index)
        self.save()

    def count(self) -> int:
        return self.index.ntotal
