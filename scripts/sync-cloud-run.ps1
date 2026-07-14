# Assembles deploy/cloud-run/ into a buildable local Docker context for the
# Arcus backend on Google Cloud Run. Copies live source only - never invents
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
# -IncludeModel, and only that one named file - never model/samples/, never
# anything else under model/. Without the switch (the default), no model
# bytes move at all.
#
# The generated files are gitignored (see .gitignore): re-run this script
# before every local build so the image always builds from current source,
# never a stale hand-maintained copy.
#
# Usage:
#   scripts/sync-cloud-run.ps1                  # app + requirements + config
#   scripts/sync-cloud-run.ps1 -IncludeModel     # + the trained weight

param(
    [switch]$IncludeModel
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$Dest = "deploy/cloud-run"
$ModelFilename = "oral_disease_resnet50v2_deployment.keras"

function Fail($Message) {
    Write-Error "error: $Message"
    exit 1
}

if (-not (Test-Path "apps/api/app")) { Fail "apps/api/app not found - run this from a full checkout of the repo." }
if (-not (Test-Path "apps/api/requirements.txt")) { Fail "apps/api/requirements.txt not found." }
if (-not (Test-Path "apps/api/requirements-tf.txt")) { Fail "apps/api/requirements-tf.txt not found." }
if (-not (Test-Path "model/class_config.json")) { Fail "model/class_config.json not found." }

Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$Dest/app", "$Dest/model"
New-Item -ItemType Directory -Force "$Dest/model" | Out-Null

Copy-Item -Recurse "apps/api/app" "$Dest/app"
Copy-Item "apps/api/requirements.txt" "$Dest/requirements.txt"
Copy-Item "apps/api/requirements-tf.txt" "$Dest/requirements-tf.txt"
Copy-Item "model/class_config.json" "$Dest/model/class_config.json"

Get-ChildItem -Path "$Dest/app" -Recurse -Directory -Filter "__pycache__" |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

if ($IncludeModel) {
    $modelSource = "model/$ModelFilename"
    if (-not (Test-Path $modelSource)) { Fail "-IncludeModel was requested but $modelSource is missing." }
    Copy-Item $modelSource "$Dest/model/$ModelFilename"
    Write-Host "Synced into $Dest/ (app, requirements*.txt, model/class_config.json, and the trained model)."
} else {
    Write-Host "Synced into $Dest/ (app, requirements*.txt, model/class_config.json)."
    Write-Host "Next: re-run with -IncludeModel to add the trained weight for a local"
    Write-Host "build, or upload it directly to Artifact Registry / the Cloud Run"
    Write-Host "build - never commit it to this repository."
}
