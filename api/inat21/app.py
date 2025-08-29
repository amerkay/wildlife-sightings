# app.py
import os
import io
from typing import List, Dict, Any
from pathlib import Path
from dataclasses import dataclass

import numpy as np
import torch
from PIL import Image, ImageOps
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoImageProcessor, AutoModelForImageClassification
from ultralytics import YOLO

APP_NAME = "birdimg-fastapi-yolo-classifier"

# ===========
# ENV knobs
# ===========
# Classifier (ConvNeXt-L on iNat21k)
MODEL_ID = os.getenv("MODEL_ID", "timm/convnext_large_mlp.laion2b_ft_augreg_inat21")
TOP_K_DEFAULT = int(os.getenv("TOP_K", "5"))
MIN_CONF_DEFAULT = float(os.getenv("MIN_CONF", "0.0"))
TORCH_NUM_THREADS = int(os.getenv("TORCH_NUM_THREADS", "2"))  # t3a.medium = 2 vCPUs
TORCH_NUM_INTEROP_THREADS = int(os.getenv("TORCH_NUM_INTEROP_THREADS", "1"))

# Detector (YOLOv8 on COCO)
# Default to a path under the user's home to avoid CWD permission issues
DETECTOR_WEIGHTS = os.getenv(
    "DETECTOR_WEIGHTS", str(Path.home() / "models" / "yolov8n.pt")
)  # nano = fastest on CPU
DETECTOR_CONF = float(
    os.getenv("DETECTOR_CONF", "0.25")
)  # detection confidence threshold
DETECTOR_IOU = float(os.getenv("DETECTOR_IOU", "0.5"))  # NMS IoU threshold
DETECTOR_IMGSZ = int(
    os.getenv("DETECTOR_IMGSZ", "384")
)  # inference image size (short side), smaller = faster
DETECTOR_MARGIN = float(
    os.getenv("DETECTOR_MARGIN", "0.05")
)  # % of box size to expand each side
CLASSIFY_ALL_DETS = os.getenv("CLASSIFY_ALL_DETS", "false").lower() in {
    "1",
    "true",
    "yes",
}

# CORS
ALLOW_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "*")

# Torch threading
torch.set_num_threads(TORCH_NUM_THREADS)
torch.set_num_interop_threads(TORCH_NUM_INTEROP_THREADS)

