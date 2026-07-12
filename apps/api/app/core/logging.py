"""Structured, sanitized logging.

Privacy rules enforced by convention across the codebase: never log image
bytes, EXIF/metadata contents, absolute model paths, or secrets. Log only
event names, error codes, and non-sensitive scalars.
"""

import logging
import sys


def configure_logging(level: int = logging.INFO) -> None:
    root = logging.getLogger()
    if root.handlers:  # already configured (e.g. by uvicorn or tests)
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s", "%Y-%m-%dT%H:%M:%S")
    )
    root.addHandler(handler)
    root.setLevel(level)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
