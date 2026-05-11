"""Pick a curated set of gallery galaxies for the website.

For each portfolio class, scans the test set, finds images the model classifies
correctly with high confidence, and writes them to `web/public/gallery/`.
Also writes `gallery.json` with metadata (file, true label, true gz2_class) so
the frontend can iterate over the gallery. The model's prediction is NOT stored
— it's fetched at runtime from the API, which is the whole point.

Run from project root:
    python ml/build_gallery.py
"""

from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

import numpy as np
import onnxruntime as ort
import pandas as pd
from PIL import Image

from class_map import CLASSES, DISPLAY_NAME

ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "ml" / "artifacts" / "galaxy_classifier.onnx"
ZIP = ROOT / "data" / "raw" / "images_gz2.zip"
TEST_CSV = ROOT / "data" / "processed" / "test.csv"
GALLERY_DIR = ROOT / "web" / "public" / "gallery"
GALLERY_JSON = ROOT / "web" / "public" / "gallery.json"

PER_CLASS = 5
CONF_THRESHOLD = 0.75

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def preprocess(pil: Image.Image, size: int = 224) -> np.ndarray:
    pil = pil.convert("RGB")
    w, h = pil.size
    s = min(w, h)
    pil = pil.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
    pil = pil.crop(((s - 212) // 2, (s - 212) // 2, (s + 212) // 2, (s + 212) // 2))
    pil = pil.resize((size, size), Image.BILINEAR)
    arr = np.asarray(pil, dtype=np.float32) / 255.0
    arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
    return arr.transpose(2, 0, 1)[None]


def softmax(x: np.ndarray) -> np.ndarray:
    x = x - x.max(-1, keepdims=True)
    e = np.exp(x)
    return e / e.sum(-1, keepdims=True)


def main() -> None:
    GALLERY_DIR.mkdir(parents=True, exist_ok=True)
    for existing in GALLERY_DIR.glob("*.jpg"):
        existing.unlink()

    sess = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])
    df = pd.read_csv(TEST_CSV).sample(frac=1.0, random_state=11).reset_index(drop=True)

    picked: dict[str, list[dict]] = {c: [] for c in CLASSES}
    with zipfile.ZipFile(ZIP) as z:
        for _, row in df.iterrows():
            cls = row["label"]
            if len(picked[cls]) >= PER_CLASS:
                if all(len(picked[c]) >= PER_CLASS for c in CLASSES):
                    break
                continue
            try:
                with z.open(f"images/{row['filename']}") as fp:
                    raw = fp.read()
                pil = Image.open(io.BytesIO(raw))
                x = preprocess(pil)
            except Exception:
                continue
            logits = sess.run(None, {"input": x})[0][0]
            probs = softmax(logits)
            idx = int(probs.argmax())
            if CLASSES[idx] != cls:
                continue
            conf = float(probs[idx])
            if conf < CONF_THRESHOLD:
                continue
            out_name = f"{cls}_{int(row['asset_id'])}.jpg"
            (GALLERY_DIR / out_name).write_bytes(raw)
            picked[cls].append({
                "file": f"/gallery/{out_name}",
                "trueLabel": cls,
                "trueLabelDisplay": DISPLAY_NAME[cls],
                "gz2Class": row["gz2_class"],
                "assetId": int(row["asset_id"]),
            })

    flat: list[dict] = []
    for c in CLASSES:
        flat.extend(picked[c])
        print(f"  {c}: {len(picked[c])}")
    GALLERY_JSON.parent.mkdir(parents=True, exist_ok=True)
    GALLERY_JSON.write_text(json.dumps(flat, indent=2))
    print(f"wrote {len(flat)} entries to {GALLERY_JSON}")


if __name__ == "__main__":
    main()
