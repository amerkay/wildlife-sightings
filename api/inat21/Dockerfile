# Dockerfile
FROM python:3.11-slim

# System libs for Pillow and OpenCV; libGL fixes "libGL.so.1" import errors
# (Debian package 'libgl1' provides libGL.so.1; libglib2.0-0 is commonly needed by cv2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 \
    libjpeg62-turbo zlib1g libpng16-16 libopenjp2-7 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user early and prepare writable home
RUN useradd -ms /bin/bash appuser
RUN mkdir -p /home/appuser/app \
    /home/appuser/.config/Ultralytics \
    /home/appuser/.cache/ultralytics \
    /home/appuser/models && \
    chown -R appuser:appuser /home/appuser

# Use a WORKDIR that appuser owns
WORKDIR /home/appuser/app

# Use requirements.txt for Python deps
COPY --chown=appuser:appuser requirements.txt /home/appuser/app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /home/appuser/app/requirements.txt

# Copy app
COPY --chown=appuser:appuser app.py /home/appuser/app/app.py

USER appuser

# Cache dirs (optional)
ENV HF_HOME=/home/appuser/.cache/huggingface \
    TORCH_HOME=/home/appuser/.cache/torch \
    ULTRALYTICS_CACHE=/home/appuser/.cache/ultralytics \
    YOLO_CONFIG_DIR=/home/appuser/.config/Ultralytics

RUN mkdir -p $HF_HOME $TORCH_HOME $ULTRALYTICS_CACHE $YOLO_CONFIG_DIR

EXPOSE 8021
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8021"]