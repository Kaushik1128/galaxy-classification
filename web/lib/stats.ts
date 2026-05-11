import type { GalaxyClass } from "./types";

export interface PerClassStat {
  label: GalaxyClass;
  display: string;
  accuracy: number;
  correct: number;
  total: number;
}

export const MODEL_STATS = {
  testAccuracy: 0.7889,
  testCorrect: 1917,
  testTotal: 2430,
  trainImages: 19445,
  valImages: 2430,
  testImages: 2430,
  architecture: "EfficientNet-B0",
  paramCount: "4.0M",
  epochs: 8,
  classes: 5,
};

export const PER_CLASS_STATS: PerClassStat[] = [
  { label: "edge_on_disk", display: "Edge-on Disk", accuracy: 0.934, correct: 467, total: 500 },
  { label: "merger", display: "Merger", accuracy: 0.8558, correct: 368, total: 430 },
  { label: "elliptical", display: "Elliptical", accuracy: 0.826, correct: 413, total: 500 },
  { label: "barred_spiral", display: "Barred Spiral", accuracy: 0.694, correct: 347, total: 500 },
  { label: "spiral", display: "Spiral", accuracy: 0.644, correct: 322, total: 500 },
];
