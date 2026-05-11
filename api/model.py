"""ONNX inference wrapper for the galaxy classifier."""

from __future__ import annotations

import io
import json
import threading
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

API_DIR = Path(__file__).resolve().parent
ROOT = API_DIR.parent
MODEL_PATH = ROOT / "ml" / "artifacts" / "galaxy_classifier.onnx"
META_PATH = ROOT / "ml" / "artifacts" / "model_meta.json"

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

DISPLAY_NAME = {
    "elliptical": "Elliptical",
    "spiral": "Spiral",
    "barred_spiral": "Barred Spiral",
    "edge_on_disk": "Edge-on Disk",
    "merger": "Merger",
}


class GalaxyClassifier:
    def __init__(self, model_path: Path = MODEL_PATH, meta_path: Path = META_PATH):
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model not found at {model_path}. Train it first (see ml/colab_train.ipynb)."
            )
        meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
        self.classes: list[str] = meta.get("classes", [
            "elliptical", "spiral", "barred_spiral", "edge_on_disk", "merger",
        ])
        self.img_size: int = int(meta.get("img_size", 224))
        self.session = ort.InferenceSession(
            str(model_path), providers=["CPUExecutionProvider"]
        )
        self.input_name = self.session.get_inputs()[0].name
        self._lock = threading.Lock()

    def preprocess(self, image_bytes: bytes) -> np.ndarray:
        """Match training transforms exactly: center-square crop, resize to the
        GZ2 native 424×424, center-crop the inner 212×212 (the trained
        receptive area), then resize to the model's input size."""
        pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        w, h = pil.size
        s = min(w, h)
        pil = pil.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
        pil = pil.resize((424, 424), Image.BILINEAR)
        pil = pil.crop((106, 106, 318, 318))
        pil = pil.resize((self.img_size, self.img_size), Image.BILINEAR)
        arr = np.asarray(pil, dtype=np.float32) / 255.0
        arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
        return arr.transpose(2, 0, 1)[None]

    def predict(self, image_bytes: bytes) -> dict:
        x = self.preprocess(image_bytes)
        with self._lock:
            logits = self.session.run(None, {self.input_name: x})[0][0]
        logits = logits - logits.max()
        probs = np.exp(logits)
        probs = probs / probs.sum()
        order = np.argsort(probs)[::-1]
        top_idx = int(order[0])
        return {
            "prediction": self.classes[top_idx],
            "predictionDisplay": DISPLAY_NAME.get(self.classes[top_idx], self.classes[top_idx]),
            "confidence": float(probs[top_idx]),
            "probabilities": [
                {
                    "label": self.classes[i],
                    "labelDisplay": DISPLAY_NAME.get(self.classes[i], self.classes[i]),
                    "probability": float(probs[i]),
                }
                for i in order
            ],
        }