app = FastAPI(title=APP_NAME, version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=(
        [o.strip() for o in ALLOW_ORIGINS.split(",")] if ALLOW_ORIGINS else ["*"]
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy-loaded globals
processor = None
model = None
id2label: Dict[int, str] = {}
detector = None
det_bird_idx: int = -1  # COCO "bird" index from model.names


@dataclass
class Box:
    x1: int
    y1: int
    x2: int
    y2: int
    conf: float
    cls: int


def _clip(val, lo, hi):
    return max(lo, min(hi, val))


@app.on_event("startup")
def _load_models():
    global processor, model, id2label, detector, det_bird_idx
    # Load classifier
    processor = AutoImageProcessor.from_pretrained(MODEL_ID)
    model = AutoModelForImageClassification.from_pretrained(MODEL_ID)
    model.eval()
    id2label = getattr(model.config, "id2label", None) or {}

    # Load detector
    detector = YOLO(DETECTOR_WEIGHTS)
    # Find the index for COCO 'bird' class in this weights' names
    names = {}
    if (
        hasattr(detector, "model")
        and detector.model is not None
        and hasattr(detector.model, "names")
    ):
        names = detector.model.names  # type: ignore
    elif hasattr(detector, "names"):
        names = detector.names

    inv = {v: k for k, v in names.items()} if isinstance(names, dict) else {}
    det_bird_idx = inv.get("bird", 15)  # fallback to typical COCO index


@app.get("/healthz")
def healthz():
    return {
        "status": "ok",
        "app": APP_NAME,
        "classifier_model_id": MODEL_ID,
        "detector_weights": DETECTOR_WEIGHTS,
        "num_labels": int(getattr(model.config, "num_labels", 0)) if model else 0,
        "torch_threads": TORCH_NUM_THREADS,
        "torch_interop_threads": TORCH_NUM_INTEROP_THREADS,
        "detector_conf": DETECTOR_CONF,
        "detector_iou": DETECTOR_IOU,
        "detector_imgsz": DETECTOR_IMGSZ,
        "detector_margin": DETECTOR_MARGIN,
        "classify_all_dets": CLASSIFY_ALL_DETS,
    }


def _classify_pil(
    image: Image.Image, top_k: int, min_conf: float
) -> List[Dict[str, Any]]:
    # Use inference_mode() for faster eval; feed channels_last tensors
    # for better CPU perf
    if processor is None or model is None:
        raise RuntimeError("Models not loaded")

    with torch.inference_mode():
        inputs = processor(images=image, return_tensors="pt")
        if "pixel_values" in inputs:
            inputs["pixel_values"] = inputs["pixel_values"].contiguous(
                memory_format=torch.channels_last
            )
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=-1).squeeze(0)

        vals, idxs = torch.topk(probs, k=top_k)
        results: List[Dict[str, Any]] = []
        for score, idx in zip(vals.tolist(), idxs.tolist()):
            if score < min_conf:
                continue
            label = id2label.get(idx, str(idx))
            results.append({"id": int(idx), "label": label, "confidence": float(score)})
        return results


def _crop_with_margin(
    img_w: int, img_h: int, box: Box, margin_ratio: float
) -> tuple[int, int, int, int]:
    w = box.x2 - box.x1
    h = box.y2 - box.y1
    mx = int(w * margin_ratio)
    my = int(h * margin_ratio)
    x1 = _clip(box.x1 - mx, 0, img_w)
    y1 = _clip(box.y1 - my, 0, img_h)
    x2 = _clip(box.x2 + mx, 0, img_w)
    y2 = _clip(box.y2 + my, 0, img_h)
    return x1, y1, x2, y2


@app.post("/classify")
async def classify(
    file: UploadFile = File(..., description="Bird image (jpg/png/webp)"),
    top_k: int = Query(TOP_K_DEFAULT, ge=1, le=50),
    min_conf: float = Query(MIN_CONF_DEFAULT, ge=0.0, le=1.0),
    det_conf: float = Query(
        None, ge=0.0, le=1.0, description="Override detector confidence"
    ),
    det_iou: float = Query(None, ge=0.0, le=1.0, description="Override detector IoU"),
    det_imgsz: int = Query(
        None, ge=160, le=1280, description="Override detector inference image size"
    ),
    classify_all: bool = Query(None, description="Override CLASSIFY_ALL_DETS"),
    margin: float = Query(
        None, ge=0.0, le=0.5, description="Box expansion margin ratio (0..0.5)"
    ),
):
    """
    Upload a photo; detector finds bird(s) → crops → classifier predicts top-k.
    If no bird is detected, we classify the whole image as a fallback.
    """
    try:
        content = await file.read()
        # Respect EXIF orientation (camera roll)
        image = Image.open(io.BytesIO(content))
        image = ImageOps.exif_transpose(image)
        if image is not None:
            image = image.convert("RGB")
        else:
            raise ValueError("Failed to process image")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    # Detector thresholds
    dconf = DETECTOR_CONF if det_conf is None else det_conf
    diou = DETECTOR_IOU if det_iou is None else det_iou
    dimgsz = DETECTOR_IMGSZ if det_imgsz is None else det_imgsz
    dmargin = DETECTOR_MARGIN if margin is None else margin
    multi = CLASSIFY_ALL_DETS if classify_all is None else bool(classify_all)

    # Run detection
    try:
        if detector is None:
            raise RuntimeError("Detector not loaded")
        # Ultralytics accepts numpy arrays in RGB
        np_img = np.array(image)
        # Use smaller imgsz, filter to bird class in predictor,
        # and cap max_det when not multi
        # NOTE: 'classes' filters outputs; helpful to prune non-bird results early.
        results = detector.predict(
            source=np_img,
            conf=dconf,
            iou=diou,
            imgsz=dimgsz,
            classes=[det_bird_idx] if det_bird_idx >= 0 else None,
            max_det=10 if multi else 1,
            device="cpu",
            verbose=False,
        )
        r = results[0]
        boxes = []
        if r and r.boxes is not None and len(r.boxes) > 0:
            xyxy = r.boxes.xyxy.cpu().numpy().astype(int)  # type: ignore
            confs = r.boxes.conf.cpu().numpy().tolist()  # type: ignore
            clss = r.boxes.cls.cpu().numpy().astype(int).tolist()  # type: ignore
            for (x1, y1, x2, y2), cnf, cls in zip(xyxy, confs, clss):
                if cls == det_bird_idx:  # only keep 'bird'
                    boxes.append(
                        Box(
                            int(x1),
                            int(y1),
                            int(x2),
                            int(y2),
                            float(cnf),
                            int(cls),
                        )
                    )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"detector failed: {e}")

    predictions = []
    img_w, img_h = image.size

    # Choose boxes: all or largest
    if boxes:
        boxes_sorted = sorted(
            boxes, key=lambda b: (b.x2 - b.x1) * (b.y2 - b.y1), reverse=True
        )
        target_boxes = boxes_sorted if multi else boxes_sorted[:1]
        for b in target_boxes:
            x1, y1, x2, y2 = _crop_with_margin(img_w, img_h, b, dmargin)
            crop = image.crop((x1, y1, x2, y2))
            cls_preds = _classify_pil(crop, top_k=top_k, min_conf=min_conf)
            predictions.append(
                {
                    "box": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                        "det_conf": b.conf,
                    },
                    "topk": cls_preds,
                }
            )
    else:
        # Fallback: classify the whole image
        cls_preds = _classify_pil(image, top_k=top_k, min_conf=min_conf)
        predictions.append(
            {
                "box": None,
                "topk": cls_preds,
                "note": "no bird detected; classified full image",
            }
        )

    return {
        "filename": file.filename,
        "detector": {
            "weights": DETECTOR_WEIGHTS,
            "conf": dconf,
            "iou": diou,
            "imgsz": dimgsz,
            "margin": dmargin,
            "classify_all": multi,
        },
        "classifier_model_id": MODEL_ID,
        "predictions": predictions,
    }
