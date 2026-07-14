# Assembles deploy/huggingface/ into a buildable, push-ready Hugging Face
# Space directory. Copies live source only - never invents or edits it.
#
# What it copies (from the single source of truth in apps/api and model/):
#   apps/api/app                 -> deploy/huggingface/app
#   apps/api/requirements.txt    -> deploy/huggingface/requirements.txt
#   apps/api/requirements-tf.txt -> deploy/huggingface/requirements-tf.txt
#   model/class_config.json      -> deploy/huggingface/model/class_config.json
#
# The trained .keras model is copied ONLY when explicitly requested with
# -IncludeModel, and only that one named file - never model/samples/, never
# anything else under model/. Without the switch (the default), no model
# bytes move at all. This is a local convenience for assembling a full build
# context; the weight still belongs in the Space's own git history, not
# GitHub - see deploy/huggingface/README.md.
#
# The generated files are gitignored (see .gitignore): re-run this script
# before every deploy so the Space always builds from current source, never
# a stale hand-maintained copy.
#
# Usage:
#   scripts/sync-huggingface-space.ps1                  # app + requirements + config
#   scripts/sync-huggingface-space.ps1 -IncludeModel     # + the trained weight

param(
    [switch]$IncludeModel
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$Dest = "deploy/huggingface"
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
    Write-Host "Next: add the trained .keras model directly into the Space's git"
    Write-Host "history (git lfs track, add, commit) - never into this repository."
}
