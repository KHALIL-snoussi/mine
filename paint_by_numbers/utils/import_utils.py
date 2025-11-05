"""Utilities for optional dependency imports."""
from importlib import import_module


def require_cv2():
    """Import and return the :mod:`cv2` module.

    Raises:
        ImportError: If OpenCV is not available in the environment.
    """
    try:
        return import_module("cv2")
    except ModuleNotFoundError as exc:  # pragma: no cover - error path
        raise ImportError(
            "OpenCV (cv2) is required for this operation. Install "
            "`opencv-python` or `opencv-python-headless`."
        ) from exc
