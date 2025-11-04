#!/usr/bin/env python3
"""
WoodMosaic Studio - Transform Photos into Painted Wooden Mosaic Art
Creates laser-cut wooden puzzle pieces with realistic photo-based painting guides.

Each piece is painted with the ACTUAL colors from the photo region, not flat tones.
This creates a realistic, detailed wooden portrait mosaic.
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
from matplotlib.colors import LinearSegmentedColormap
import svgwrite
from shapely.geometry import Polygon as ShapelyPolygon, MultiPolygon, Point, box
from shapely.ops import unary_union


# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class MosaicConfig:
    """Configuration for wood mosaic generation."""
    width_mm: float = 210.0          # A4 width
    height_mm: float = 297.0         # A4 height
    num_pieces: int = 120            # Physical puzzle pieces
    kerf_mm: float = 0.2             # Laser kerf
    seed: int = 42                   # Random seed
    lloyd_iterations: int = 2        # Lloyd relaxation
    frame_margin_mm: float = 10.0    # Frame margin
    preview_dpi: int = 300           # Preview resolution
    painting_guide_dpi: int = 200    # Individual piece guide resolution
    wood_grain_intensity: float = 0.15  # Wood texture overlay strength


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
    """
    rng = np.random.default_rng(seed)
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
            angle = rng.uniform(0, 2 * np.pi)
            radius = rng.uniform(min_dist, 2 * min_dist)
            nx = px + radius * np.cos(angle)
            ny = py + radius * np.sin(angle)

            if 0 <= nx < width and 0 <= ny < height:
                gx = int(nx / cell_size)
                gy = int(ny / cell_size)

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
                new_points.append(relaxed_points[i])
                continue

            vertices = vor.vertices[region]
            region_poly = ShapelyPolygon(vertices)
            clipped = region_poly.intersection(frame)

            if clipped.is_empty:
                new_points.append(relaxed_points[i])
                continue

            if isinstance(clipped, (ShapelyPolygon, MultiPolygon)):
                centroid = clipped.centroid
                new_x = np.clip(centroid.x, x_min, x_max)
                new_y = np.clip(centroid.y, y_min, y_max)
                new_points.append([new_x, new_y])
            else:
                new_points.append(relaxed_points[i])

        relaxed_points = np.array(new_points)

    return relaxed_points


