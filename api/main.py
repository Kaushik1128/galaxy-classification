"""FastAPI service exposing the galaxy classifier and the curated gallery.

Endpoints:
    GET  /health                 -> liveness probe
    GET  /gallery                -> JSON list of curated gallery items
    GET  /gallery/image/<file>   -> serves a gallery JPG
    POST /predict                -> multipart upload, returns class probabilities
    POST /predict-gallery/<file> -> classify a gallery item by its filename

Run from project root:
    uvicorn api.main:app --reload --port 8000
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from .model import GalaxyClassifier

API_DIR = Path(__file__).resolve().parent
ROOT = API_DIR.parent
GALLERY_JSON = ROOT / "web" / "public" / "gallery.json"
GALLERY_DIR = ROOT / "web" / "public" / "gallery"

MAX_UPLOAD_BYTES = 8 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}

app = FastAPI(title="Galaxy Classifier API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

classifier = GalaxyClassifier()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "classes": classifier.classes,
        "img_size": classifier.img_size,
    }


@app.get("/gallery")
def gallery() -> JSONResponse:
    if not GALLERY_JSON.exists():
        return JSONResponse([])
    return JSONResponse(json.loads(GALLERY_JSON.read_text()))


@app.get("/gallery/image/{filename}")
def gallery_image(filename: str) -> FileResponse:
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(400, "Invalid filename")
    path = GALLERY_DIR / filename
    if not path.exists():
        raise HTTPException(404, "Gallery image not found")
    return FileResponse(path, media_type="image/jpeg")


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, f"Unsupported content type: {file.content_type}")
    body = await file.read()
    if len(body) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File too large (max 8 MB)")
    if len(body) == 0:
        raise HTTPException(400, "Empty file")
    try:
        return classifier.predict(body)
    except Exception as e:
        raise HTTPException(400, f"Could not classify image: {e}") from e


@app.post("/predict-gallery/{filename}")
def predict_gallery(filename: str) -> dict:
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(400, "Invalid filename")
    path = GALLERY_DIR / filename
    if not path.exists():
        raise HTTPException(404, "Gallery image not found")
    return classifier.predict(path.read_bytes())
