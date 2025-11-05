"""Utilities for safely accessing the optional OpenCV dependency."""
from __future__ import annotations

import importlib
from types import ModuleType
from typing import Optional

__all__ = ["cv2_available", "get_cv2", "require_cv2", "describe_missing_cv2"]

_CV2_MODULE: Optional[ModuleType] = None
_CV2_ERROR: Optional[BaseException] = None


def _load_cv2() -> Optional[ModuleType]:
    global _CV2_MODULE, _CV2_ERROR

    if _CV2_MODULE is not None:
        return _CV2_MODULE

    if _CV2_ERROR is not None:
        return None

    try:
        _CV2_MODULE = importlib.import_module("cv2")
    except Exception as exc:  # pragma: no cover - exercised only when cv2 missing
        _CV2_ERROR = exc
        return None

    return _CV2_MODULE


def describe_missing_cv2() -> str:
    """Return a human friendly explanation for missing OpenCV installs."""

    if _CV2_ERROR is None:
        # Trigger load attempt to populate error cache
        _load_cv2()

    if _CV2_ERROR is None:
        return "OpenCV is available"

    return (
        "OpenCV (cv2) could not be imported. Install the 'opencv-python-headless' "
        "package and ensure system libraries such as libGL are present. Original "
        f"import error: {_CV2_ERROR}"
    )


def get_cv2(raise_if_missing: bool = False) -> Optional[ModuleType]:
    """Return the OpenCV module if available.

    Args:
        raise_if_missing: When True, raise a RuntimeError if OpenCV cannot be loaded.

    Returns:
        The loaded cv2 module or ``None`` when unavailable and ``raise_if_missing``
        is False.
    """

    module = _load_cv2()

    if module is None and raise_if_missing:
        raise RuntimeError(describe_missing_cv2())

    return module


def require_cv2() -> ModuleType:
    """Return the OpenCV module or raise a descriptive error when missing."""

    module = get_cv2(raise_if_missing=True)
    assert module is not None  # for type-checkers
    return module


def cv2_available() -> bool:
    """Check whether OpenCV can be imported in the current environment."""

    return get_cv2(raise_if_missing=False) is not None