def generate_wood_grain_texture(width: int, height: int, intensity: float = 0.15,
                                seed: int = 42) -> np.ndarray:
    """
    Generate a subtle wood grain texture overlay.
    Returns a grayscale texture map (0-1 float).
    """
    rng = np.random.default_rng(seed)

    # Create base noise
    noise = rng.uniform(0.85, 1.0, size=(height // 4, width // 4))

    # Upsample with interpolation for smooth grain
    noise = cv2.resize(noise, (width, height), interpolation=cv2.INTER_CUBIC)

    # Add directional grain (vertical bias)
    x = np.linspace(0, 10, width)
    y = np.linspace(0, 14, height)
    X, Y = np.meshgrid(x, y)
    grain = np.sin(X * 0.5 + Y * 0.2) * 0.5 + 0.5

    # Combine noise and grain
    texture = 0.7 * noise + 0.3 * grain
    texture = np.clip(texture, 0, 1)

    # Scale intensity
    texture = 1.0 - (1.0 - texture) * intensity

    return texture


# ============================================================================
# MAIN GENERATOR CLASS
# ============================================================================

class WoodMosaicStudio:
    """Transform photos into painted wooden mosaic art kits."""

    def __init__(self, config: MosaicConfig):
        """Initialize the studio."""
        self.config = config
        self.rng = np.random.default_rng(config.seed)

        # Frame bounds (centered at origin)
        self.x_min = -config.width_mm / 2
        self.x_max = config.width_mm / 2
        self.y_min = -config.height_mm / 2
        self.y_max = config.height_mm / 2

        # Storage
        self.polygons: List[np.ndarray] = []
        self.original_polygons: List[np.ndarray] = []
        self.polygon_ids: List[int] = []
        self.piece_images: Dict[int, np.ndarray] = {}  # Actual photo region per piece
        self.piece_colors: Dict[int, Tuple[int, int, int]] = {}  # Average color per piece

    # ========================================================================
    # GEOMETRY GENERATION
    # ========================================================================

    def generate_polygons(self) -> None:
        """Generate polygons using Voronoi tessellation with Lloyd relaxation."""
        print(f"Generating Voronoi tessellation for {self.config.num_pieces} pieces...")

        # Calculate minimum distance between points
        total_area = self.config.width_mm * self.config.height_mm
        area_per_piece = total_area / self.config.num_pieces
        min_dist = np.sqrt(area_per_piece) * 0.85

        # Generate initial points
        points = poisson_disk_sampling(
            self.config.width_mm,
            self.config.height_mm,
            min_dist,
            seed=self.config.seed,
            k=30
        )

        # Adjust to match target count
        if len(points) < self.config.num_pieces:
            additional = self.config.num_pieces - len(points)
            extra_points = self.rng.uniform(
                [0, 0],
                [self.config.width_mm, self.config.height_mm],
                size=(additional, 2)
            )
            points = np.vstack([points, extra_points])
        elif len(points) > self.config.num_pieces:
            points = points[:self.config.num_pieces]

        # Center around origin
        points[:, 0] -= self.config.width_mm / 2
        points[:, 1] -= self.config.height_mm / 2

        # Apply Lloyd relaxation
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

        # Create frame
        frame = ShapelyPolygon([
            (self.x_min, self.y_min),
            (self.x_max, self.y_min),
            (self.x_max, self.y_max),
            (self.x_min, self.y_max),
        ])

        # Extract polygons
        print("Extracting and clipping polygons...")
        self.polygons = []
        self.original_polygons = []
        self.polygon_ids = []

        for i in range(len(points)):
            region_idx = vor.point_region[i]
            region = vor.regions[region_idx]

            if -1 in region or len(region) == 0:
                continue

            vertices = vor.vertices[region]

            try:
                region_poly = ShapelyPolygon(vertices)
                if not region_poly.is_valid:
                    region_poly = region_poly.buffer(0)

                clipped = region_poly.intersection(frame)

                if clipped.is_empty or clipped.area < 1.0:
                    continue

                if isinstance(clipped, MultiPolygon):
                    clipped = max(clipped.geoms, key=lambda g: g.area)

                if not isinstance(clipped, ShapelyPolygon):
                    continue

                original_coords = np.array(clipped.exterior.coords[:-1])
                kerfed = self._apply_kerf(clipped)

                if kerfed is None or kerfed.is_empty or kerfed.area < 0.5:
                    continue

                kerfed_coords = np.array(kerfed.exterior.coords[:-1])

                if len(kerfed_coords) < 3:
                    continue

                self.original_polygons.append(original_coords)
                self.polygons.append(kerfed_coords)
                self.polygon_ids.append(i + 1)

            except Exception:
                continue

        print(f"Generated {len(self.polygons)} valid polygons")

    def _apply_kerf(self, polygon: ShapelyPolygon) -> Optional[ShapelyPolygon]:
        """Apply kerf compensation by shrinking polygon inward."""
        try:
            shrunk = polygon.buffer(
                -self.config.kerf_mm / 2,
                join_style=2,
                cap_style=3
            )

            if shrunk.is_empty or not shrunk.is_valid:
                return None

            if isinstance(shrunk, MultiPolygon):
                shrunk = max(shrunk.geoms, key=lambda g: g.area, default=None)

            return shrunk if isinstance(shrunk, ShapelyPolygon) else None

        except Exception:
            return None

    # ========================================================================
    # PHOTO MAPPING (NEW APPROACH)
    # ========================================================================

    def map_photo_to_pieces(self, image_path: str) -> None:
        """
        Map actual photo regions to each piece for realistic painted effect.
        Each piece will show the real colors from that area of the photo.
        """
        if not self.original_polygons:
            raise RuntimeError("Generate polygons before mapping photo")

        print(f"Loading image: {image_path}")
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Resize to match A4 aspect ratio (cover fit)
        print("Processing image...")
        img_resized = self._resize_to_cover(img_rgb)
        height, width = img_resized.shape[:2]

        # Generate wood grain texture
        print("Generating wood grain texture...")
        wood_texture = generate_wood_grain_texture(
            width, height,
            self.config.wood_grain_intensity,
            self.config.seed
        )

        # Extract photo region for each piece
        print("Extracting photo regions for each piece...")
        for idx, polygon in enumerate(self.original_polygons):
            poly_id = self.polygon_ids[idx]

            # Convert polygon to pixel coordinates
            poly_px = self._mm_to_pixels(polygon, width, height)

            # Get bounding box
            x_coords = poly_px[:, 0]
            y_coords = poly_px[:, 1]
            x_min, x_max = int(np.floor(x_coords.min())), int(np.ceil(x_coords.max()))
            y_min, y_max = int(np.floor(y_coords.min())), int(np.ceil(y_coords.max()))

            # Ensure bounds are valid
            x_min = max(0, x_min)
            x_max = min(width, x_max)
            y_min = max(0, y_min)
            y_max = min(height, y_max)

            if x_max <= x_min or y_max <= y_min:
                continue

            # Create mask for this polygon
            mask = np.zeros((height, width), dtype=np.uint8)
            cv2.fillPoly(mask, [poly_px], 255)

            # Extract region
            piece_region = img_resized.copy()
            piece_region[mask == 0] = 255  # White background outside polygon

            # Crop to bounding box
            piece_cropped = piece_region[y_min:y_max, x_min:x_max]
            mask_cropped = mask[y_min:y_max, x_min:x_max]

            # Apply wood grain texture
            texture_cropped = wood_texture[y_min:y_max, x_min:x_max]
            piece_with_grain = piece_cropped.astype(np.float32)
            for c in range(3):
                piece_with_grain[:, :, c] *= texture_cropped

            piece_with_grain = np.clip(piece_with_grain, 0, 255).astype(np.uint8)

            # Store the piece image
            self.piece_images[poly_id] = piece_with_grain

            # Calculate average color for reference
            region_pixels = img_resized[mask == 255]
            if len(region_pixels) > 0:
                avg_color = tuple(int(v) for v in np.mean(region_pixels, axis=0))
            else:
                avg_color = (180, 170, 160)
            self.piece_colors[poly_id] = avg_color

        print(f"Mapped photo to {len(self.piece_images)} pieces")

    def _resize_to_cover(self, img: np.ndarray) -> np.ndarray:
        """Resize image to cover A4 frame (crop to fit aspect ratio)."""
        img_h, img_w = img.shape[:2]
        img_ratio = img_w / img_h
        frame_ratio = self.config.width_mm / self.config.height_mm

        # Scale for cover fit
        if img_ratio > frame_ratio:
            scale = self.config.height_mm * 4 / img_h
            new_h = int(self.config.height_mm * 4)
            new_w = int(img_w * scale)
        else:
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
        """Convert polygon coordinates from mm to pixel coordinates."""
        poly_px = []
        for x_mm, y_mm in polygon:
            px = int((x_mm - self.x_min) / self.config.width_mm * width)
            py = int((self.y_max - y_mm) / self.config.height_mm * height)
            px = np.clip(px, 0, width - 1)
            py = np.clip(py, 0, height - 1)
            poly_px.append([px, py])

        return np.array(poly_px, dtype=np.int32)

    # ========================================================================
    # OUTPUT GENERATION
    # ========================================================================

    def export_template_svg(self, output_path: str) -> None:
        """Export cutting template SVG with outlines and numbers."""
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

        # Pieces
        pieces_group = dwg.g(id='pieces')

        for poly_id, polygon in zip(self.polygon_ids, self.polygons):
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

            # Piece number
            centroid = np.mean(polygon, axis=0)
            text = dwg.text(
                str(poly_id),
                insert=(centroid[0], centroid[1] + 0.8),
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

    def export_preview_png(self, output_path: str) -> None:
        """Generate high-resolution preview showing painted pieces."""
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

        # Sort by area (largest first)
        polygon_data = list(zip(self.polygon_ids, self.polygons))
        polygon_data.sort(
            key=lambda item: ShapelyPolygon(item[1]).area,
            reverse=True
        )

        # Draw each piece with its actual color
        for poly_id, polygon in polygon_data:
            if poly_id in self.piece_colors:
                color_rgb = np.array(self.piece_colors[poly_id]) / 255.0
            else:
                color_rgb = np.array([180, 170, 160]) / 255.0

            # Add slight variation
            variation = self.rng.uniform(-0.02, 0.02, size=3)
            color_rgb = np.clip(color_rgb + variation, 0, 1)

            poly_patch = mpatches.Polygon(
                polygon,
                facecolor=color_rgb,
                edgecolor='#2a2a2a',
                linewidth=0.25,
                antialiased=True,
                joinstyle='round'
            )
            ax.add_patch(poly_patch)

        # Frame
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
            facecolor='#f5f5f0'
        )
        plt.close(fig)
        print(f"✓ Exported preview: {output_path}")

    def export_painting_guide(self, output_dir: Path) -> None:
        """
        Export individual painting guides for each piece.
        Shows exactly what colors to paint on each piece.
        """
        guide_dir = output_dir / 'painting_guides'
        guide_dir.mkdir(exist_ok=True)

        print(f"Generating painting guides for {len(self.piece_images)} pieces...")

        # Create master reference sheet
        pieces_per_row = 8
        num_rows = (len(self.piece_images) + pieces_per_row - 1) // pieces_per_row

        fig, axes = plt.subplots(
            num_rows, pieces_per_row,
            figsize=(20, num_rows * 2.5),
            facecolor='white'
        )

        if num_rows == 1:
            axes = axes.reshape(1, -1)

        for idx, (poly_id, piece_img) in enumerate(sorted(self.piece_images.items())):
            row = idx // pieces_per_row
            col = idx % pieces_per_row
            ax = axes[row, col]

            ax.imshow(piece_img)
            ax.set_title(f"Piece #{poly_id}", fontsize=10, fontweight='bold')
            ax.axis('off')

            # Save individual piece guide
            piece_path = guide_dir / f'piece_{poly_id:03d}.png'
            cv2.imwrite(str(piece_path), cv2.cvtColor(piece_img, cv2.COLOR_RGB2BGR))

        # Hide empty subplots
        for idx in range(len(self.piece_images), num_rows * pieces_per_row):
            row = idx // pieces_per_row
            col = idx % pieces_per_row
            axes[row, col].axis('off')

        plt.tight_layout()
        master_path = output_dir / 'painting_guide_master.png'
        plt.savefig(master_path, dpi=self.config.painting_guide_dpi, bbox_inches='tight')
        plt.close(fig)

        print(f"✓ Exported painting guides: {guide_dir}")
        print(f"✓ Exported master reference: {master_path}")

    def export_assembly_instructions(self, output_path: str) -> None:
        """Generate assembly instructions PDF-ready image."""
        fig, axes = plt.subplots(2, 2, figsize=(16, 20), facecolor='white')
        fig.suptitle('WoodMosaic Studio - Assembly Instructions',
                     fontsize=20, fontweight='bold', y=0.98)

        # Step 1: Template overview
        ax1 = axes[0, 0]
        ax1.set_xlim(self.x_min, self.x_max)
        ax1.set_ylim(self.y_min, self.y_max)
        ax1.set_aspect('equal')
        ax1.set_title('1. Cut Template\n(All pieces numbered)', fontsize=14, pad=10)

        for poly_id, polygon in zip(self.polygon_ids, self.polygons):
            poly_patch = mpatches.Polygon(
                polygon,
                facecolor='#f5e6d3',
                edgecolor='black',
                linewidth=0.5
            )
            ax1.add_patch(poly_patch)
            centroid = np.mean(polygon, axis=0)
            ax1.text(centroid[0], centroid[1], str(poly_id),
                    ha='center', va='center', fontsize=6)

        ax1.axis('off')

        # Step 2: Painting guide sample
        ax2 = axes[0, 1]
        ax2.set_title('2. Paint Each Piece\n(Use painting guide reference)',
                     fontsize=14, pad=10)
        sample_pieces = list(self.piece_images.items())[:6]
        for idx, (poly_id, piece_img) in enumerate(sample_pieces):
            row = idx // 3
            col = idx % 3
            h, w = piece_img.shape[:2]
            extent = [col * 1.2, col * 1.2 + 1, row * 1.2, row * 1.2 + 1]
            ax2.imshow(piece_img, extent=extent)
            ax2.text(col * 1.2 + 0.5, row * 1.2 + 1.05, f'#{poly_id}',
                    ha='center', fontsize=10, fontweight='bold')
        ax2.set_xlim(0, 3.6)
        ax2.set_ylim(0, 2.4)
        ax2.axis('off')

        # Step 3: Color legend
        ax3 = axes[1, 0]
        ax3.set_title('3. Tips for Best Results', fontsize=14, pad=10)
        tips = [
            "• Use acrylic paint on 3mm birch plywood",
            "• Apply 2-3 thin coats for best coverage",
            "• Let each coat dry completely (30 min)",
            "• Use fine brushes for detailed areas",
            "• Seal with matte varnish when complete",
            "• Match colors to the painting guide images",
            "• Work in good lighting conditions"
        ]
        ax3.text(0.05, 0.95, '\n'.join(tips), transform=ax3.transAxes,
                fontsize=12, verticalalignment='top', family='monospace')
        ax3.axis('off')

        # Step 4: Final assembly
        ax4 = axes[1, 1]
        ax4.set_title('4. Final Assembly', fontsize=14, pad=10)
        assembly_text = """
Assembly Process:

1. Sort painted pieces by number
2. Start from piece #1
3. Fit pieces together like a jigsaw
4. Use wood glue on edges if permanent
5. Place in frame or mount on backing board
6. Display your unique wooden portrait!

Care Instructions:

• Keep away from direct sunlight
• Dust with soft dry cloth
• Avoid moisture exposure
• Handle gently to maintain piece alignment
        """
        ax4.text(0.05, 0.95, assembly_text.strip(), transform=ax4.transAxes,
                fontsize=11, verticalalignment='top', family='monospace',
                bbox=dict(boxstyle='round', facecolor='#f5f5f0', alpha=0.8))
        ax4.axis('off')

        plt.tight_layout()
        plt.savefig(output_path, dpi=200, bbox_inches='tight', facecolor='white')
        plt.close(fig)
        print(f"✓ Exported assembly instructions: {output_path}")

    def export_pieces_data_json(self, output_path: str) -> None:
        """Export piece data to JSON."""
        data = {
            'metadata': {
                'width_mm': self.config.width_mm,
                'height_mm': self.config.height_mm,
                'num_pieces': len(self.polygons),
                'kerf_mm': self.config.kerf_mm,
            },
            'pieces': []
        }

        for poly_id, kerf_poly, orig_poly in zip(
            self.polygon_ids,
            self.polygons,
            self.original_polygons
        ):
            avg_color = self.piece_colors.get(poly_id, (128, 128, 128))

            piece_data = {
                'id': int(poly_id),
                'vertices_mm': kerf_poly.tolist(),
                'original_vertices_mm': orig_poly.tolist(),
                'average_color_rgb': [int(c) for c in avg_color],
                'color_hex': rgb_to_hex(avg_color),
                'area_mm2': float(ShapelyPolygon(orig_poly).area),
                'has_painting_guide': poly_id in self.piece_images
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
        description='WoodMosaic Studio - Transform photos into painted wooden mosaic art',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate mosaic from portrait
  %(prog)s --photo portrait.jpg --output-dir output

  # High detail with 160 pieces
  %(prog)s --photo image.jpg --num-pieces 160

  # Template only (no photo)
  %(prog)s --no-photo --num-pieces 100 --output-dir template

  # Custom settings
  %(prog)s --photo man.jpg --num-pieces 120 --kerf 0.15 --wood-grain 0.2
        """
    )

    # Input
    parser.add_argument(
        '--photo',
        type=str,
        help='Path to portrait image'
    )

    parser.add_argument(
        '--no-photo',
        action='store_true',
        help='Generate template only without photo mapping'
    )

    # Output
    parser.add_argument(
        '--output-dir',
        type=str,
        default='output',
        help='Output directory (default: output)'
    )

    # Geometry
    parser.add_argument(
        '--num-pieces',
        type=int,
        default=120,
        help='Number of puzzle pieces (default: 120, recommended: 80-160)'
    )

    parser.add_argument(
        '--kerf',
        type=float,
        default=0.2,
        help='Laser kerf in mm (default: 0.2)'
    )

    # Appearance
    parser.add_argument(
        '--wood-grain',
        type=float,
        default=0.15,
        help='Wood grain texture intensity 0-1 (default: 0.15)'
    )

    parser.add_argument(
        '--preview-dpi',
        type=int,
        default=300,
        help='Preview resolution in DPI (default: 300)'
    )

    # Other
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for reproducibility (default: 42)'
    )

    args = parser.parse_args()

    # Validate
    if not args.photo and not args.no_photo:
        parser.error("Either --photo or --no-photo must be specified")

    if args.photo and args.no_photo:
        parser.error("--photo and --no-photo are mutually exclusive")

    if args.photo and not Path(args.photo).exists():
        parser.error(f"Photo file not found: {args.photo}")

    if args.num_pieces < 20:
        parser.error("Number of pieces must be at least 20")

    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Configure
    config = MosaicConfig(
        num_pieces=args.num_pieces,
        kerf_mm=args.kerf,
        seed=args.seed,
        preview_dpi=args.preview_dpi,
        wood_grain_intensity=args.wood_grain
    )

    # Print configuration
    print("=" * 70)
    print("WOODMOSAIC STUDIO")
    print("=" * 70)
    print(f"Canvas size:      {config.width_mm} × {config.height_mm} mm (A4)")
    print(f"Pieces:           {config.num_pieces}")
    print(f"Kerf:             {config.kerf_mm} mm")
    print(f"Wood grain:       {config.wood_grain_intensity}")
    print(f"Preview DPI:      {config.preview_dpi}")
    print(f"Seed:             {config.seed}")
    print(f"Output dir:       {output_dir}")
    print("=" * 70)
    print()

    # Initialize
    studio = WoodMosaicStudio(config)

    # Generate geometry
    studio.generate_polygons()

    # Map photo if provided
    if args.photo and not args.no_photo:
        try:
            studio.map_photo_to_pieces(args.photo)
        except Exception as e:
            print(f"ERROR: Photo mapping failed: {e}")
            print("Continuing with template generation only...")
            args.no_photo = True

    # Export outputs
    print("\nExporting files...")

    # Always export template
    template_path = output_dir / 'template.svg'
    studio.export_template_svg(str(template_path))

    # Export photo-based outputs
    if not args.no_photo and studio.piece_images:
        preview_path = output_dir / 'preview.png'
        studio.export_preview_png(str(preview_path))

        studio.export_painting_guide(output_dir)

        instructions_path = output_dir / 'assembly_instructions.png'
        studio.export_assembly_instructions(str(instructions_path))

    # Always export JSON
    data_path = output_dir / 'pieces_data.json'
    studio.export_pieces_data_json(str(data_path))

    print("\n" + "=" * 70)
    print("✓ GENERATION COMPLETE")
    print("=" * 70)
    print(f"Generated {len(studio.polygons)} pieces")
    if studio.piece_images:
        print(f"Created painting guides for {len(studio.piece_images)} pieces")
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
        import traceback
        traceback.print_exc()
        sys.exit(1)
