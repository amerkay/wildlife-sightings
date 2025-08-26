# app.py
import os
import tempfile
from pathlib import Path
from typing import List, Dict

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import librosa
import soundfile as sf

# BirdNET 0.1.x functional API
from birdnet import (
    SpeciesPredictions,
    predict_species_within_audio_file,
    predict_species_at_location_and_time,
)

APP_NAME = "birdnet-fastapi"
DEFAULT_TOP_K = int(os.getenv("TOP_K", "5"))
MIN_CONF_DEFAULT = float(os.getenv("MIN_CONF", "0.0"))
ALLOW_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "*")

app = FastAPI(title=APP_NAME, version="1.0")

# CORS (usually you'll proxy via Nuxt/Nitro, but this helps during dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=(
        [o.strip() for o in ALLOW_ORIGINS.split(",")] if ALLOW_ORIGINS else ["*"]
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz():
    """
    Warmup endpoint – you can call this after boot to ensure the app is alive.
    """
    return {"status": "ok", "app": APP_NAME}


@app.get("/geo")
def geo(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    week: int = Query(26, ge=1, le=52, description="1..52 (ISO week)"),
    top_k: int = Query(DEFAULT_TOP_K, ge=1, le=50),
):
    """
    Get likely species at a location/time (priors). Useful to re-rank model outputs.
    """
    try:
        pred_map = predict_species_at_location_and_time(lat, lon, week=week)
        items = sorted(pred_map.items(), key=lambda kv: kv[1], reverse=True)[:top_k]
        preds = [{"label": k, "confidence": float(v)} for k, v in items]
        return {"lat": lat, "lon": lon, "week": week, "predictions": preds}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"geo prediction failed: {e}")


@app.post("/predict")
async def predict(
    file: UploadFile = File(..., description="Audio file (wav, flac, ogg, mp3, etc.)"),
    top_k: int = Query(DEFAULT_TOP_K, ge=1, le=50),
    min_conf: float = Query(MIN_CONF_DEFAULT, ge=0.0, le=1.0),
    species_filter: str = Query(
        "", description="Optional comma-separated substrings to keep, e.g. 'Owl,Strix'"
    ),
):
    """
    Analyze an uploaded audio file and return per-segment top-k predictions.
    Output shape:
    {
      "filename": "...",
      "segments": [
        {"start": 0.0, "end": 3.0, "predictions": [{"label": "...", "confidence": 0.81}, ...]},
        ...
      ]
    }
    """
    try:
        # Persist to a temp file for BirdNET
        suffix = Path(file.filename or "audio").suffix or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            data = await file.read()
            tmp.write(data)
            tmp_path = Path(tmp.name)

        # Convert to mono if needed using librosa
        try:
            # Load audio file and convert to mono
            audio, sr = librosa.load(str(tmp_path), sr=None, mono=True)

            # Create a new mono file for BirdNET
            mono_suffix = ".wav"  # Always use WAV for processed audio
            with tempfile.NamedTemporaryFile(
                delete=False, suffix=mono_suffix
            ) as mono_tmp:
                mono_path = Path(mono_tmp.name)

            # Save as mono WAV file
            sf.write(str(mono_path), audio, sr)

            # Use the mono file for BirdNET processing
            birdnet_path = mono_path
        except Exception as audio_error:
            # If audio conversion fails, try the original file
            print(f"Audio conversion warning: {audio_error}")
            birdnet_path = tmp_path

        # Run BirdNET audio inference (wrap the generator in SpeciesPredictions)
        sp = SpeciesPredictions(predict_species_within_audio_file(birdnet_path))

        # Optional filtering on label substrings (case-insensitive)
        filters = [s.strip().lower() for s in species_filter.split(",") if s.strip()]

        segments: List[Dict] = []
        # Iterate explicitly over mapping items: ((start, end), SpeciesPrediction)
        for (start, end), species_pred in sp.items():
            items = list(species_pred.items())
            if filters:
                items = [kv for kv in items if any(f in kv[0].lower() for f in filters)]
            if min_conf > 0:
                items = [kv for kv in items if kv[1] >= min_conf]
            items.sort(key=lambda kv: kv[1], reverse=True)
            items = items[:top_k]

            if items:
                segments.append(
                    {
                        "start": float(start),
                        "end": float(end),
                        "predictions": [
                            {"label": k, "confidence": float(v)} for k, v in items
                        ],
                    }
                )

        return {
            "filename": file.filename,
            "num_segments": len(segments),
            "segments": segments,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"prediction failed: {e}")
    finally:
        # Clean up temporary files
        try:
            if "tmp_path" in locals() and tmp_path.exists():
                tmp_path.unlink(missing_ok=True)
        except Exception:
            pass
        try:
            if "mono_path" in locals() and mono_path.exists():
                mono_path.unlink(missing_ok=True)
        except Exception:
            pass
