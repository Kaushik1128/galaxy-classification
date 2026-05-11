"use client";

import { useEffect, useState } from "react";
import { fetchGallery } from "@/lib/api";
import type { GalleryItem } from "@/lib/types";
import GalaxyCard from "./GalaxyCard";

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGallery()
      .then(setItems)
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  if (error) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-red-300 text-sm">Couldn&apos;t reach the classifier API.</p>
        <p className="text-white/50 text-xs mt-2 font-mono">{error}</p>
        <p className="text-white/40 text-xs mt-3">
          Make sure the API is running:{" "}
          <span className="font-mono text-cosmos-glow">
            uvicorn api.main:app --port 8000
          </span>
        </p>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-square bg-white/5" />
            <div className="p-4 space-y-2">
              <div className="h-3 w-1/3 bg-white/10 rounded" />
              <div className="h-2 w-full bg-white/5 rounded" />
              <div className="h-2 w-full bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {items.map((item, i) => (
        <GalaxyCard key={item.assetId} item={item} index={i} />
      ))}
    </div>
  );
}
