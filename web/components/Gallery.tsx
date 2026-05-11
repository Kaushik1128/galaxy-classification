"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchGallery } from "@/lib/api";
import type { GalleryItem } from "@/lib/types";
import GalaxyCard from "./GalaxyCard";
import GalleryFilter, { type FilterKey } from "./GalleryFilter";

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    fetchGallery()
      .then(setItems)
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: 0,
      elliptical: 0,
      spiral: 0,
      barred_spiral: 0,
      edge_on_disk: 0,
      merger: 0,
    };
    if (items) {
      c.all = items.length;
      for (const it of items) c[it.trueLabel]++;
    }
    return c;
  }, [items]);

  const filtered = !items
    ? []
    : filter === "all"
    ? items
    : items.filter((it) => it.trueLabel === filter);

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
    <div className="space-y-6">
      <GalleryFilter active={filter} counts={counts} onChange={setFilter} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((item, i) => (
          <GalaxyCard key={item.assetId} item={item} index={i} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center text-white/50 text-sm">
          No galaxies in this class.
        </div>
      )}
    </div>
  );
}
