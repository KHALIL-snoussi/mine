import json
from pathlib import Path

import numpy as np
import pytest

try:
    import cv2  # type: ignore
except Exception as exc:  # pragma: no cover - exercised only when cv2 missing
    pytest.skip(
        "OpenCV (cv2) could not be imported. Install the 'opencv-python-headless' "
        "package and ensure system libraries such as libGL are present. Original "
        f"import error: {exc}",
        allow_module_level=True,
    )


def _create_test_portrait(path: Path) -> Path:
    image = np.full((480, 360, 3), 210, dtype=np.uint8)

    # Background gradient
    for i in range(image.shape[0]):
        shade = 210 - int(i * 0.1)
        image[i, :, :] = (shade, shade + 5, shade + 10)

    center = (image.shape[1] // 2, image.shape[0] // 2)
    cv2.circle(image, (center[0], center[1] - 60), 110, (220, 185, 150), -1)  # face
    cv2.circle(image, (center[0] - 40, center[1] - 80), 18, (90, 70, 50), -1)
    cv2.circle(image, (center[0] + 40, center[1] - 80), 18, (90, 70, 50), -1)
    cv2.ellipse(image, (center[0], center[1] - 20), (55, 30), 0, 0, 180, (150, 80, 70), 6)
    cv2.rectangle(image, (center[0] - 90, center[1] + 40), (center[0] + 90, center[1] + 180), (75, 55, 40), -1)

    output_path = path / "auto_emphasis_portrait.jpg"
    cv2.imwrite(str(output_path), image)
    return output_path


def test_auto_emphasis_pipeline_generates_qbrix_assets(tmp_path):
    from paint_by_numbers.main import PaintByNumbersGenerator

    image_path = _create_test_portrait(tmp_path)
    output_dir = tmp_path / "qbrix_out"

    generator = PaintByNumbersGenerator()
    result = generator.generate(
        input_path=str(image_path),
        output_dir=str(output_dir),
        model="original",
        n_colors=12,
    )

    assert "emphasis" in result, "Expected emphasis summary in generation results"
    summary = result["emphasis"]

    assert summary["auto_detected"] is True
    color_split = summary["color_allocation"]
    assert color_split["emphasized_percent"] >= pytest.approx(0.7, abs=0.05)
    assert color_split["emphasized_colors"] > color_split["background_colors"]

    regions = summary["region_configs"]
    assert regions["background_min_region"] >= regions["emphasized_min_region"] * 1.5

    assembly = result.get("assembly")
    assert assembly is not None, "Assembly sheet metadata missing"
    metadata = assembly["metadata"]
    assert metadata["grid_size"] == 24
    assert metadata["segments_per_page"] == 12
    assert metadata["total_segments"] == 84
    assert len(metadata["color_symbols"]) == len(generator.palette)

    pages = assembly["pages"]
    assert len(pages) == 7
    for page_path in pages:
        assert Path(page_path).exists(), f"Assembly page missing: {page_path}"

    # Confirm metadata is persisted for downstream use
    analysis_path = output_dir / f"{image_path.stem}_difficulty_analysis.json"
    assert analysis_path.exists()
    with open(analysis_path) as fh:
        difficulty = json.load(fh)
    assert "overall_difficulty" in difficulty


def test_assembly_sheet_builder_outputs_metadata(tmp_path):
    from paint_by_numbers.utils.visualization import AssemblySheetBuilder

    builder = AssemblySheetBuilder()
    grid_h = builder.GRID_SIZE * 7
    grid_w = builder.GRID_SIZE * 12

    # Construct deterministic label map with three bands to validate symbol mapping
    label_map = np.zeros((grid_h, grid_w), dtype=np.int32)
    label_map[:, grid_w // 3 : 2 * grid_w // 3] = 1
    label_map[:, 2 * grid_w // 3 :] = 2

    palette = np.array([
        [210, 210, 210],
        [120, 85, 60],
        [40, 40, 40],
    ], dtype=np.uint8)
    color_ids = ["1478", "2351", "379"]

    pages, metadata = builder.build_pages(
        label_map=label_map,
        palette=palette,
        color_ids=color_ids,
    )

    assert metadata["grid_size"] == builder.GRID_SIZE
    assert metadata["segments_per_page"] == builder.SEGMENTS_PER_PAGE
    assert metadata["total_segments"] == 84
    assert [entry["symbol"] for entry in metadata["color_symbols"]] == ["A", "B", "C"]

    # Ensure pages were generated and can be saved to disk
    assert len(pages) == 7
    output_path = tmp_path / "assembly_page_test.png"
    builder.save_page(pages[0], str(output_path))
    assert output_path.exists()
