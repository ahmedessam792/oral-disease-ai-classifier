from fastapi import APIRouter, Request, UploadFile

from app.core.errors import model_not_available
from app.schemas.prediction import PredictionResponse
from app.services.image_validation import validate_and_decode
from app.services.prediction_service import run_prediction

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse, tags=["prediction"])
async def predict(request: Request, file: UploadFile) -> PredictionResponse:
    state = request.app.state.model_state
    if not state.is_ready:
        raise model_not_available()

    data = await file.read()
    image = validate_and_decode(
        data=data,
        filename=file.filename,
        content_type=file.content_type,
        max_upload_mb=state.metadata.max_upload_mb,
    )
    # Everything stays in memory; nothing is written to disk or logged.
    return run_prediction(state, image)
