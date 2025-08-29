# app.py
import os
import tempfile
from pathlib import Path
from typing import List, Dict

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import librosa
import soundfile as sf
from pydub import AudioSegment

# BirdNET 0.1.x APIs
from birdnet.types import SpeciesPredictions
from birdnet.audio_based_prediction import predict_species_within_audio_file
from birdnet.location_based_prediction import predict_species_at_location_and_time

APP_NAME = "birdnet-fastapi"
DEFAULT_TOP_K = int(os.getenv("TOP_K", "5"))
MIN_CONF_DEFAULT = float(os.getenv("MIN_CONF", "0.0"))
ALLOW_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "*")
LANG = os.getenv("BIRDNET_LANG", "en_us")
# Choose backend: "litert" (TFLite runtime) is fastest on CPU; threads ~= vCPU count
BIRDNET_BACKEND = os.getenv("BIRDNET_BACKEND", "litert")
BIRDNET_VERSION = os.getenv("BIRDNET_VERSION", "v2.4")
BIRDNET_THREADS = int(
    os.getenv("BIRDNET_THREADS", str(max(1, min(4, (os.cpu_count() or 2)))))
)

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
    fast: bool = Query(False, description="Disable bandpass filter for speed"),
    batch_size: int = Query(
        None, ge=1, le=32, description="Override batch size for 3s chunks"
    ),
):
    """
    Analyze an uploaded audio file and return per-segment top-k predictions.
    Output shape:
    {
      "filename": "...",
      "segments": [
        {"start": 0.0, "end": 3.0, "predictions": [{"label": "...",
            "confidence": 0.81}, ...]},
        ...
      ]
    }
    """
    # Initialize paths for cleanup
    tmp_path = None
    mono_path = None

    try:
        # Persist to a temp file for BirdNET
        suffix = Path(file.filename or "audio").suffix or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            data = await file.read()
            tmp.write(data)
            tmp_path = Path(tmp.name)

        # Convert to mono WAV using pydub (handles WebM and other formats)
        try:
            # Use pydub to load and convert any audio format to mono WAV
            audio_segment = AudioSegment.from_file(str(tmp_path))

            # Convert to mono and set sample rate to 22050 (BirdNET default)
            audio_segment = audio_segment.set_channels(1).set_frame_rate(22050)

            # Create a new mono WAV file for BirdNET
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as mono_tmp:
                mono_path = Path(mono_tmp.name)

            # Export as WAV
            audio_segment.export(str(mono_path), format="wav")

            # Use the converted file for BirdNET processing
            birdnet_path = mono_path

        except Exception as audio_error:
            # If pydub conversion fails, try librosa as fallback
            try:
                print(f"Pydub conversion failed: {audio_error}, trying librosa...")
                audio, sr = librosa.load(str(tmp_path), sr=22050, mono=True)

                with tempfile.NamedTemporaryFile(
                    delete=False, suffix=".wav"
                ) as mono_tmp:
                    mono_path = Path(mono_tmp.name)

                sf.write(str(mono_path), audio, sr)
                birdnet_path = mono_path

            except Exception as librosa_error:
                print(
                    f"Both audio conversions failed. Pydub: {audio_error}, "
                    f"Librosa: {librosa_error}"
                )
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Unsupported audio format. Please use WAV, MP3, FLAC, or OGG. "
                        f"Error: {librosa_error}"
                    ),
                )

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
            "fast_mode": fast,
            "batch_size": batch_size,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"prediction failed: {e}")
    finally:
        # Clean up temporary files
        try:
            if tmp_path and tmp_path.exists():
                tmp_path.unlink(missing_ok=True)
        except Exception:
            pass
        try:
            if mono_path and mono_path.exists():
                mono_path.unlink(missing_ok=True)
        except Exception:
            pass
