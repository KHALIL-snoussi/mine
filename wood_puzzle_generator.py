#!/usr/bin/env python3
"""
Professional Wood Puzzle Generator for Laser Cutting
Generates A4-sized wooden mosaic portraits with realistic color mapping.

Author: Claude
Date: 2025-11-04
"""

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple, Dict, Optional

import numpy as np
import cv2
from scipy.spatial import Voronoi
from scipy.spatial import distance
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import svgwrite
from shapely.geometry import Polygon as ShapelyPolygon, MultiPolygon, Point
from shapely.ops import unary_union


# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class PuzzleConfig:
    """Configuration for wood puzzle generation."""
    width_mm: float = 210.0          # A4 width
    height_mm: float = 297.0         # A4 height
    num_pieces: int = 120            # Target number of pieces
    kerf_mm: float = 0.2             # Laser kerf (total gap between pieces)
    seed: int = 42                   # Random seed for reproducibility
    lloyd_iterations: int = 2        # Lloyd relaxation iterations
    frame_margin_mm: float = 10.0    # Inner frame margin
    num_colors: int = 20             # Number of wood tones
    preview_dpi: int = 300           # Preview image DPI
    use_kmeans_palette: bool = False # Use k-means or fixed wood palette


# ============================================================================
# WOOD PALETTE
# ============================================================================

# Natural 20-tone wood palette (birch → walnut → ebony)
WOOD_PALETTE_RGB = np.array([
    [242, 226, 200],  # Very light birch
    [228, 210, 181],  # Light birch
    [214, 192, 163],  # Birch
    [203, 178, 149],  # Light maple
    [192, 164, 132],  # Maple
    [183, 151, 118],  # Light oak
    [173, 140, 106],  # Oak
    [162, 130, 97],   # Medium oak
    [150, 118, 86],   # Dark oak
    [139, 108, 77],   # Light walnut
    [126, 97, 70],    # Walnut
    [114, 87, 63],    # Medium walnut
    [102, 79, 58],    # Dark walnut
    [92, 72, 52],     # Very dark walnut
    [83, 66, 47],     # Light mahogany
    [74, 60, 44],     # Mahogany
    [64, 53, 39],     # Dark mahogany
    [55, 46, 35],     # Light ebony
    [46, 39, 30],     # Ebony
    [38, 33, 26],     # Dark ebony
], dtype=np.uint8)


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    """Convert RGB tuple to hex string."""
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"


def poisson_disk_sampling(width: float, height: float, min_dist: float,
                          seed: int = 42, k: int = 30) -> np.ndarray:
    """
    Generate points using Poisson disk sampling for uniform distribution.

    Args:
        width: Width of the sampling region
        height: Height of the sampling region
        min_dist: Minimum distance between points
        seed: Random seed
        k: Number of attempts before rejection

    Returns:
        Array of (x, y) points
    """
    rng = np.random.default_rng(seed)

    # Cell size for spatial grid
    cell_size = min_dist / np.sqrt(2)
    grid_w = int(np.ceil(width / cell_size))
    grid_h = int(np.ceil(height / cell_size))
    grid = np.full((grid_h, grid_w), -1, dtype=int)

    points = []
    active = []

    # Start with random point
    x0 = rng.uniform(0, width)
    y0 = rng.uniform(0, height)
    points.append([x0, y0])
    active.append(0)

    gx = int(x0 / cell_size)
    gy = int(y0 / cell_size)
    grid[gy, gx] = 0

    while active:
        idx = rng.integers(0, len(active))
        point_idx = active[idx]
        px, py = points[point_idx]

        found = False
        for _ in range(k):
            # Generate random point around current point
            angle = rng.uniform(0, 2 * np.pi)
            radius = rng.uniform(min_dist, 2 * min_dist)
            nx = px + radius * np.cos(angle)
            ny = py + radius * np.sin(angle)

            # Check if point is valid
            if 0 <= nx < width and 0 <= ny < height:
                gx = int(nx / cell_size)
                gy = int(ny / cell_size)

                # Check neighborhood in grid
                valid = True
                for dy in range(max(0, gy - 2), min(grid_h, gy + 3)):
                    for dx in range(max(0, gx - 2), min(grid_w, gx + 3)):
                        if grid[dy, dx] != -1:
                            other = points[grid[dy, dx]]
                            dist = np.sqrt((nx - other[0])**2 + (ny - other[1])**2)
                            if dist < min_dist:
                                valid = False
                                break
                    if not valid:
                        break

                if valid:
                    new_idx = len(points)
                    points.append([nx, ny])
                    active.append(new_idx)
                    grid[gy, gx] = new_idx
                    found = True
                    break

        if not found:
            active.pop(idx)

    return np.array(points)


