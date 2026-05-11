"""Maps Galaxy Zoo 2 labels to the 5 portfolio classes used by the model & UI."""

from __future__ import annotations

import pandas as pd

CLASSES: tuple[str, ...] = (
    "elliptical",
    "spiral",
    "barred_spiral",
    "edge_on_disk",
    "merger",
)
CLASS_TO_IDX: dict[str, int] = {c: i for i, c in enumerate(CLASSES)}
IDX_TO_CLASS: dict[int, str] = {i: c for c, i in CLASS_TO_IDX.items()}

DISPLAY_NAME: dict[str, str] = {
    "elliptical": "Elliptical",
    "spiral": "Spiral",
    "barred_spiral": "Barred Spiral",
    "edge_on_disk": "Edge-on Disk",
    "merger": "Merger",
}

MERGER_THRESHOLD = 0.40
SMOOTH_CLEAN = 0.50
FEATURES_CLEAN = 0.40
EDGEON_CLEAN = 0.50
BAR_CLEAN = 0.40
SPIRAL_CLEAN = 0.50


def assign_class(row: pd.Series) -> str | None:
    """Return the portfolio class for one Galaxy Zoo 2 row, or None to drop it."""
    g = str(row.get("gz2_class", "") or "")

    merger_p = row.get("t08_odd_feature_a24_merger_debiased", 0.0) or 0.0
    odd_p = row.get("t06_odd_a14_yes_debiased", 0.0) or 0.0
    if merger_p >= MERGER_THRESHOLD and odd_p >= 0.30:
        return "merger"

    if g.startswith("A"):
        return None

    smooth_p = row.get("t01_smooth_or_features_a01_smooth_debiased", 0.0) or 0.0
    features_p = row.get("t01_smooth_or_features_a02_features_or_disk_debiased", 0.0) or 0.0

    if g.startswith("E"):
        return "elliptical" if smooth_p >= SMOOTH_CLEAN else None

    if not g.startswith("S"):
        return None

    if features_p < FEATURES_CLEAN:
        return None

    if g.startswith("Se"):
        edgeon_p = row.get("t02_edgeon_a04_yes_debiased", 0.0) or 0.0
        return "edge_on_disk" if edgeon_p >= EDGEON_CLEAN else None

    if g.startswith("SB"):
        bar_p = row.get("t03_bar_a06_bar_debiased", 0.0) or 0.0
        spiral_p = row.get("t04_spiral_a08_spiral_debiased", 0.0) or 0.0
        if bar_p >= BAR_CLEAN and spiral_p >= SPIRAL_CLEAN:
            return "barred_spiral"
        return None

    spiral_p = row.get("t04_spiral_a08_spiral_debiased", 0.0) or 0.0
    if spiral_p >= SPIRAL_CLEAN:
        return "spiral"
    return None
