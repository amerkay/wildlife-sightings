FROM python:3.11-slim

# system deps for libsndfile (SoundFile) + mp3 decode
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 libmpg123-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better Docker layer caching
COPY requirements.txt /app/requirements.txt

# Install runtime deps from requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app
COPY app.py /app/app.py

# Non-root user (optional hardening)
RUN useradd -ms /bin/bash appuser
USER appuser

# Expose FastAPI
EXPOSE 8020

# Start server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8020"]