def lloyd_relaxation(points: np.ndarray, bounds: Tuple[float, float, float, float],
                     iterations: int = 1) -> np.ndarray:
    """
    Apply Lloyd's relaxation algorithm to make Voronoi cells more uniform.

    Args:
        points: Array of (x, y) points
        bounds: (x_min, y_min, x_max, y_max) bounding box
        iterations: Number of relaxation iterations

    Returns:
        Relaxed points
    """
    x_min, y_min, x_max, y_max = bounds
    frame = ShapelyPolygon([
        (x_min, y_min),
        (x_max, y_min),
        (x_max, y_max),
        (x_min, y_max),
    ])

    relaxed_points = points.copy()

    for _ in range(iterations):
        # Add boundary points to ensure finite regions
        boundary_points = np.array([
            [x_min - 1000, y_min - 1000],
            [x_max + 1000, y_min - 1000],
            [x_max + 1000, y_max + 1000],
            [x_min - 1000, y_max + 1000],
        ])
        augmented = np.vstack([relaxed_points, boundary_points])

        try:
            vor = Voronoi(augmented)
        except Exception:
            break

        new_points = []
        for i in range(len(relaxed_points)):
            region_idx = vor.point_region[i]
            region = vor.regions[region_idx]

            if -1 in region or len(region) == 0:
                # Infinite region, keep original point
                new_points.append(relaxed_points[i])
                continue

            # Get vertices of the Voronoi region
            vertices = vor.vertices[region]
            region_poly = ShapelyPolygon(vertices)

            # Clip to frame
            clipped = region_poly.intersection(frame)

            if clipped.is_empty:
                new_points.append(relaxed_points[i])
                continue

            # Use centroid as new point
            if isinstance(clipped, (ShapelyPolygon, MultiPolygon)):
                centroid = clipped.centroid
                new_x = np.clip(centroid.x, x_min, x_max)
                new_y = np.clip(centroid.y, y_min, y_max)
                new_points.append([new_x, new_y])
            else:
                new_points.append(relaxed_points[i])

        relaxed_points = np.array(new_points)

    return relaxed_points


# ============================================================================
# MAIN GENERATOR CLASS
# ============================================================================

