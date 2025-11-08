"""Visualization helpers for QBRIX-style assembly sheets and overlays."""

from __future__ import annotations

import math
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np

try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.utils.opencv import require_cv2
    from paint_by_numbers.logger import logger
except ImportError:  # pragma: no cover - local relative imports for tests
    import sys
    from pathlib import Path as _Path

    sys.path.insert(0, str(_Path(__file__).parent.parent))
    from config import Config  # type: ignore
    from utils.opencv import require_cv2  # type: ignore
    from logger import logger  # type: ignore


class AssemblySheetBuilder:
    """Build 24×24 segment assembly sheets that mirror QBRIX kits."""

    GRID_SIZE = 24
    SEGMENTS_PER_PAGE = 12
    SEGMENT_ROWS = 4
    SEGMENT_COLS = 3

    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config()
        self.cv2 = require_cv2()
        self.cell_px = getattr(self.config, "ASSEMBLY_CELL_SIZE", 28)
        self.tile_padding = getattr(self.config, "ASSEMBLY_TILE_PADDING", 32)
        self.page_padding = getattr(self.config, "ASSEMBLY_PAGE_PADDING", 40)
        self.header_height = getattr(self.config, "ASSEMBLY_HEADER_HEIGHT", 110)
        self.footer_height = getattr(self.config, "ASSEMBLY_FOOTER_HEIGHT", 40)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def build_pages(
        self,
        *,
        label_map: np.ndarray,
        palette: np.ndarray,
        color_ids: Sequence[str],
    ) -> Tuple[List[np.ndarray], Dict]:
        """Create assembly pages from a palette label map.

        Args:
            label_map: 2D array of palette indices for each pixel.
            palette: Palette array (N, 3) in RGB order.
            color_ids: External identifiers for each palette index.

        Returns:
            Tuple ``(pages, metadata)`` where ``pages`` is a list of RGB images and
            ``metadata`` documents the symbol/color mapping.
        """

        if label_map is None:
            raise ValueError("label_map must be provided for assembly generation")

        labels = np.array(label_map)
        if labels.ndim != 2:
            raise ValueError("label_map must be a 2D array of palette indices")

        num_colors = len(palette)
        if len(color_ids) != num_colors:
            raise ValueError("color_ids length must match palette length")

        symbol_table = [self._index_to_symbol(i) for i in range(num_colors)]
        logger.info(
            "Building QBRIX assembly sheets: %d colors, %s IDs",
            num_colors,
            ", ".join(color_ids[: min(5, len(color_ids))]) + ("..." if num_colors > 5 else ""),
        )

        scaled_labels = self._resize_to_grid(labels)
        tiles = self._split_into_tiles(scaled_labels)
        pages = self._render_pages(tiles, symbol_table, color_ids)

        metadata = {
            "grid_size": self.GRID_SIZE,
            "segments_per_page": self.SEGMENTS_PER_PAGE,
            "total_segments": len(tiles),
            "color_symbols": [
                {
                    "index": idx,
                    "symbol": symbol_table[idx],
                    "color_id": color_ids[idx],
                    "rgb": palette[idx].tolist(),
                }
                for idx in range(num_colors)
            ],
        }

        return pages, metadata

    def save_page(self, page: np.ndarray, path: str) -> None:
        """Persist a rendered assembly page to disk."""

        output_path = Path(path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        bgr_page = self.cv2.cvtColor(page, self.cv2.COLOR_RGB2BGR)
        self.cv2.imwrite(str(output_path), bgr_page)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _resize_to_grid(self, labels: np.ndarray) -> np.ndarray:
        target_shape = (self.GRID_SIZE * 7, self.GRID_SIZE * 12)
        resized = self.cv2.resize(
            labels.astype(np.int32),
            (target_shape[1], target_shape[0]),
            interpolation=self.cv2.INTER_NEAREST,
        )
        return resized.astype(np.int32)

    def _split_into_tiles(self, labels: np.ndarray) -> List[np.ndarray]:
        tiles: List[np.ndarray] = []
        for row in range(7):
            for col in range(12):
                y1 = row * self.GRID_SIZE
                y2 = y1 + self.GRID_SIZE
                x1 = col * self.GRID_SIZE
                x2 = x1 + self.GRID_SIZE
                tile = labels[y1:y2, x1:x2]
                tiles.append(tile)
        return tiles

    def _render_pages(
        self,
        tiles: List[np.ndarray],
        symbols: Sequence[str],
        color_ids: Sequence[str],
    ) -> List[np.ndarray]:
        pages: List[np.ndarray] = []
        tile_images = [self._render_tile(idx, tile, symbols, color_ids) for idx, tile in enumerate(tiles)]

        tiles_per_page = self.SEGMENTS_PER_PAGE
        num_pages = math.ceil(len(tile_images) / tiles_per_page)

        for page_idx in range(num_pages):
            page_tiles = tile_images[page_idx * tiles_per_page : (page_idx + 1) * tiles_per_page]
            page = self._render_page(page_idx, page_tiles, symbols, color_ids)
            pages.append(page)
        return pages

    def _render_tile(
        self,
        tile_index: int,
        tile: np.ndarray,
        symbols: Sequence[str],
        color_ids: Sequence[str],
    ) -> np.ndarray:
        grid = tile.astype(int)
        grid_size = grid.shape[0]
        tile_width = grid_size * self.cell_px + self.tile_padding * 2
        tile_height = (
            self.header_height
            + grid_size * self.cell_px
            + self.footer_height
            + self.tile_padding
        )
        image = np.ones((tile_height, tile_width, 3), dtype=np.uint8) * 255

        # Header
        title = f"Segment {tile_index + 1:02d}"
        self.cv2.putText(
            image,
            title,
            (self.tile_padding, 50),
            self.cv2.FONT_HERSHEY_DUPLEX,
            1.1,
            (45, 45, 45),
            2,
            self.cv2.LINE_AA,
        )
        self.cv2.putText(
            image,
            "24×24 grid · symbol + color ID",
            (self.tile_padding, 80),
            self.cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (90, 90, 90),
            1,
            self.cv2.LINE_AA,
        )

        # Grid cells
        for y in range(grid_size):
            for x in range(grid_size):
                palette_idx = int(grid[y, x])
                symbol = symbols[palette_idx]
                color_id = color_ids[palette_idx]

                x1 = self.tile_padding + x * self.cell_px
                y1 = self.header_height + y * self.cell_px
                x2 = x1 + self.cell_px
                y2 = y1 + self.cell_px

                self.cv2.rectangle(image, (x1, y1), (x2, y2), (235, 235, 235), -1)
                self.cv2.rectangle(image, (x1, y1), (x2, y2), (180, 180, 180), 1)

                # Symbol (bold) and color ID (tiny) inside the cell
                self.cv2.putText(
                    image,
                    symbol,
                    (x1 + 4, y1 + int(self.cell_px * 0.65)),
                    self.cv2.FONT_HERSHEY_DUPLEX,
                    0.45,
                    (30, 30, 30),
                    1,
                    self.cv2.LINE_AA,
                )
                self.cv2.putText(
                    image,
                    color_id,
                    (x1 + 2, y2 - 3),
                    self.cv2.FONT_HERSHEY_SIMPLEX,
                    0.35,
                    (120, 120, 120),
                    1,
                    self.cv2.LINE_AA,
                )

        # Footer summary
        coverage = np.bincount(grid.flatten(), minlength=len(symbols))
        dominant_idx = int(np.argmax(coverage))
        footer_text = f"Dominant: {symbols[dominant_idx]} / {color_ids[dominant_idx]}"
        self.cv2.putText(
            image,
            footer_text,
            (self.tile_padding, tile_height - 20),
            self.cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (70, 70, 70),
            1,
            self.cv2.LINE_AA,
        )

        return image

    def _render_page(
        self,
        page_index: int,
        tiles: Sequence[np.ndarray],
        symbols: Sequence[str],
        color_ids: Sequence[str],
    ) -> np.ndarray:
        if not tiles:
            raise ValueError("Cannot render an empty assembly page")

        tile_height, tile_width, _ = tiles[0].shape
        page_width = (
            self.page_padding
            + self.SEGMENT_COLS * tile_width
            + (self.SEGMENT_COLS - 1) * self.page_padding
        )
        page_height = (
            self.header_height
            + self.SEGMENT_ROWS * tile_height
            + (self.SEGMENT_ROWS - 1) * self.page_padding
            + self.footer_height
        )

        page = np.ones((page_height, page_width, 3), dtype=np.uint8) * 255

        # Page header
        header_text = f"QBRIX Assembly Sheet · Page {page_index + 1}"
        self.cv2.putText(
            page,
            header_text,
            (self.page_padding, 60),
            self.cv2.FONT_HERSHEY_DUPLEX,
            1.2,
            (25, 25, 25),
            2,
            self.cv2.LINE_AA,
        )
        subheader = "Auto-emphasized subject gets ≥70% color budget"
        self.cv2.putText(
            page,
            subheader,
            (self.page_padding, 95),
            self.cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (90, 90, 90),
            1,
            self.cv2.LINE_AA,
        )

        for idx, tile in enumerate(tiles):
            row = idx // self.SEGMENT_COLS
            col = idx % self.SEGMENT_COLS
            y = self.header_height + row * (tile_height + self.page_padding)
            x = self.page_padding + col * (tile_width + self.page_padding)
            page[y : y + tile_height, x : x + tile_width] = tile

        legend_text = "Symbols map directly to color IDs across every page"
        self.cv2.putText(
            page,
            legend_text,
            (self.page_padding, page_height - 20),
            self.cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (80, 80, 80),
            1,
            self.cv2.LINE_AA,
        )

        return page

    def _index_to_symbol(self, index: int) -> str:
        alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        base = len(alphabet)
        symbol = ""
        value = index
        while True:
            value, remainder = divmod(value, base)
            symbol = alphabet[remainder] + symbol
            if value == 0:
                break
            value -= 1
        return symbol


__all__ = ["AssemblySheetBuilder"]
