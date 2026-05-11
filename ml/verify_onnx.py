"""Sanity-check the trained ONNX model: run inference on a handful of test images
and report accuracy + sample predictions. Run from project root.
"""

from __future__ import annotations

import io
import zipfile
from pathlib import Path

import numpy as np
import onnxruntime as ort
import pandas as pd
from PIL import Image

from class_map import CLASSES

ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "ml" / "artifacts" / "galaxy_classifier.onnx"
ZIP = ROOT / "data" / "raw" / "images_gz2.zip"
TEST_CSV = ROOT / "data" / "processed" / "test.csv"

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def preprocess(pil: Image.Image, size: int = 224) -> np.ndarray:
    w, h = pil.size
    s = min(w, h)
    left = (w - s) // 2
    top = (h - s) // 2
    pil = pil.crop((left, top, left + s, top + s))
    pil = pil.crop(((s - 212) // 2, (s - 212) // 2, (s + 212) // 2, (s + 212) // 2))
    pil = pil.resize((size, size), Image.BILINEAR)
    arr = np.asarray(pil.convert("RGB"), dtype=np.float32) / 255.0
    arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
    return arr.transpose(2, 0, 1)[None]


def softmax(x: np.ndarray) -> np.ndarray:
    x = x - x.max(axis=-1, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=-1, keepdims=True)


def main(n: int = 50) -> None:
    sess = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])
    df = pd.read_csv(TEST_CSV).sample(n, random_state=0).reset_index(drop=True)
    correct = 0
    with zipfile.ZipFile(ZIP) as z:
        for i, row in df.iterrows():
            with z.open(f"images/{row['filename']}") as fp:
                pil = Image.open(io.BytesIO(fp.read())).convert("RGB")
            x = preprocess(pil)
            logits = sess.run(None, {"input": x})[0][0]
            probs = softmax(logits)
            pred_idx = int(probs.argmax())
            pred = CLASSES[pred_idx]
            conf = float(probs[pred_idx])
            ok = pred == row["label"]
            correct += ok
            if i < 10:
                mark = "OK" if ok else "X "
                print(f"  {mark} {row['filename']:>12s}  true={row['label']:14s}  pred={pred:14s}  conf={conf:.3f}")
    print(f"\n{correct}/{n} correct ({correct/n*100:.1f}%)")


if __name__ == "__main__":
    main()
