"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { galleryImageUrl, predictGallery } from "@/lib/api";
import { CLASS_COLOR, type GalleryItem, type PredictionResponse } from "@/lib/types";
import PredictionBars from "./PredictionBars";

interface Props {
  item: GalleryItem;
  index: number;
}

export default function GalaxyCard({ item, index }: Props) {
  const [pred, setPred] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const filename = item.file.split("/").pop()!;
    const t = setTimeout(() => {
      predictGallery(filename)
        .then((r) => !cancelled && setPred(r))
        .catch((e) => !cancelled && setError(String(e.message ?? e)));
    }, index * 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [item.file, index]);

  const filename = item.file.split("/").pop()!;
  const imgSrc = galleryImageUrl(filename);

  const isCorrect = pred && pred.prediction === item.trueLabel;
  const predColorKey = pred ? CLASS_COLOR[pred.prediction] : "spiral";

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.04 }}
      className={`glass rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.015] ${
        pred ? `glow-${predColorKey}` : ""
      }`}
    >
      <div className="relative aspect-square bg-cosmos-deep">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={`Galaxy ${item.assetId}`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cosmos-deep/80 via-transparent to-transparent" />
        {!pred && !error && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-xs text-white/60">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cosmos-glow animate-pulse-slow" />
            <span>Classifying…</span>
          </div>
        )}
        {pred && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-3 left-3 right-3 flex items-center justify-between"
          >
            <span className={`text-xs font-display text-${predColorKey} tracking-wide`}>
              {pred.predictionDisplay.toUpperCase()}
            </span>
            <span className="text-xs text-white/80 tabular-nums">
              {(pred.confidence * 100).toFixed(1)}%
            </span>
          </motion.div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-white/50">
          <span className="font-mono">#{item.assetId}</span>
          <span>
            ground truth:{" "}
            <span className={`text-${CLASS_COLOR[item.trueLabel]}`}>
              {item.trueLabelDisplay}
            </span>
          </span>
        </div>
        {error ? (
          <p className="text-xs text-red-400">Error: {error}</p>
        ) : pred ? (
          <>
            <PredictionBars probabilities={pred.probabilities} compact />
            <div className="text-[11px] text-white/40 pt-1 border-t border-white/5">
              {isCorrect ? "Model correct" : `Model says ${pred.predictionDisplay}`}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bar-track">
                <div
                  className="h-full bg-white/10 animate-pulse"
                  style={{ width: `${100 - i * 15}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}
