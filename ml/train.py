"""Train an EfficientNet-B0 galaxy-morphology classifier.

Runs identically on local CPU and on a Colab T4 GPU; just change the flags.
Reads CSVs from `data/processed/` and streams images out of `data/raw/images_gz2.zip`.

Examples
--------
Quick CPU smoke test (one epoch, tiny subset, no workers):
    python ml/train.py --epochs 1 --limit-train 64 --limit-val 64 --workers 0 --batch-size 8

Full local CPU run (slow):
    python ml/train.py --epochs 5 --batch-size 32 --workers 4

Colab GPU:
    python ml/train.py --epochs 10 --batch-size 128 --workers 4 --device cuda --amp
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset
from torchvision import models
from tqdm import tqdm

from class_map import CLASSES
from dataset import GalaxyZipDataset, build_transforms

ROOT = Path(__file__).resolve().parent.parent
PROCESSED = ROOT / "data" / "processed"
ZIP_PATH = ROOT / "data" / "raw" / "images_gz2.zip"
ARTIFACTS = ROOT / "ml" / "artifacts"


def build_model(num_classes: int, freeze_backbone: bool) -> nn.Module:
    weights = models.EfficientNet_B0_Weights.IMAGENET1K_V1
    net = models.efficientnet_b0(weights=weights)
    if freeze_backbone:
        for p in net.parameters():
            p.requires_grad = False
    in_features = net.classifier[1].in_features
    net.classifier[1] = nn.Linear(in_features, num_classes)
    return net


def make_loader(csv: Path, train: bool, args, limit: int | None) -> DataLoader:
    tfm = build_transforms(args.img_size, train=train)
    ds = GalaxyZipDataset(csv, ZIP_PATH, tfm)
    if limit is not None and limit < len(ds):
        ds = Subset(ds, range(limit))
    return DataLoader(
        ds,
        batch_size=args.batch_size,
        shuffle=train,
        num_workers=args.workers,
        pin_memory=(args.device == "cuda"),
        persistent_workers=args.workers > 0,
    )


@torch.no_grad()
def evaluate(model, loader, device, criterion) -> tuple[float, float]:
    model.eval()
    total = 0
    correct = 0
    loss_sum = 0.0
    for x, y in tqdm(loader, desc="val", leave=False):
        x = x.to(device, non_blocking=True)
        y = y.to(device, non_blocking=True)
        logits = model(x)
        loss = criterion(logits, y)
        loss_sum += loss.item() * x.size(0)
        correct += (logits.argmax(1) == y).sum().item()
        total += x.size(0)
    return loss_sum / max(total, 1), correct / max(total, 1)


def export_onnx(model: nn.Module, img_size: int, out_path: Path) -> None:
    model.eval().cpu()
    dummy = torch.zeros(1, 3, img_size, img_size)
    torch.onnx.export(
        model,
        dummy,
        str(out_path),
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
        dynamo=False,
    )


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--epochs", type=int, default=8)
    p.add_argument("--batch-size", type=int, default=32)
    p.add_argument("--lr", type=float, default=3e-4)
    p.add_argument("--weight-decay", type=float, default=1e-4)
    p.add_argument("--img-size", type=int, default=224)
    p.add_argument("--workers", type=int, default=2)
    p.add_argument("--device", choices=["cpu", "cuda"], default="cuda" if torch.cuda.is_available() else "cpu")
    p.add_argument("--amp", action="store_true", help="Mixed precision (CUDA only).")
    p.add_argument("--freeze-backbone", action="store_true")
    p.add_argument("--limit-train", type=int, default=None)
    p.add_argument("--limit-val", type=int, default=None)
    p.add_argument("--label-smoothing", type=float, default=0.05)
    p.add_argument("--out", type=str, default=str(ARTIFACTS))
    args = p.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    device = torch.device(args.device)
    print(f"device: {device}  amp: {args.amp and device.type == 'cuda'}")

    train_loader = make_loader(PROCESSED / "train.csv", train=True, args=args, limit=args.limit_train)
    val_loader = make_loader(PROCESSED / "val.csv", train=False, args=args, limit=args.limit_val)
    print(f"train batches: {len(train_loader)}  val batches: {len(val_loader)}")

    model = build_model(num_classes=len(CLASSES), freeze_backbone=args.freeze_backbone).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=args.label_smoothing)
    optim = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad],
        lr=args.lr,
        weight_decay=args.weight_decay,
    )
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(optim, T_max=args.epochs)
    scaler = torch.amp.GradScaler("cuda", enabled=(args.amp and device.type == "cuda"))

    best_val_acc = 0.0
    history = []

    for epoch in range(1, args.epochs + 1):
        model.train()
        epoch_t0 = time.time()
        running_loss = 0.0
        running_correct = 0
        running_total = 0
        bar = tqdm(train_loader, desc=f"epoch {epoch}/{args.epochs}")
        for x, y in bar:
            x = x.to(device, non_blocking=True)
            y = y.to(device, non_blocking=True)
            optim.zero_grad(set_to_none=True)
            with torch.amp.autocast(device_type=device.type, enabled=(args.amp and device.type == "cuda")):
                logits = model(x)
                loss = criterion(logits, y)
            if scaler.is_enabled():
                scaler.scale(loss).backward()
                scaler.step(optim)
                scaler.update()
            else:
                loss.backward()
                optim.step()
            running_loss += loss.item() * x.size(0)
            running_correct += (logits.argmax(1) == y).sum().item()
            running_total += x.size(0)
            bar.set_postfix(loss=f"{running_loss/running_total:.3f}", acc=f"{running_correct/running_total:.3f}")
        sched.step()

        val_loss, val_acc = evaluate(model, val_loader, device, criterion)
        epoch_secs = time.time() - epoch_t0
        train_loss = running_loss / max(running_total, 1)
        train_acc = running_correct / max(running_total, 1)
        print(
            f"epoch {epoch}: train_loss={train_loss:.4f} train_acc={train_acc:.4f}  "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.4f}  ({epoch_secs:.1f}s)"
        )
        history.append({
            "epoch": epoch,
            "train_loss": train_loss,
            "train_acc": train_acc,
            "val_loss": val_loss,
            "val_acc": val_acc,
            "lr": sched.get_last_lr()[0],
            "secs": epoch_secs,
        })
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(
                {"model": model.state_dict(), "classes": list(CLASSES), "img_size": args.img_size},
                out_dir / "best.pt",
            )
            print(f"  saved best.pt (val_acc={val_acc:.4f})")

    (out_dir / "history.json").write_text(json.dumps(history, indent=2))
    print(f"best val_acc: {best_val_acc:.4f}")

    print("loading best weights for ONNX export ...")
    ckpt = torch.load(out_dir / "best.pt", map_location="cpu", weights_only=False)
    model.load_state_dict(ckpt["model"])
    onnx_path = out_dir / "galaxy_classifier.onnx"
    export_onnx(model, args.img_size, onnx_path)
    print(f"  wrote {onnx_path}")

    meta = {
        "classes": list(CLASSES),
        "img_size": args.img_size,
        "imagenet_normalize": True,
        "best_val_acc": best_val_acc,
    }
    (out_dir / "model_meta.json").write_text(json.dumps(meta, indent=2))
    print("done.")


if __name__ == "__main__":
    main()
