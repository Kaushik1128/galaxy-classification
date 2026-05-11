"use client";

import { motion } from "framer-motion";
import { CLASS_COLOR, type ProbabilityEntry } from "@/lib/types";

interface Props {
  probabilities: ProbabilityEntry[];
  compact?: boolean;
}

export default function PredictionBars({ probabilities, compact }: Props) {
  return (
    <ul className={compact ? "space-y-1.5" : "space-y-2.5"}>
      {probabilities.map((p) => {
        const colorKey = CLASS_COLOR[p.label];
        return (
          <li key={p.label} className={compact ? "text-xs" : "text-sm"}>
            <div className="flex justify-between mb-1">
              <span className={`text-${colorKey}`}>{p.labelDisplay}</span>
              <span className="text-white/70 tabular-nums">
                {(p.probability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bar-track">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${p.probability * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full bg-${colorKey}`}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
