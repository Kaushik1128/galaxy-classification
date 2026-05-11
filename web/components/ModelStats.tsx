"use client";

import { motion } from "framer-motion";
import { MODEL_STATS, PER_CLASS_STATS } from "@/lib/stats";
import { CLASS_COLOR } from "@/lib/types";

export default function ModelStats() {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="glass-strong rounded-2xl p-6 sm:p-8 lg:col-span-2 flex flex-col justify-center"
        >
          <p className="text-xs uppercase tracking-widest text-white/50 mb-2">
            Held-out test accuracy
          </p>
          <h3 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold bg-gradient-to-r from-cosmos-glow via-white to-pink-300 bg-clip-text text-transparent">
            {(MODEL_STATS.testAccuracy * 100).toFixed(1)}%
          </h3>
          <p className="text-sm text-white/60 mt-3 tabular-nums">
            {MODEL_STATS.testCorrect.toLocaleString()} of{" "}
            {MODEL_STATS.testTotal.toLocaleString()} test images classified correctly
          </p>
          <p className="text-xs text-white/40 mt-4 leading-relaxed">
            Test set is held out from training — these images were never seen
            during fine-tuning.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass rounded-2xl p-6 lg:col-span-3"
        >
          <p className="text-xs uppercase tracking-widest text-white/50 mb-4">
            Accuracy by class
          </p>
          <ul className="space-y-3">
            {PER_CLASS_STATS.map((s, i) => {
              const c = CLASS_COLOR[s.label];
              return (
                <li key={s.label}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className={`text-sm text-${c}`}>{s.display}</span>
                    <span className="text-sm text-white/80 tabular-nums">
                      {(s.accuracy * 100).toFixed(1)}%
                      <span className="text-white/40 ml-2 text-xs">
                        {s.correct}/{s.total}
                      </span>
                    </span>
                  </div>
                  <div className="bar-track">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.accuracy * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.15 + i * 0.08, ease: "easeOut" }}
                      className={`h-full bg-${c}`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Architecture", value: MODEL_STATS.architecture, sub: `${MODEL_STATS.paramCount} params` },
          { label: "Training images", value: MODEL_STATS.trainImages.toLocaleString(), sub: "Galaxy Zoo 2" },
          { label: "Epochs", value: String(MODEL_STATS.epochs), sub: "AdamW + cosine LR" },
          { label: "Classes", value: String(MODEL_STATS.classes), sub: "morphological types" },
        ].map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="glass rounded-xl p-4"
          >
            <p className="text-[10px] uppercase tracking-widest text-white/45">
              {f.label}
            </p>
            <p className="text-lg md:text-xl font-display text-white mt-1">{f.value}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{f.sub}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass rounded-2xl p-5 border-l-4 border-blue-400/50"
      >
        <p className="text-xs uppercase tracking-widest text-white/45 mb-2">
          Honest note
        </p>
        <p className="text-sm text-white/70 leading-relaxed">
          The model&apos;s real weakness is telling{" "}
          <span className="text-spiral">spirals</span> apart from{" "}
          <span className="text-barred">barred spirals</span> — those two
          classes share most of their morphology and the bar can be subtle even
          to human classifiers. Edge-on disks are easy because the silhouette
          is unmistakable.
        </p>
      </motion.div>
    </div>
  );
}
