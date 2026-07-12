# FastAPI backend image — targets Hugging Face Spaces (Docker Space, port 7860)
# and local docker-compose. See docs/DEPLOYMENT.md.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt requirements-tf.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Real-model deployments: bake in the TensorFlow runtime (CPU build is
# smaller and sufficient for inference). Uncomment when the model exists:
# RUN pip install --no-cache-dir "tensorflow-cpu>=2.16,<3"

COPY app ./app

# The trained model + metadata.json + labels.json are supplied at deploy
# time (copied into the Space repo or mounted); never baked into git.
RUN useradd --create-home appuser \
    && mkdir -p /app/model \
    && chown -R appuser:appuser /app
USER appuser

ENV MODEL_DIR=/app/model \
    APP_ENV=production \
    API_PORT=7860

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import os,urllib.request;urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('API_PORT','7860')+'/health')" || exit 1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${API_PORT:-7860}"]
