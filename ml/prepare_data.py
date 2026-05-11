"""Joins GZ2 labels to image filenames, assigns 5 portfolio classes, balances,
and writes stratified train/val/test CSVs to data/processed/.

Run from project root:
    python ml/prepare_data.py
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

from class_map import CLASSES, assign_class

DATA_RAW = Path("data/raw")
DATA_PROCESSED = Path("data/processed")
LABELS_CSV = DATA_RAW / "gz2_hart16.csv.gz"
MAPPING_CSV = DATA_RAW / "gz2_filename_mapping.csv"

USECOLS = [
    "dr7objid",
    "sample",
    "gz2_class",
    "total_votes",
    "t01_smooth_or_features_a01_smooth_debiased",
    "t01_smooth_or_features_a02_features_or_disk_debiased",
    "t02_edgeon_a04_yes_debiased",
    "t03_bar_a06_bar_debiased",
    "t04_spiral_a08_spiral_debiased",
    "t06_odd_a14_yes_debiased",
    "t08_odd_feature_a24_merger_debiased",
]


def main(per_class: int, val_frac: float, test_frac: float, seed: int) -> None:
    DATA_PROCESSED.mkdir(parents=True, exist_ok=True)

    print(f"Loading {LABELS_CSV} ...")
    labels = pd.read_csv(LABELS_CSV, usecols=USECOLS)
    print(f"  {len(labels):,} rows")

    print(f"Loading {MAPPING_CSV} ...")
    mapping = pd.read_csv(MAPPING_CSV)
    print(f"  {len(mapping):,} rows")

    print("Joining labels <-> mapping ...")
    df = labels.merge(
        mapping[["objid", "asset_id"]],
        left_on="dr7objid",
        right_on="objid",
        how="inner",
    )
    df = df.drop(columns=["objid"])
    print(f"  joined: {len(df):,} rows")

    df = df[df["sample"] == "original"].copy()
    print(f"  after sample=='original': {len(df):,}")
    df = df[df["total_votes"] >= 30]
    print(f"  after total_votes>=30: {len(df):,}")

    print("Assigning portfolio classes ...")
    df["label"] = df.apply(assign_class, axis=1)
    df = df.dropna(subset=["label"])
    print(f"  clean labeled rows: {len(df):,}")
    print(df["label"].value_counts().to_string())

    df["filename"] = df["asset_id"].astype(int).astype(str) + ".jpg"

    rng = np.random.default_rng(seed)
    pieces = []
    for cls in CLASSES:
        sub = df[df["label"] == cls]
        if len(sub) == 0:
            print(f"  WARNING: no rows for class {cls}")
            continue
        take = min(per_class, len(sub))
        sub = sub.sample(n=take, random_state=rng.integers(1 << 31))
        pieces.append(sub)
        print(f"  {cls}: kept {len(sub):,} / {len(df[df['label']==cls]):,}")
    balanced = pd.concat(pieces, ignore_index=True)
    balanced = balanced.sample(frac=1.0, random_state=seed).reset_index(drop=True)

    train_parts, val_parts, test_parts = [], [], []
    for cls in CLASSES:
        sub = balanced[balanced["label"] == cls]
        n = len(sub)
        n_test = int(round(n * test_frac))
        n_val = int(round(n * val_frac))
        sub = sub.sample(frac=1.0, random_state=seed + hash(cls) % 1000).reset_index(drop=True)
        test_parts.append(sub.iloc[:n_test])
        val_parts.append(sub.iloc[n_test : n_test + n_val])
        train_parts.append(sub.iloc[n_test + n_val :])

    cols_out = ["filename", "label", "dr7objid", "asset_id", "gz2_class", "total_votes"]
    train = pd.concat(train_parts, ignore_index=True)[cols_out]
    val = pd.concat(val_parts, ignore_index=True)[cols_out]
    test = pd.concat(test_parts, ignore_index=True)[cols_out]

    for name, part in [("train", train), ("val", val), ("test", test)]:
        out = DATA_PROCESSED / f"{name}.csv"
        part.to_csv(out, index=False)
        print(f"  wrote {out}: {len(part):,} rows")
        print(part["label"].value_counts().to_string())
        print()


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--per-class", type=int, default=5000, help="Max images per class.")
    p.add_argument("--val-frac", type=float, default=0.10)
    p.add_argument("--test-frac", type=float, default=0.10)
    p.add_argument("--seed", type=int, default=42)
    args = p.parse_args()
    main(args.per_class, args.val_frac, args.test_frac, args.seed)
