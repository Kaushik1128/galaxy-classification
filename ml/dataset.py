"""PyTorch Dataset that streams Galaxy Zoo 2 images directly from the zip archive.

We never extract the 3 GB of JPGs — each __getitem__ reads one entry on demand.
Zip handles are not picklable across DataLoader workers, so each worker opens
its own handle the first time it's used.
"""

from __future__ import annotations

import io
import os
import zipfile
from pathlib import Path

import pandas as pd
import torch
from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms

from class_map import CLASS_TO_IDX

IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)


def build_transforms(img_size: int, train: bool) -> transforms.Compose:
    """ImageNet-normalized transforms. Training adds light morphology-safe augmentation.

    Galaxies have no canonical orientation, so flips & rotations are fair game.
    Color jitter is kept small — the SDSS color is informative.
    """
    if train:
        return transforms.Compose([
            transforms.CenterCrop(212),
            transforms.Resize(img_size),
            transforms.RandomHorizontalFlip(),
            transforms.RandomVerticalFlip(),
            transforms.RandomRotation(180),
            transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.05),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ])
    return transforms.Compose([
        transforms.CenterCrop(212),
        transforms.Resize(img_size),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])


class GalaxyZipDataset(Dataset):
    """Reads `<asset_id>.jpg` entries from `images_gz2.zip` driven by a CSV of labels."""

    def __init__(self, csv_path: str | Path, zip_path: str | Path, transform):
        self.df = pd.read_csv(csv_path)
        self.zip_path = str(zip_path)
        self.transform = transform
        self._zip_per_pid: dict[int, zipfile.ZipFile] = {}

    def __len__(self) -> int:
        return len(self.df)

    def _zip(self) -> zipfile.ZipFile:
        pid = os.getpid()
        zf = self._zip_per_pid.get(pid)
        if zf is None:
            zf = zipfile.ZipFile(self.zip_path, "r")
            self._zip_per_pid[pid] = zf
        return zf

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, int]:
        row = self.df.iloc[idx]
        entry = f"images/{row['filename']}"
        with self._zip().open(entry) as fp:
            buf = fp.read()
        img = Image.open(io.BytesIO(buf)).convert("RGB")
        x = self.transform(img)
        y = CLASS_TO_IDX[row["label"]]
        return x, y
