"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { predictUpload } from "@/lib/api";
import { CLASS_COLOR, CLASS_DESCRIPTIONS, type PredictionResponse } from "@/lib/types";
import PredictionBars from "./PredictionBars";

export default function UploadZone() {
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pred, setPred] = useState<PredictionResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setPred(null);
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image too large — max 8 MB.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setBusy(true);
    try {
      const result = await predictUpload(file);
      setPred(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [previewUrl]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const predColorKey = pred ? CLASS_COLOR[pred.prediction] : null;

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`glass-strong rounded-2xl p-6 sm:p-8 min-h-[280px] sm:min-h-[360px] flex flex-col items-center justify-center text-center cursor-pointer transition-all
          ${dragOver ? "border-cosmos-glow scale-[1.01]" : ""}
          ${pred && predColorKey ? `glow-${predColorKey}` : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Uploaded galaxy"
            className="max-h-[300px] rounded-xl object-contain"
          />
        ) : (
          <>
            <div className="mb-4 text-cosmos-glow opacity-80">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <h3 className="text-lg font-display mb-1">Classify your own galaxy</h3>
            <p className="text-sm text-white/60 max-w-xs">
              Drop an image here or click to upload. JPEG, PNG, or WebP up to 8 MB.
            </p>
            <p className="text-xs text-white/40 mt-3">
              Works best with the galaxy centered and roughly filling the frame.
            </p>
          </>
        )}
      </div>

      <div className="min-h-[280px] sm:min-h-[360px] flex flex-col">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl p-6"
            >
              <p className="text-red-300 text-sm font-medium">Couldn&apos;t classify</p>
              <p className="text-white/60 text-xs mt-2 font-mono">{error}</p>
            </motion.div>
          )}

          {!error && busy && (
            <motion.div
              key="busy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl p-8 flex flex-col items-center justify-center flex-1"
            >
              <div className="w-12 h-12 border-2 border-cosmos-glow border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-white/70 text-sm">Running inference…</p>
            </motion.div>
          )}

          {!error && !busy && pred && predColorKey && (
            <motion.div
              key="pred"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-strong rounded-2xl p-6 space-y-5"
            >
              <div>
                <p className="text-xs uppercase tracking-widest text-white/50 mb-1">
                  Prediction
                </p>
                <h3 className={`text-3xl font-display text-${predColorKey}`}>
                  {pred.predictionDisplay}
                </h3>
                <p className="text-sm text-white/60 mt-2">
                  {CLASS_DESCRIPTIONS[pred.prediction]}
                </p>
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-xs uppercase tracking-widest text-white/50">
                    Confidence
                  </span>
                  <span className={`text-2xl font-display text-${predColorKey}`}>
                    {(pred.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <PredictionBars probabilities={pred.probabilities} />
              </div>
            </motion.div>
          )}

          {!error && !busy && !pred && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl p-6 text-center text-sm text-white/50 flex items-center justify-center flex-1"
            >
              Results will appear here.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