class WoodPuzzleGenerator:
    """Professional wood puzzle generator for laser cutting."""

    def __init__(self, config: PuzzleConfig):
        """
        Initialize the generator.

        Args:
            config: Configuration object
        """
        self.config = config
        self.rng = np.random.default_rng(config.seed)

        # Frame bounds (centered at origin for easier calculations)
        self.x_min = -config.width_mm / 2
        self.x_max = config.width_mm / 2
        self.y_min = -config.height_mm / 2
        self.y_max = config.height_mm / 2

        # Storage
        self.polygons: List[np.ndarray] = []              # Kerf-adjusted polygons
        self.original_polygons: List[np.ndarray] = []     # Pre-kerf polygons
        self.polygon_ids: List[int] = []
        self.color_map: Dict[int, Tuple[int, int, int]] = {}
        self.wood_palette: np.ndarray = WOOD_PALETTE_RGB

    # ========================================================================
    # GEOMETRY GENERATION
    # ========================================================================

    def generate_polygons(self) -> None:
        """
        Generate polygons using Voronoi tessellation with Lloyd relaxation.
        Creates uniform distribution of polygons across the A4 canvas.
        """
        print(f"Generating Voronoi tessellation for ~{self.config.num_pieces} pieces...")

        # Calculate approximate minimum distance between points
        # Area per piece = total_area / num_pieces
        total_area = self.config.width_mm * self.config.height_mm
        area_per_piece = total_area / self.config.num_pieces
        min_dist = np.sqrt(area_per_piece) * 0.85  # Slightly smaller for overlap

        # Generate initial points using Poisson disk sampling
        points = poisson_disk_sampling(
            self.config.width_mm,
            self.config.height_mm,
            min_dist,
            seed=self.config.seed,
            k=30
        )

        # Adjust to match target piece count
        if len(points) < self.config.num_pieces:
            # Add more points randomly
            additional = self.config.num_pieces - len(points)
            extra_points = self.rng.uniform(
                [0, 0],
                [self.config.width_mm, self.config.height_mm],
                size=(additional, 2)
            )
            points = np.vstack([points, extra_points])
        elif len(points) > self.config.num_pieces:
            # Remove excess points
            points = points[:self.config.num_pieces]

        # Center points around origin
        points[:, 0] -= self.config.width_mm / 2
        points[:, 1] -= self.config.height_mm / 2

        # Apply Lloyd relaxation to smooth distribution
        print(f"Applying {self.config.lloyd_iterations} Lloyd relaxation iterations...")
        points = lloyd_relaxation(
            points,
            (self.x_min, self.y_min, self.x_max, self.y_max),
            iterations=self.config.lloyd_iterations
        )

        # Generate Voronoi diagram
        print("Computing Voronoi diagram...")
        boundary_points = np.array([
            [self.x_min - 1000, self.y_min - 1000],
            [self.x_max + 1000, self.y_min - 1000],
            [self.x_max + 1000, self.y_max + 1000],
            [self.x_min - 1000, self.y_max + 1000],
        ])
        augmented_points = np.vstack([points, boundary_points])

        vor = Voronoi(augmented_points)

        # Create frame polygon for clipping
        frame = ShapelyPolygon([
            (self.x_min, self.y_min),
            (self.x_max, self.y_min),
            (self.x_max, self.y_max),
            (self.x_min, self.y_max),
        ])

        # Extract finite polygons
        print("Extracting and clipping polygons...")
        self.polygons = []
        self.original_polygons = []
        self.polygon_ids = []

        for i in range(len(points)):
            region_idx = vor.point_region[i]
            region = vor.regions[region_idx]

            if -1 in region or len(region) == 0:
                continue

            # Get vertices
            vertices = vor.vertices[region]

            try:
                region_poly = ShapelyPolygon(vertices)

                if not region_poly.is_valid:
                    region_poly = region_poly.buffer(0)

                # Clip to frame
                clipped = region_poly.intersection(frame)

                if clipped.is_empty or clipped.area < 1.0:
                    continue

                if isinstance(clipped, MultiPolygon):
                    clipped = max(clipped.geoms, key=lambda g: g.area)

                if not isinstance(clipped, ShapelyPolygon):
                    continue

                # Store original polygon
                original_coords = np.array(clipped.exterior.coords[:-1])

                # Apply kerf compensation
                kerfed = self._apply_kerf(clipped)

                if kerfed is None or kerfed.is_empty or kerfed.area < 0.5:
                    continue

                kerfed_coords = np.array(kerfed.exterior.coords[:-1])

                if len(kerfed_coords) < 3:
                    continue

                self.original_polygons.append(original_coords)
                self.polygons.append(kerfed_coords)
                self.polygon_ids.append(i + 1)

            except Exception as e:
                continue

        print(f"Generated {len(self.polygons)} valid polygons")

    def _apply_kerf(self, polygon: ShapelyPolygon) -> Optional[ShapelyPolygon]:
        """
        Apply kerf compensation by shrinking polygon inward.

        Args:
            polygon: Shapely polygon

        Returns:
            Shrunk polygon or None if invalid
        """
        try:
            # Negative buffer shrinks the polygon
            shrunk = polygon.buffer(
                -self.config.kerf_mm / 2,
                join_style=2,  # mitered join
                cap_style=3    # flat cap
            )

            if shrunk.is_empty or not shrunk.is_valid:
                return None

            if isinstance(shrunk, MultiPolygon):
                shrunk = max(shrunk.geoms, key=lambda g: g.area, default=None)

            return shrunk if isinstance(shrunk, ShapelyPolygon) else None

        except Exception:
            return None

    # ========================================================================
    # COLOR MAPPING
    # ========================================================================

    def map_colors_from_image(self, image_path: str) -> None:
        """
        Map colors from portrait image to puzzle pieces using LAB color space.

        Args:
            image_path: Path to input portrait image
        """
        if not self.original_polygons:
            raise RuntimeError("Generate polygons before color mapping")

        print(f"Loading image: {image_path}")
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Resize image to match A4 aspect ratio (cover fit)
        print("Resizing and cropping image to A4 aspect ratio...")
        img_resized = self._resize_to_cover(img_rgb)

        # Convert to LAB color space for perceptual accuracy
        img_lab = cv2.cvtColor(img_resized, cv2.COLOR_RGB2LAB).astype(np.float32)
        height, width = img_lab.shape[:2]

        # Sample median color for each polygon
        print("Sampling colors from image regions...")
        polygon_colors_lab = []
        polygon_colors_rgb = []

        for polygon in self.original_polygons:
            # Convert polygon coordinates to pixel coordinates
            poly_px = self._mm_to_pixels(polygon, width, height)

            # Create mask for polygon region
            mask = np.zeros((height, width), dtype=np.uint8)
            cv2.fillPoly(mask, [poly_px], 255)

            # Sample pixels within polygon
            region_lab = img_lab[mask == 255]
            region_rgb = img_resized[mask == 255]

            if len(region_lab) > 0:
                # Use median for robustness
                median_lab = np.median(region_lab, axis=0)
                median_rgb = np.median(region_rgb, axis=0)
            else:
                # Fallback to center point
                cx = int(width * (np.mean(polygon[:, 0]) - self.x_min) / self.config.width_mm)
                cy = int(height * (self.y_max - np.mean(polygon[:, 1])) / self.config.height_mm)
                cx = np.clip(cx, 0, width - 1)
                cy = np.clip(cy, 0, height - 1)
                median_lab = img_lab[cy, cx]
                median_rgb = img_resized[cy, cx]

            polygon_colors_lab.append(median_lab)
            polygon_colors_rgb.append(median_rgb)

        polygon_colors_lab = np.array(polygon_colors_lab)
        polygon_colors_rgb = np.array(polygon_colors_rgb)

        # Map to wood palette
        if self.config.use_kmeans_palette:
            print(f"Clustering colors with k-means (k={self.config.num_colors})...")
            self._cluster_and_map_kmeans(polygon_colors_lab)
        else:
            print(f"Mapping to fixed {self.config.num_colors}-tone wood palette...")
            self._map_to_wood_palette(polygon_colors_lab)

        print("Color mapping complete")

    def _resize_to_cover(self, img: np.ndarray) -> np.ndarray:
        """
        Resize image to cover A4 frame (crop to fit aspect ratio).

        Args:
            img: Input RGB image

        Returns:
            Resized and cropped image
        """
        img_h, img_w = img.shape[:2]
        img_ratio = img_w / img_h
        frame_ratio = self.config.width_mm / self.config.height_mm

        # Scale factor for cover fit
        if img_ratio > frame_ratio:
            # Image is wider, scale by height
            scale = self.config.height_mm * 4 / img_h  # 4 px/mm resolution
            new_h = int(self.config.height_mm * 4)
            new_w = int(img_w * scale)
        else:
            # Image is taller, scale by width
            scale = self.config.width_mm * 4 / img_w
            new_w = int(self.config.width_mm * 4)
            new_h = int(img_h * scale)

        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

        # Crop to exact A4 size
        target_w = int(self.config.width_mm * 4)
        target_h = int(self.config.height_mm * 4)

        if new_w > target_w:
            x_offset = (new_w - target_w) // 2
            resized = resized[:, x_offset:x_offset + target_w]

        if new_h > target_h:
            y_offset = (new_h - target_h) // 2
            resized = resized[y_offset:y_offset + target_h, :]

        return resized

    def _mm_to_pixels(self, polygon: np.ndarray, width: int, height: int) -> np.ndarray:
        """
        Convert polygon coordinates from mm to pixel coordinates.

        Args:
            polygon: Polygon vertices in mm
            width: Image width in pixels
            height: Image height in pixels

        Returns:
            Polygon vertices in pixels
        """
        poly_px = []
        for x_mm, y_mm in polygon:
            px = int((x_mm - self.x_min) / self.config.width_mm * width)
            py = int((self.y_max - y_mm) / self.config.height_mm * height)
            px = np.clip(px, 0, width - 1)
            py = np.clip(py, 0, height - 1)
            poly_px.append([px, py])

        return np.array(poly_px, dtype=np.int32)

    def _cluster_and_map_kmeans(self, polygon_colors_lab: np.ndarray) -> None:
        """
        Use k-means clustering in LAB space to create custom palette.

        Args:
            polygon_colors_lab: Array of LAB colors for each polygon
        """
        kmeans = KMeans(
            n_clusters=self.config.num_colors,
            random_state=self.config.seed,
            n_init=20,
            max_iter=300
        )
        labels = kmeans.fit_predict(polygon_colors_lab)

        # Convert cluster centers to RGB
        centers_lab = kmeans.cluster_centers_.astype(np.uint8)
        centers_lab = centers_lab.reshape(-1, 1, 3)
        centers_rgb = cv2.cvtColor(centers_lab, cv2.COLOR_LAB2RGB).reshape(-1, 3)

        # Warm the palette toward wood tones
        centers_rgb = self._warm_palette(centers_rgb)
        self.wood_palette = centers_rgb.astype(np.uint8)

        # Assign colors to polygons
        for i, poly_id in enumerate(self.polygon_ids):
            cluster = labels[i]
            color = tuple(self.wood_palette[cluster])
            self.color_map[poly_id] = color

    def _map_to_wood_palette(self, polygon_colors_lab: np.ndarray) -> None:
        """
        Map polygon colors to fixed wood palette using nearest neighbor in LAB.

        Args:
            polygon_colors_lab: Array of LAB colors for each polygon
        """
        # Convert wood palette to LAB
        wood_lab = cv2.cvtColor(
            self.wood_palette.reshape(-1, 1, 3),
            cv2.COLOR_RGB2LAB
        ).reshape(-1, 3).astype(np.float32)

        # Find nearest wood tone for each polygon
        for i, poly_id in enumerate(self.polygon_ids):
            color_lab = polygon_colors_lab[i]

            # Compute distances in LAB space
            distances = np.linalg.norm(wood_lab - color_lab, axis=1)
            nearest_idx = np.argmin(distances)

            color = tuple(self.wood_palette[nearest_idx])
            self.color_map[poly_id] = color

    def _warm_palette(self, palette_rgb: np.ndarray) -> np.ndarray:
        """
        Shift palette toward warm wood tones.

        Args:
            palette_rgb: RGB palette array

        Returns:
            Warmed RGB palette
        """
        warmed = palette_rgb.astype(np.float32)

        # Increase red, decrease blue slightly
        warmed[:, 0] = np.clip(warmed[:, 0] * 1.05, 0, 255)  # More red
        warmed[:, 1] = np.clip(warmed[:, 1] * 0.98, 0, 255)  # Slight green adjust
        warmed[:, 2] = np.clip(warmed[:, 2] * 0.92, 0, 255)  # Less blue

        return warmed

    # ========================================================================
    # OUTPUT GENERATION
    # ========================================================================

    def export_template_svg(self, output_path: str) -> None:
        """
        Export cutting template SVG with outlines and engraved numbers.

        Args:
            output_path: Output file path
        """
        dwg = svgwrite.Drawing(
            output_path,
            size=(f'{self.config.width_mm}mm', f'{self.config.height_mm}mm'),
            profile='tiny'
        )
        dwg.viewbox(self.x_min, self.y_min, self.config.width_mm, self.config.height_mm)

        # Outer frame
        frame = dwg.rect(
            insert=(self.x_min, self.y_min),
            size=(self.config.width_mm, self.config.height_mm),
            fill='none',
            stroke='black',
            stroke_width=0.1
        )
        dwg.add(frame)

        # Inner frame (optional decorative margin)
        if self.config.frame_margin_mm > 0:
            inner_frame = dwg.rect(
                insert=(
                    self.x_min + self.config.frame_margin_mm,
                    self.y_min + self.config.frame_margin_mm
                ),
                size=(
                    self.config.width_mm - 2 * self.config.frame_margin_mm,
                    self.config.height_mm - 2 * self.config.frame_margin_mm
                ),
                fill='none',
                stroke='black',
                stroke_width=0.05,
                opacity=0.3
            )
            dwg.add(inner_frame)

        # Puzzle pieces
        pieces_group = dwg.g(id='pieces')

        for poly_id, polygon in zip(self.polygon_ids, self.polygons):
            # Create path
            points = [f"{p[0]:.3f},{p[1]:.3f}" for p in polygon]
            path_data = f"M {points[0]} L {' L '.join(points[1:])} Z"

            path = dwg.path(
                d=path_data,
                fill='none',
                stroke='black',
                stroke_width=0.1,
                id=f'piece_{poly_id}'
            )
            pieces_group.add(path)

            # Engrave piece number at centroid
            centroid = np.mean(polygon, axis=0)
            text = dwg.text(
                str(poly_id),
                insert=(centroid[0], centroid[1] + 0.8),  # Slight offset for visual centering
                font_size='2.5mm',
                text_anchor='middle',
                fill='black',
                font_family='Arial',
                font_weight='bold',
                id=f'label_{poly_id}'
            )
            pieces_group.add(text)

        dwg.add(pieces_group)
        dwg.save()
        print(f"✓ Exported template: {output_path}")

    def export_color_map_svg(self, output_path: str) -> None:
        """
        Export color-mapped SVG with filled polygons.

        Args:
            output_path: Output file path
        """
        dwg = svgwrite.Drawing(
            output_path,
            size=(f'{self.config.width_mm}mm', f'{self.config.height_mm}mm'),
            profile='tiny'
        )
        dwg.viewbox(self.x_min, self.y_min, self.config.width_mm, self.config.height_mm)

        # Background
        bg = dwg.rect(
            insert=(self.x_min, self.y_min),
            size=(self.config.width_mm, self.config.height_mm),
            fill='white'
        )
        dwg.add(bg)

        # Colored pieces
        for poly_id, polygon in zip(self.polygon_ids, self.polygons):
            color = self.color_map.get(poly_id, (128, 128, 128))
            color_hex = rgb_to_hex(color)

            points = [f"{p[0]:.3f},{p[1]:.3f}" for p in polygon]
            path_data = f"M {points[0]} L {' L '.join(points[1:])} Z"

            path = dwg.path(
                d=path_data,
                fill=color_hex,
                stroke='#333333',
                stroke_width=0.08,
                id=f'piece_{poly_id}'
            )
            dwg.add(path)

        dwg.save()
        print(f"✓ Exported color map: {output_path}")

    def export_preview_png(self, output_path: str) -> None:
        """
        Generate high-resolution preview PNG that looks like real wooden mosaic.

        Args:
            output_path: Output file path
        """
        # Calculate figure size in inches for desired DPI
        width_in = self.config.width_mm / 25.4
        height_in = self.config.height_mm / 25.4

        fig, ax = plt.subplots(
            figsize=(width_in, height_in),
            dpi=self.config.preview_dpi,
            facecolor='#f5f5f0'
        )

        ax.set_xlim(self.x_min, self.x_max)
        ax.set_ylim(self.y_min, self.y_max)
        ax.set_aspect('equal')
        ax.axis('off')
        ax.set_facecolor('#f5f5f0')

        # Sort polygons by area (largest first for proper layering)
        polygon_data = list(zip(self.polygon_ids, self.polygons))
        polygon_data.sort(
            key=lambda item: ShapelyPolygon(item[1]).area,
            reverse=True
        )

        # Draw each piece
        for poly_id, polygon in polygon_data:
            color = self.color_map.get(poly_id, (180, 170, 160))
            color_rgb = np.array(color) / 255.0

            # Add subtle variation to simulate wood grain
            variation = self.rng.uniform(-0.02, 0.02, size=3)
            color_rgb = np.clip(color_rgb + variation, 0, 1)

            poly_patch = mpatches.Polygon(
                polygon,
                facecolor=color_rgb,
                edgecolor='#2a2a2a',
                linewidth=0.25,
                antialiased=True,
                joinstyle='round',
                capstyle='round'
            )
            ax.add_patch(poly_patch)

        # Add frame
        frame_rect = mpatches.Rectangle(
            (self.x_min, self.y_min),
            self.config.width_mm,
            self.config.height_mm,
            fill=False,
            edgecolor='#1a1a1a',
            linewidth=0.8,
            zorder=1000
        )
        ax.add_patch(frame_rect)

        plt.subplots_adjust(left=0, right=1, top=1, bottom=0)
        plt.savefig(
            output_path,
            dpi=self.config.preview_dpi,
            bbox_inches='tight',
            pad_inches=0.05,
            facecolor='#f5f5f0',
            edgecolor='none'
        )
        plt.close(fig)

        print(f"✓ Exported preview: {output_path}")

    def export_legend_png(self, output_path: str) -> None:
        """
        Export color legend showing all wood tones with HEX and RGB values.

        Args:
            output_path: Output file path
        """
        num_colors = len(self.wood_palette)
        cols = 5
        rows = (num_colors + cols - 1) // cols

        fig, ax = plt.subplots(figsize=(12, rows * 2.5), facecolor='white')
        ax.set_xlim(0, cols)
        ax.set_ylim(0, rows)
        ax.axis('off')
        ax.set_facecolor('white')

        for idx, color in enumerate(self.wood_palette):
            row = rows - 1 - (idx // cols)  # Top to bottom
            col = idx % cols

            # Color swatch
            rect = mpatches.Rectangle(
                (col + 0.1, row + 0.4),
                0.8, 0.5,
                facecolor=color / 255.0,
                edgecolor='black',
                linewidth=2
            )
            ax.add_patch(rect)

            # HEX label
            hex_color = rgb_to_hex(tuple(color))
            ax.text(
                col + 0.5, row + 0.25,
                hex_color.upper(),
                ha='center',
                va='center',
                fontsize=11,
                fontweight='bold',
                fontfamily='monospace'
            )

            # RGB label
            rgb_text = f"RGB({color[0]}, {color[1]}, {color[2]})"
            ax.text(
                col + 0.5, row + 0.05,
                rgb_text,
                ha='center',
                va='center',
                fontsize=9,
                fontfamily='monospace',
                color='#666666'
            )

        plt.tight_layout()
        plt.savefig(output_path, dpi=200, bbox_inches='tight', facecolor='white')
        plt.close(fig)

        print(f"✓ Exported legend: {output_path}")

    def export_pieces_data_json(self, output_path: str) -> None:
        """
        Export piece data to JSON (coordinates, colors, metadata).

        Args:
            output_path: Output file path
        """
        data = {
            'metadata': {
                'width_mm': self.config.width_mm,
                'height_mm': self.config.height_mm,
                'num_pieces': len(self.polygons),
                'kerf_mm': self.config.kerf_mm,
                'num_colors': self.config.num_colors,
            },
            'pieces': []
        }

        for poly_id, kerf_poly, orig_poly in zip(
            self.polygon_ids,
            self.polygons,
            self.original_polygons
        ):
            color = self.color_map.get(poly_id)

            piece_data = {
                'id': int(poly_id),
                'vertices_mm': kerf_poly.tolist(),
                'original_vertices_mm': orig_poly.tolist(),
                'color_rgb': [int(c) for c in color] if color else None,
                'color_hex': rgb_to_hex(color) if color else None,
                'area_mm2': float(ShapelyPolygon(orig_poly).area),
            }
            data['pieces'].append(piece_data)

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"✓ Exported data: {output_path}")


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """Main entry point for CLI."""
    parser = argparse.ArgumentParser(
        description='Professional Wood Puzzle Generator for Laser Cutting',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate template only (no photo)
  %(prog)s --output-dir output

  # Generate color-mapped mosaic from portrait
  %(prog)s --photo man.jpg --output-dir output

  # High detail with 160 pieces
  %(prog)s --photo portrait.jpg --detail-level high

  # Custom piece count
  %(prog)s --photo image.jpg --num-pieces 200

  # Use k-means palette instead of fixed wood colors
  %(prog)s --photo portrait.jpg --palette kmeans
        """
    )

    # Input
    parser.add_argument(
        '--photo',
        type=str,
        help='Path to portrait image for color mapping'
    )

    # Output
    parser.add_argument(
        '--output-dir',
        type=str,
        default='output',
        help='Output directory (default: output)'
    )

    parser.add_argument(
        '--no-color',
        action='store_true',
        help='Generate template only, skip color mapping'
    )

    # Geometry
    parser.add_argument(
        '--num-pieces',
        type=int,
        default=None,
        help='Exact number of puzzle pieces (overrides --detail-level)'
    )

    parser.add_argument(
        '--detail-level',
        type=str,
        choices=['low', 'medium', 'high'],
        default='medium',
        help='Detail level: low=80, medium=120, high=160 pieces (default: medium)'
    )

    parser.add_argument(
        '--kerf',
        type=float,
        default=0.2,
        help='Laser kerf in mm (default: 0.2)'
    )

    # Colors
    parser.add_argument(
        '--palette',
        type=str,
        choices=['wood', 'kmeans'],
        default='wood',
        help='Color palette mode: wood=fixed palette, kmeans=adaptive (default: wood)'
    )

    parser.add_argument(
        '--clusters',
        type=int,
        default=20,
        help='Number of color clusters (default: 20)'
    )

    # Other
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for reproducibility (default: 42)'
    )

    parser.add_argument(
        '--preview-dpi',
        type=int,
        default=300,
        help='Preview PNG resolution in DPI (default: 300)'
    )

    args = parser.parse_args()

    # Validate inputs
    if args.photo and args.no_color:
        parser.error("--photo and --no-color are mutually exclusive")

    if args.photo and not Path(args.photo).exists():
        parser.error(f"Photo file not found: {args.photo}")

    # Determine number of pieces
    if args.num_pieces is not None:
        num_pieces = args.num_pieces
    else:
        detail_map = {'low': 80, 'medium': 120, 'high': 160}
        num_pieces = detail_map[args.detail_level]

    if num_pieces < 10:
        parser.error("Number of pieces must be at least 10")

    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Configure generator
    config = PuzzleConfig(
        num_pieces=num_pieces,
        kerf_mm=args.kerf,
        seed=args.seed,
        num_colors=args.clusters,
        preview_dpi=args.preview_dpi,
        use_kmeans_palette=(args.palette == 'kmeans')
    )

    # Print configuration
    print("=" * 60)
    print("WOOD PUZZLE GENERATOR")
    print("=" * 60)
    print(f"Canvas size:    {config.width_mm} × {config.height_mm} mm (A4)")
    print(f"Target pieces:  {config.num_pieces}")
    print(f"Kerf:           {config.kerf_mm} mm")
    print(f"Palette:        {args.palette} ({config.num_colors} colors)")
    print(f"Seed:           {config.seed}")
    print(f"Output dir:     {output_dir}")
    print("=" * 60)
    print()

    # Initialize generator
    generator = WoodPuzzleGenerator(config)

    # Generate geometry
    generator.generate_polygons()

    # Map colors if photo provided
    if args.photo and not args.no_color:
        try:
            generator.map_colors_from_image(args.photo)
        except Exception as e:
            print(f"ERROR: Color mapping failed: {e}")
            print("Continuing without color mapping...")
            args.no_color = True

    # Export outputs
    print("\nExporting files...")

    # Always export template
    template_path = output_dir / 'template.svg'
    generator.export_template_svg(str(template_path))

    # Export color outputs if available
    if generator.color_map and not args.no_color:
        color_map_path = output_dir / 'color_map.svg'
        generator.export_color_map_svg(str(color_map_path))

        preview_path = output_dir / 'preview.png'
        generator.export_preview_png(str(preview_path))

        legend_path = output_dir / 'legend.png'
        generator.export_legend_png(str(legend_path))

    # Always export JSON data
    data_path = output_dir / 'pieces_data.json'
    generator.export_pieces_data_json(str(data_path))

    print("\n" + "=" * 60)
    print("✓ GENERATION COMPLETE")
    print("=" * 60)
    print(f"Generated {len(generator.polygons)} pieces")
    print(f"All files saved to: {output_dir}")
    print()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nERROR: {e}", file=sys.stderr)
        sys.exit(1)
