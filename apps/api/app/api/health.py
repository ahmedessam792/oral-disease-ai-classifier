from fastapi import APIRouter, Request

from app.schemas.prediction import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["health"])
def health(request: Request) -> HealthResponse:
    state = request.app.state.model_state
    return HealthResponse(status="ok", model_loaded=state.is_ready, mode=state.mode)
