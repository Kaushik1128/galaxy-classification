export type GalaxyClass =
  | "elliptical"
  | "spiral"
  | "barred_spiral"
  | "edge_on_disk"
  | "merger";

export interface GalleryItem {
  file: string;
  trueLabel: GalaxyClass;
  trueLabelDisplay: string;
  gz2Class: string;
  assetId: number;
}

export interface ProbabilityEntry {
  label: GalaxyClass;
  labelDisplay: string;
  probability: number;
}

export interface PredictionResponse {
  prediction: GalaxyClass;
  predictionDisplay: string;
  confidence: number;
  probabilities: ProbabilityEntry[];
}

export const CLASS_COLOR: Record<GalaxyClass, string> = {
  elliptical: "elliptical",
  spiral: "spiral",
  barred_spiral: "barred",
  edge_on_disk: "edge",
  merger: "merger",
};

export const CLASS_DESCRIPTIONS: Record<GalaxyClass, string> = {
  elliptical: "Smooth, ellipsoidal swarms of older stars with little gas, no spiral structure.",
  spiral: "Disk galaxies with curving spiral arms tracing star-forming regions.",
  barred_spiral: "Spirals with a luminous central bar of stars feeding the inner regions.",
  edge_on_disk: "Disk galaxies seen edge-on, often revealing a thin dust lane.",
  merger: "Two or more galaxies caught mid-collision, tidally disturbed.",
};
