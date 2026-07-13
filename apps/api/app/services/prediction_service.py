"""Orchestrates preprocess -> adapter.predict -> typed response."""

from PIL import Image

from app.adapters.base import ModelOutputError
from app.core.errors import ApiError
from app.core.logging import get_logger
from app.schemas.prediction import PredictionResponse
from app.services.model_state import ModelState
from app.services.preprocessing import preprocess_image

logger = get_logger(__name__)


def run_prediction(state: ModelState, image: Image.Image) -> PredictionResponse:
    assert state.adapter is not None and state.metadata is not None  # guarded by route

    batch = preprocess_image(image, state.metadata)

    try:
        probabilities = state.adapter.predict(batch)
    except ModelOutputError as exc:
        # A model/config mismatch (wrong class count, NaN, non-softmax output).
        # Detail goes to the logs; the client gets a generic error.
        logger.error("prediction_output_rejected detail=%s", exc)
        raise ApiError(500, "INTERNAL_ERROR", "An unexpected error occurred.") from exc

    if len(probabilities) != len(state.labels):
        logger.error(
            "prediction_shape_mismatch outputs=%d labels=%d",
            len(probabilities),
            len(state.labels),
        )
        raise ApiError(500, "INTERNAL_ERROR", "An unexpected error occurred.")

    distribution = {
        label: round(float(p), 6) for label, p in zip(state.labels, probabilities, strict=True)
    }
    predicted_class = max(distribution, key=distribution.get)  # type: ignore[arg-type]

    logger.info(
        "prediction_completed mode=%s confidence=%.4f", state.mode, distribution[predicted_class]
    )
    return PredictionResponse(
        predicted_class=predicted_class,
        confidence=distribution[predicted_class],
        probabilities=distribution,
        model_name=state.metadata.model_name,
        model_version=state.metadata.model_version,
        mock=state.is_mock,
    )
