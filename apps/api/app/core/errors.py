"""Typed API errors and global exception handlers.

Every error leaving the API uses the envelope: {"error": {"code", "message"}}.
Public messages are safe by design — no paths, stack traces, or internals.
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logging import get_logger

logger = get_logger(__name__)


class ApiError(Exception):
    """An intentional, typed, client-safe error."""

    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


# Convenience constructors keep codes consistent across the codebase.
def empty_file() -> ApiError:
    return ApiError(400, "EMPTY_FILE", "The uploaded file is empty.")


def invalid_file_type(detail: str) -> ApiError:
    return ApiError(400, "INVALID_FILE_TYPE", detail)


def file_too_large(max_mb: int) -> ApiError:
    return ApiError(413, "FILE_TOO_LARGE", f"File exceeds the {max_mb} MB upload limit.")


def invalid_image(detail: str = "The file is not a valid, readable image.") -> ApiError:
    return ApiError(400, "INVALID_IMAGE", detail)


def image_dimensions(detail: str) -> ApiError:
    return ApiError(400, "IMAGE_TOO_LARGE_DIMENSIONS", detail)


def model_not_available() -> ApiError:
    return ApiError(
        503,
        "MODEL_NOT_AVAILABLE",
        "The classification model is not available. Please try again later.",
    )


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code, content={"error": {"code": code, "message": message}}
    )


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def handle_api_error(request: Request, exc: ApiError) -> JSONResponse:
        logger.info(
            "api_error code=%s status=%s path=%s", exc.code, exc.status_code, request.url.path
        )
        return _error_response(exc.status_code, exc.code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        logger.info("validation_error path=%s", request.url.path)
        return _error_response(
            400, "VALIDATION_ERROR", "The request is missing or has an invalid 'file' field."
        )

    @app.exception_handler(Exception)
    async def handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
        # Full detail goes to server logs only; the client gets a generic message.
        logger.exception("unhandled_error path=%s", request.url.path)
        return _error_response(500, "INTERNAL_ERROR", "An unexpected error occurred.")
