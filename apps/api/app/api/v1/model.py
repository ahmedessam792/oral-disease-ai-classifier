from fastapi import APIRouter, Request

from app.core.errors import model_not_available
from app.schemas.prediction import DISCLAIMER, InputSize, ModelInfoResponse

router = APIRouter()


@router.get("/model/info", response_model=ModelInfoResponse, tags=["model"])
def model_info(request: Request) -> ModelInfoResponse:
    state = request.app.state.model_state
    if not state.is_ready:
        raise model_not_available()

    metadata = state.metadata
    return ModelInfoResponse(
        model_name=metadata.model_name,
        model_version=metadata.model_version,
        framework=metadata.framework,
        classes=list(state.labels),
        input_size=InputSize(width=metadata.input_width, height=metadata.input_height),
        confidence_threshold=metadata.confidence_threshold,
        max_upload_mb=metadata.max_upload_mb,
        mock=state.is_mock,
        disclaimer=DISCLAIMER,
    )
