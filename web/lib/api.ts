import type { GalleryItem, PredictionResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchGallery(): Promise<GalleryItem[]> {
  const res = await fetch(`${API_URL}/gallery`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Gallery fetch failed: ${res.status}`);
  return res.json();
}

const galleryPredictionCache = new Map<string, Promise<PredictionResponse>>();

export function predictGallery(filename: string): Promise<PredictionResponse> {
  let p = galleryPredictionCache.get(filename);
  if (!p) {
    p = fetch(`${API_URL}/predict-gallery/${encodeURIComponent(filename)}`, {
      method: "POST",
    }).then((res) => {
      if (!res.ok) throw new Error(`Predict failed: ${res.status}`);
      return res.json();
    });
    galleryPredictionCache.set(filename, p);
  }
  return p;
}

export async function predictUpload(file: File): Promise<PredictionResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/predict`, { method: "POST", body: form });
  if (!res.ok) {
    let detail: string;
    try {
      const j = await res.json();
      detail = j.detail ?? `HTTP ${res.status}`;
    } catch {
      detail = `HTTP ${res.status}`;
    }
    throw new Error(detail);
  }
  return res.json();
}

export function galleryImageUrl(filename: string): string {
  return `${API_URL}/gallery/image/${encodeURIComponent(filename)}`;
}
