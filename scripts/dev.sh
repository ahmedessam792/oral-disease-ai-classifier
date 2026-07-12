#!/usr/bin/env bash
# Start the full development stack (macOS/Linux, no Docker needed).
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -d "$root/apps/api/.venv" ]; then
  echo "Creating Python venv + installing API dependencies..."
  python3 -m venv "$root/apps/api/.venv"
  "$root/apps/api/.venv/bin/pip" install -r "$root/apps/api/requirements.txt" -r "$root/apps/api/requirements-dev.txt"
fi
if [ ! -d "$root/apps/web/node_modules" ]; then
  echo "Installing web dependencies..."
  (cd "$root/apps/web" && npm install)
fi

trap 'kill 0' EXIT
(cd "$root/apps/api" && .venv/bin/python -m uvicorn app.main:app --reload --port 8000) &
(cd "$root/apps/web" && npm run dev) &
echo "API  -> http://localhost:8000  (docs at /docs)"
echo "Web  -> http://localhost:3000"
wait
