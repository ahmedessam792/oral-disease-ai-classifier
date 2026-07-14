# FastAPI backend image — targets Hugging Face Spaces (Docker Space, port 7860)
# and local docker-compose. See docs/DEPLOYMENT.md.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # TF logs: 0=all, 1=no INFO, 2=no INFO/WARNING. Keep the startup output
    # readable; real errors still surface.
    TF_CPP_MIN_LOG_LEVEL=2

WORKDIR /app

COPY requirements.txt requirements-tf.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Real-model inference. tensorflow-cpu is the same runtime without the CUDA
# payload (~1 GB smaller) — this image only ever runs CPU inference.
# keras is pinned to the version the model was saved with (3.13.2).
RUN pip install --no-cache-dir "tensorflow-cpu==2.21.0" "keras==3.13.2"

# Create the user, and the model mount point it owns, BEFORE copying anything
# — COPY --chown sets ownership as part of the copy itself, so nothing needs a
# recursive chown afterward (which would otherwise duplicate every byte it
# touches into a second image layer — see deploy/huggingface/Dockerfile,
# where that duplicated the ~350 MB model).
RUN useradd --create-home appuser \
    && mkdir -p /app/model \
    && chown appuser:appuser /app/model

# The trained model (.keras) and class_config.json are supplied at deploy time
# — mounted locally by docker-compose, copied into the Space repo on Hugging
# Face. They are never baked into git.
COPY --chown=appuser:appuser app ./app

USER appuser

ENV MODEL_DIR=/app/model \
    APP_ENV=production \
    MODEL_MODE=auto \
    API_PORT=7860

EXPOSE 7860

# Model loading takes ~10-20s on a cold container; give it room before the
# first health probe counts against us.
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD python -c "import os,urllib.request;urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('API_PORT','7860')+'/health')" || exit 1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${API_PORT:-7860}"]
