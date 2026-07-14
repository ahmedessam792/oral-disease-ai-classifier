#!/usr/bin/env bash
# Assembles deploy/cloud-run/ into a buildable local Docker context for the
# Arcus backend on Google Cloud Run. Copies live source only — never invents
# or edits it. This script never authenticates, pushes, uploads, or deploys;
# it only arranges files on disk.
#
# What it copies (from the single source of truth in apps/api and model/):
#   apps/api/app                 -> deploy/cloud-run/app
#   apps/api/requirements.txt    -> deploy/cloud-run/requirements.txt
#   apps/api/requirements-tf.txt -> deploy/cloud-run/requirements-tf.txt
#   model/class_config.json      -> deploy/cloud-run/model/class_config.json
#
# The trained .keras model is copied ONLY when explicitly requested with
# --with-model, and only that one named file — never model/samples/, never
# anything else under model/. Without the flag (the default), no model bytes
# move at all.
#
# The generated files are gitignored (see .gitignore): re-run this script
# before every local build so the image always builds from current source,
# never a stale hand-maintained copy.
#
# Usage:
#   scripts/sync-cloud-run.sh               # app + requirements + config
#   scripts/sync-cloud-run.sh --with-model   # + the trained weight
set -euo pipefail
cd "$(dirname "$0")/.."

DEST="deploy/cloud-run"
MODEL_FILENAME="oral_disease_resnet50v2_deployment.keras"
WITH_MODEL=0

for arg in "$@"; do
  case "$arg" in
    --with-model) WITH_MODEL=1 ;;
    *)
      echo "error: unknown argument '$arg' (expected: --with-model)" >&2
      exit 1
      ;;
  esac
done

fail() { echo "error: $1" >&2; exit 1; }

[ -d apps/api/app ]              || fail "apps/api/app not found — run this from a full checkout of the repo."
[ -f apps/api/requirements.txt ] || fail "apps/api/requirements.txt not found."
[ -f apps/api/requirements-tf.txt ] || fail "apps/api/requirements-tf.txt not found."
[ -f model/class_config.json ]   || fail "model/class_config.json not found."

rm -rf "$DEST/app" "$DEST/model"
mkdir -p "$DEST/model"

cp -r apps/api/app "$DEST/app"
cp apps/api/requirements.txt "$DEST/requirements.txt"
cp apps/api/requirements-tf.txt "$DEST/requirements-tf.txt"
cp model/class_config.json "$DEST/model/class_config.json"

# Drop bytecode caches picked up by the recursive copy.
find "$DEST/app" -type d -name "__pycache__" -prune -exec rm -rf {} +

if [ "$WITH_MODEL" -eq 1 ]; then
  [ -f "model/$MODEL_FILENAME" ] || fail "--with-model was requested but model/$MODEL_FILENAME is missing."
  cp "model/$MODEL_FILENAME" "$DEST/model/$MODEL_FILENAME"
  echo "Synced into $DEST/ (app, requirements*.txt, model/class_config.json, and the trained model)."
else
  echo "Synced into $DEST/ (app, requirements*.txt, model/class_config.json)."
  echo "Next: re-run with --with-model to add the trained weight for a local"
  echo "build, or upload it directly to Artifact Registry / the Cloud Run"
  echo "build — never commit it to this repository."
fi
