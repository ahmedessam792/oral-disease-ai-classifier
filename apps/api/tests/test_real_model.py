"""Real-model integration test — the actual ResNet50V2 .keras file.

Marked `real_model` and skipped automatically when TensorFlow or the model
files are absent, so the default suite stays fast and TF-free:

    pytest -m real_model          # run these
    pytest -m "not real_model"    # everything else

Every image in model/samples/ is pushed through the real production path
(validate -> preprocess -> Keras adapter -> response contract). The sample
images are read IN PLACE and never modified, copied, or committed.

This is a technical integration check, NOT a model evaluation: it asserts
that the machinery works, never that a prediction is correct. No accuracy is
computed and no output is a diagnosis.
"""

import math
from pathlib import Path

import numpy as np
import pytest

from app.adapters.registry import create_adapter
from app.core.config import Settings
from app.services.image_validation import validate_and_decode
from app.services.model_config import load_model_config
from app.services.model_state import initialize_model_state
from app.services.preprocessing import preprocess_image

pytestmark = pytest.mark.real_model

REPO_ROOT = Path(__file__).resolve().parents[3]
MODEL_DIR = REPO_ROOT / "model"
SAMPLES_DIR = MODEL_DIR / "samples"

keras = pytest.importorskip("keras", reason="TensorFlow/Keras not installed")

pytestmark = [
    pytest.mark.real_model,
    pytest.mark.skipif(
        not (MODEL_DIR / "oral_disease_resnet50v2_deployment.keras").exists(),
        reason="real .keras model not present",
    ),
]

# Folder name -> class label ("Mouth_Ulcer" -> "Mouth Ulcer").
def folder_to_label(folder: str) -> str:
    return folder.replace("_", " ")


def sample_images() -> list[Path]:
    if not SAMPLES_DIR.exists():
        return []
    return sorted(p for p in SAMPLES_DIR.rglob("*") if p.is_file())


@pytest.fixture(scope="module")
def real_settings() -> Settings:
    return Settings(_env_file=None, app_env="test", model_mode="real", model_dir=MODEL_DIR)


@pytest.fixture(scope="module")
def real_state(real_settings):
    """Load the real model exactly once for the whole module."""
    state = initialize_model_state(real_settings)
    if state.mode != "real":
        pytest.fail(f"Real model failed to load: mode={state.mode} error={state.error_code}")
    return state


# --------------------------------------------------------------------------
# Configuration and model signature
# --------------------------------------------------------------------------

def test_class_config_is_the_source_of_truth(real_settings):
    metadata, labels = load_model_config(real_settings)

    assert metadata.model_name == "ResNet50V2"
    assert (metadata.input_width, metadata.input_height) == (224, 224)
    assert metadata.channels == 3 and metadata.color_mode == "rgb"
    # The model rescales internally -> the service must feed raw 0-255 pixels.
    assert metadata.normalization == "none"
    assert len(labels) == 6


def test_sample_folders_match_the_configured_classes(real_settings):
    _, labels = load_model_config(real_settings)
    folders = sorted(p.name for p in SAMPLES_DIR.iterdir() if p.is_dir())
    assert sorted(folder_to_label(f) for f in folders) == sorted(labels)


def test_model_loads_and_signature_matches_config(real_state):
    assert real_state.is_ready
    assert real_state.is_mock is False
    model = real_state.adapter._model  # noqa: SLF001 — signature assertion
    assert tuple(model.input_shape[1:]) == (224, 224, 3)
    assert int(model.output_shape[-1]) == len(real_state.labels) == 6


# --------------------------------------------------------------------------
# Every sample image through the real path
# --------------------------------------------------------------------------

@pytest.mark.parametrize("image_path", sample_images(), ids=lambda p: f"{p.parent.name}/{p.name}")
def test_real_inference_on_sample_image(image_path: Path, real_state):
    expected_label = folder_to_label(image_path.parent.name)
    assert expected_label in real_state.labels

    # 1. Validation — the same code the API route runs.
    data = image_path.read_bytes()
    suffix = image_path.suffix.lower()
    mime = "image/png" if suffix == ".png" else "image/jpeg"
    image = validate_and_decode(
        data=data,
        filename=image_path.name,
        content_type=mime,
        max_upload_mb=real_state.metadata.max_upload_mb,
    )

    # 2. Preprocessing — config-driven, pixels stay 0-255.
    batch = preprocess_image(image, real_state.metadata)
    assert batch.shape == (1, 224, 224, 3)
    assert batch.dtype == np.float32
    assert batch.max() > 1.0, "pixels must not be scaled to 0-1 for this model"

    # 3. Inference.
    probabilities = real_state.adapter.predict(batch)

    # 4. Output contract.
    assert len(probabilities) == len(real_state.labels) == 6
    assert all(math.isfinite(p) for p in probabilities), "NaN/inf in output"
    assert all(0.0 <= p <= 1.0 for p in probabilities)
    assert math.isclose(sum(probabilities), 1.0, abs_tol=1e-3)

    predicted = real_state.labels[int(np.argmax(probabilities))]
    assert predicted in real_state.labels
    # NOTE: deliberately NOT asserting predicted == expected_label. This is an
    # integration check, not an accuracy evaluation.


def test_prediction_service_returns_the_api_contract(real_state):
    from app.services.prediction_service import run_prediction

    images = sample_images()
    assert images, "no sample images found under model/samples/"

    image = validate_and_decode(
        data=images[0].read_bytes(),
        filename=images[0].name,
        content_type="image/jpeg",
        max_upload_mb=real_state.metadata.max_upload_mb,
    )
    result = run_prediction(real_state, image)

    assert result.mock is False  # real model => no mock flag => no UI banner
    assert result.model_name == "ResNet50V2"
    assert result.predicted_class in real_state.labels
    assert set(result.probabilities) == set(real_state.labels)
    assert math.isclose(sum(result.probabilities.values()), 1.0, abs_tol=1e-3)
    assert math.isclose(result.confidence, max(result.probabilities.values()), abs_tol=1e-6)


# --------------------------------------------------------------------------
# Output-validation guards (fake outputs, no TF needed beyond the loaded model)
# --------------------------------------------------------------------------

def _adapter_with_labels(labels):
    from app.schemas.metadata import ClassConfig

    config = ClassConfig(
        model="Fake",
        image_size=[224, 224],
        classes=labels,
        pixel_range=[0, 255],
        preprocessing="Built into the model",
    )
    metadata = config.to_metadata(model_path="none.keras", model_version="1.0.0", max_upload_mb=10)
    return create_adapter(metadata, labels, MODEL_DIR, "test")


@pytest.mark.parametrize(
    ("row", "reason"),
    [
        (np.array([0.5, 0.5, np.nan]), "NaN"),
        (np.array([0.5, 0.5, np.inf]), "inf"),
        (np.array([0.2, 0.2]), "wrong length"),
        (np.array([5.0, 3.0, 2.0]), "not a distribution"),
    ],
)
def test_invalid_model_output_is_rejected(row, reason):
    from app.adapters.base import ModelOutputError

    adapter = _adapter_with_labels(["A", "B", "C"])
    with pytest.raises(ModelOutputError):
        adapter._validate_distribution(row)  # noqa: SLF001


def test_valid_distribution_passes():
    adapter = _adapter_with_labels(["A", "B", "C"])
    assert adapter._validate_distribution(np.array([0.2, 0.3, 0.5])) == [0.2, 0.3, 0.5]  # noqa: SLF001
