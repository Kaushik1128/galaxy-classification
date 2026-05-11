"use client";

import { motion } from "framer-motion";
import { CLASS_COLOR, type GalaxyClass } from "@/lib/types";

export type FilterKey = "all" | GalaxyClass;

interface Props {
  active: FilterKey;
  counts: Record<FilterKey, number>;
  onChange: (key: FilterKey) => void;
}

const PILLS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "elliptical", label: "Elliptical" },
  { key: "spiral", label: "Spiral" },
  { key: "barred_spiral", label: "Barred Spiral" },
  { key: "edge_on_disk", label: "Edge-on Disk" },
  { key: "merger", label: "Merger" },
];

export default function GalleryFilter({ active, counts, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {PILLS.map((p) => {
        const isActive = active === p.key;
        const colorKey = p.key === "all" ? null : CLASS_COLOR[p.key as GalaxyClass];
        const count = counts[p.key] ?? 0;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.key)}
            className={`relative px-4 py-2.5 md:py-2 rounded-full text-sm md:text-sm min-h-[40px] flex items-center transition-all duration-200
              ${isActive
                ? `glass-strong text-white ${colorKey ? `glow-${colorKey}` : ""}`
                : "glass text-white/65 hover:text-white hover:bg-white/5"}`}
          >
            {isActive && (
              <motion.span
                layoutId="filter-active"
                className={`absolute inset-0 rounded-full ${
                  colorKey ? `bg-${colorKey}` : "bg-white"
                } opacity-10`}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {colorKey && (
                <span className={`w-1.5 h-1.5 rounded-full bg-${colorKey}`} />
              )}
              {p.label}
              <span className="text-white/40 tabular-nums">{count}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
