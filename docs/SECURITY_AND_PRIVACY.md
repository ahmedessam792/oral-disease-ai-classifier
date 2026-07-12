---
title: Security & Privacy
tags:
  - security
  - privacy
---

# Security & Privacy

Users may upload images of their own mouths — medical-adjacent data. The system is designed so there is nothing to leak.

## Image handling

- Processed **entirely in memory**: read → validate → preprocess → predict → respond. Never written to disk, never stored, no temp files.
- No database, no upload directory, no caching of request bodies.
- Responses contain only class names and numbers — never the image.

## Upload validation (defense in depth)

Client pre-checks (UX), then the API independently enforces, in order: non-empty → extension allowlist → MIME allowlist → size limit (413 before decode) → Pillow decode + integrity verify → dimension budget (≥32px, ≤8000px/side, ≤50 MP) with `Image.MAX_IMAGE_PIXELS` as a decompression-bomb backstop. EXIF orientation is applied and then the pixel data alone is used.

## Logging

Structured logs contain event names, error codes, modes, and counts — never image bytes, EXIF contents, filenames' contents, absolute model paths, or secrets. Unexpected exceptions log a full trace server-side while the client receives only `INTERNAL_ERROR`.

## Transport & CORS

- CORS origins come from `CORS_ORIGINS` (comma-separated allowlist). The app **refuses to start** in production with a wildcard.
- Only `GET` and `POST` are allowed; credentials are disabled.
- Production traffic rides Vercel/Hugging Face TLS.

## Secrets & repo hygiene

- Configuration via environment variables; `.env` files are gitignored, with `.env.example` as the template.
- `.gitignore` excludes model artifacts, datasets, uploads, virtualenvs, caches, and build output.
- No analytics, no trackers, no third-party scripts; fonts are self-hosted via `next/font`.

## Honest limitations

> [!WARNING]
> This is an educational student project — not HIPAA/GDPR-audited medical software. There is no authentication, no rate limiting beyond the platform's, and free-tier hosting offers no formal data-processing agreement. The UI tells users not to upload identifying images if that concerns them, and results are always framed as educational, never diagnostic.
