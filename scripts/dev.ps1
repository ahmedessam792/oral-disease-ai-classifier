# Start the full development stack (Windows, no Docker needed).
# API on :8000 (mock mode without a real model), web on :3000.
$root = Split-Path $PSScriptRoot -Parent

if (-not (Test-Path "$root\apps\api\.venv")) {
    Write-Host "Creating Python venv + installing API dependencies..."
    python -m venv "$root\apps\api\.venv"
    & "$root\apps\api\.venv\Scripts\python.exe" -m pip install -r "$root\apps\api\requirements.txt" -r "$root\apps\api\requirements-dev.txt"
}
if (-not (Test-Path "$root\apps\web\node_modules")) {
    Write-Host "Installing web dependencies..."
    Push-Location "$root\apps\web"; npm install; Pop-Location
}

Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$root\apps\api'; .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$root\apps\web'; npm run dev"

Write-Host "API  -> http://localhost:8000  (docs at /docs)"
Write-Host "Web  -> http://localhost:3000"
