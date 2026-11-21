import torch
import open_clip
import numpy as np
from PIL import Image
from typing import List, Tuple, Optional
import logging
from .config import CLIP_MODEL_NAME, CLIP_PRETRAINED, DEFAULT_CANDIDATE_TAGS, TAG_CONFIDENCE_THRESHOLD

logger = logging.getLogger("visual_seek.model")

class ClipModelManager:
    _instance: Optional["ClipModelManager"] = None

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Loading OpenCLIP model '{CLIP_MODEL_NAME}' ({CLIP_PRETRAINED}) on {self.device}...")
        
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            CLIP_MODEL_NAME,
            pretrained=CLIP_PRETRAINED,
            device=self.device
        )
        self.model.eval()
        self.tokenizer = open_clip.get_tokenizer(CLIP_MODEL_NAME)
        
        # Precompute candidate tag embeddings for zero-shot auto-tagging
        self.candidate_tags = DEFAULT_CANDIDATE_TAGS
        self._tag_embeddings = self._precompute_tag_embeddings()
        logger.info(f"OpenCLIP model loaded successfully on {self.device}. Precomputed {len(self.candidate_tags)} tag embeddings.")

    @classmethod
    def get_instance(cls) -> "ClipModelManager":
        if cls._instance is None:
            cls._instance = ClipModelManager()
        return cls._instance

    def _precompute_tag_embeddings(self) -> np.ndarray:
        # Prompt engineering template: "a photo of {tag}"
        prompts = [f"a photo of {tag}" for tag in self.candidate_tags]
        tokens = self.tokenizer(prompts).to(self.device)
        with torch.no_grad():
            text_features = self.model.encode_text(tokens)
            text_features /= text_features.norm(dim=-1, keepdim=True)
        return text_features.cpu().numpy().astype(np.float32)

    def embed_image(self, image: Image.Image) -> np.ndarray:
        if image.mode != "RGB":
            image = image.convert("RGB")
        tensor = self.preprocess(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            features = self.model.encode_image(tensor)
            features /= features.norm(dim=-1, keepdim=True)
        return features.cpu().numpy().astype(np.float32).flatten()

    def embed_text(self, text: str) -> np.ndarray:
        text = text.strip()
        tokens = self.tokenizer([text]).to(self.device)
        with torch.no_grad():
            features = self.model.encode_text(tokens)
            features /= features.norm(dim=-1, keepdim=True)
        return features.cpu().numpy().astype(np.float32).flatten()

    def predict_tags(self, image_embedding: np.ndarray, top_k: int = 4) -> List[str]:
        # Compute dot product between normalized image embedding and normalized tag embeddings
        similarities = np.dot(self._tag_embeddings, image_embedding)
        
        # Rank by score
        top_indices = np.argsort(similarities)[::-1]
        
        assigned_tags = []
        for idx in top_indices:
            score = float(similarities[idx])
            if score >= TAG_CONFIDENCE_THRESHOLD:
                assigned_tags.append(self.candidate_tags[idx])
            if len(assigned_tags) >= top_k:
                break
                
        # Fallback to at least top 2 if threshold is strict
        if not assigned_tags and len(top_indices) > 0:
            assigned_tags = [self.candidate_tags[top_indices[0]]]
            if len(top_indices) > 1:
                assigned_tags.append(self.candidate_tags[top_indices[1]])

        return assigned_tags
