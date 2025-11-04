#!/usr/bin/env python3
"""
Universal Wood Puzzle Template Generator
Generates laser-cutting templates with optional color mapping from images.
"""

import argparse
import json
from pathlib import Path
from typing import List, Tuple, Dict, Optional

import numpy as np
import cv2
from scipy.spatial import Delaunay
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import svgwrite
from shapely.geometry import Polygon as ShapelyPolygon, MultiPolygon
from scipy.optimize import linear_sum_assignment


def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"


class PuzzleGenerator:
    """Generates wood puzzle templates with optional color mapping."""
    
    def __init__(
        self,
        width_mm: float = 210,
        height_mm: float = 297,
        num_pieces: int = 120,
        kerf_mm: float = 0.2,
        seed: int = 42,
    ):
        """
        Initialize puzzle generator.
        
        Args:
            width_mm: Frame width in millimeters (A4 = 210)
            height_mm: Frame height in millimeters (A4 = 297)
            num_pieces: Target number of puzzle pieces
            kerf_mm: Kerf tolerance (spacing between pieces) in millimeters
            seed: Random seed for deterministic tessellation
        """
        self.width_mm = width_mm
        self.height_mm = height_mm
        self.requested_pieces = num_pieces
        self.num_pieces = num_pieces
        self.kerf_mm = kerf_mm
        self.seed = seed
        
        # Frame bounds (centered at origin)
        self.x_min = -width_mm / 2
        self.x_max = width_mm / 2
        self.y_min = -height_mm / 2
        self.y_max = height_mm / 2
        
        self.polygons: List[np.ndarray] = []            # kerf-adjusted polygons
        self.original_polygons: List[np.ndarray] = []   # pre-kerf polygons
        self.polygon_ids: List[int] = []
        self.color_map: Optional[Dict[int, Tuple[int, int, int]]] = None
        self.preview_color_map: Optional[Dict[int, Tuple[int, int, int]]] = None
        self.cluster_assignments: Optional[Dict[int, int]] = None
        self.original_mean_colors: Optional[Dict[int, Tuple[int, int, int]]] = None
        self._rng = np.random.default_rng(seed)
    
    # -------------------------------------------------------------------------
    # Tessellation helpers
    # -------------------------------------------------------------------------
    def _choose_grid(self, target_pieces: int) -> Tuple[int, int, int]:
        """
        Choose a rectangular lattice (rows, cols) whose Delaunay triangulation
        yields a triangle count close to the requested number of pieces.
        """
        aspect = self.width_mm / self.height_mm
        best = None  # (score, rows, cols, triangles)
        for rows in range(3, 80):
            for cols in range(3, 80):
                triangles = 2 * (rows - 1) * (cols - 1)
                if triangles == 0:
                    continue
                diff = abs(triangles - target_pieces)
                ratio = (cols - 1) / (rows - 1)
                aspect_penalty = abs(ratio - aspect)
                score = diff * 200 + aspect_penalty
                if best is None or score < best[0] or (
                    np.isclose(score, best[0]) and triangles > best[3]
                ):
                    best = (score, rows, cols, triangles)
        assert best is not None
        return best[1], best[2], best[3]
    
    def _apply_kerf(self, polygon: np.ndarray) -> Optional[np.ndarray]:
        """
        Apply kerf tolerance by shrinking polygon inward.
        Uses Shapely negative buffer.
        """
        if len(polygon) < 3:
            return None
        
        try:
            poly = ShapelyPolygon(polygon)
            shrunk = poly.buffer(-self.kerf_mm / 2, join_style=2, cap_style=3)
            
            if shrunk.is_empty or not shrunk.is_valid:
                return None
            
            if isinstance(shrunk, ShapelyPolygon):
                coords = np.array(shrunk.exterior.coords[:-1])
                return coords if len(coords) >= 3 else None
            elif isinstance(shrunk, MultiPolygon):
                largest = max(shrunk.geoms, key=lambda g: g.area, default=None)
                if largest is None:
                    return None
                coords = np.array(largest.exterior.coords[:-1])
                return coords if len(coords) >= 3 else None
        except Exception:
            return polygon  # Fallback: return original
        return None
    
    # -------------------------------------------------------------------------
    # Tessellation (rewritten)
    # -------------------------------------------------------------------------
    def generate_polygons(self):
        """
        Generate polygonal cells from a uniform Delaunay triangulation.
        Produces evenly distributed triangles across the A4 frame with optional jitter.
        """
        rows, cols, triangles = self._choose_grid(self.requested_pieces)
        if triangles != self.requested_pieces:
            print(
                f"Note: requested {self.requested_pieces} pieces but "
                f"uniform grid produces {triangles}. Using {triangles} pieces."
            )
        self.num_pieces = triangles
        
        x_coords = np.linspace(self.x_min, self.x_max, cols)
        y_coords = np.linspace(self.y_min, self.y_max, rows)
        x_step = x_coords[1] - x_coords[0] if cols > 1 else self.width_mm
        y_step = y_coords[1] - y_coords[0] if rows > 1 else self.height_mm
        jitter_x = x_step * 0.15
        jitter_y = y_step * 0.15
        
        points = []
        for r, y in enumerate(y_coords):
            for c, x in enumerate(x_coords):
                jx = 0.0 if c in (0, cols - 1) else self._rng.uniform(-jitter_x, jitter_x)
                jy = 0.0 if r in (0, rows - 1) else self._rng.uniform(-jitter_y, jitter_y)
                points.append([x + jx, y + jy])
        points = np.array(points, dtype=np.float64)
        
        delaunay = Delaunay(points)
        frame = ShapelyPolygon([
            (self.x_min, self.y_min),
            (self.x_max, self.y_min),
            (self.x_max, self.y_max),
            (self.x_min, self.y_max),
        ])
        
        self.polygons = []
        self.original_polygons = []
        self.polygon_ids = []
        
        # Sort simplices by centroid Y to keep deterministic ordering
        simplices = sorted(
            delaunay.simplices.tolist(),
            key=lambda tri: np.mean(points[tri][:, 1]),
        )
        
        for idx, simplex in enumerate(simplices, start=1):
            coords = points[simplex]
            triangle = ShapelyPolygon(coords)
            if triangle.area < 1e-4 or not triangle.is_valid:
                continue
            clipped = triangle.intersection(frame)
            if clipped.is_empty:
                continue
            
            if isinstance(clipped, MultiPolygon):
                clipped = max(clipped.geoms, key=lambda g: g.area, default=None)
            if not isinstance(clipped, ShapelyPolygon):
                continue
            
            original = np.array(clipped.exterior.coords[:-1])
            if len(original) < 3:
                continue
            
            kerfed = self._apply_kerf(original)
            if kerfed is None or len(kerfed) < 3:
                continue
            
            self.original_polygons.append(original)
            self.polygons.append(kerfed)
            self.polygon_ids.append(idx)
            
            if len(self.polygons) >= self.num_pieces:
                break
        
        # Ensure counts match
        self.num_pieces = len(self.polygons)
    
    # -------------------------------------------------------------------------
    # Color mapping (rewritten)
    # -------------------------------------------------------------------------
    def map_colors_from_image(self, image_path: str, num_clusters: int = 20):
        """
        Map colors from an image to puzzle pieces using LAB color clustering.
        
        Args:
            image_path: Path to input image
            num_clusters: Number of color clusters (wood stains)
        """
        if len(self.original_polygons) == 0:
            raise RuntimeError("Polygons must be generated before color mapping.")
        
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image from {image_path}")
        
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        frame_ratio = self.width_mm / self.height_mm
        img_h, img_w = img_rgb.shape[:2]
        img_ratio = img_w / img_h
        
        if img_ratio > frame_ratio:
            new_width = int(self.width_mm * 8)
            new_height = int(new_width / img_ratio)
        else:
            new_height = int(self.height_mm * 8)
            new_width = int(new_height * img_ratio)
        
        img_resized = cv2.resize(img_rgb, (new_width, new_height), interpolation=cv2.INTER_AREA)
        img_lab = cv2.cvtColor(img_resized, cv2.COLOR_RGB2LAB).astype(np.float32)
        
        piece_labs = []
        piece_rgbs = []
        polygon_masks = []
        height, width = img_lab.shape[:2]
        
        def mm_to_px(x_mm: float, y_mm: float) -> Tuple[int, int]:
            px = (x_mm - self.x_min) / self.width_mm * (width - 1)
            py = (self.y_max - y_mm) / self.height_mm * (height - 1)
            return int(np.clip(px, 0, width - 1)), int(np.clip(py, 0, height - 1))
        
        for polygon in self.original_polygons:
            poly_px = np.array([mm_to_px(float(x), float(y)) for x, y in polygon], dtype=np.int32)
            mask = np.zeros((height, width), dtype=np.uint8)
            cv2.fillPoly(mask, [poly_px], 255)
            polygon_masks.append(mask)
            
        for mask in polygon_masks:
            region = img_lab[mask == 255]
            if len(region) == 0:
                region = img_lab.reshape(-1, 3)
            mean_lab = np.mean(region, axis=0)
            piece_labs.append(mean_lab)
            
            region_rgb = img_resized[mask == 255]
            if len(region_rgb) == 0:
                region_rgb = img_resized.reshape(-1, 3)
            mean_rgb = np.mean(region_rgb, axis=0)
            piece_rgbs.append(mean_rgb)
        
        piece_labs = np.array(piece_labs, dtype=np.float32)
        piece_rgbs = np.array(piece_rgbs, dtype=np.float32)
        
        kmeans = KMeans(
            n_clusters=num_clusters,
            random_state=self.seed,
            n_init=20,
            max_iter=300,
        )
        labels = kmeans.fit_predict(piece_labs)
        centers = kmeans.cluster_centers_
        
        wood_palette_hex = [
            "#F4E5D3", "#F0D6BE", "#E7C4A0", "#DBAE83", "#CFA572",
            "#C49563", "#B48252", "#A47146", "#93623C", "#835335",
            "#75462E", "#673B28", "#5A3223", "#4E2A1E", "#4A2C23",
            "#DCC2A4", "#CCA27D", "#BD8C62", "#AD7A50", "#9C6841",
        ]
        wood_palette_rgb = np.array(
            [[int(hex_color[i:i+2], 16) for i in (1, 3, 5)] for hex_color in wood_palette_hex],
            dtype=np.uint8,
        )
        wood_palette_lab = cv2.cvtColor(
            wood_palette_rgb.reshape(-1, 1, 3),
            cv2.COLOR_RGB2LAB,
        ).reshape(-1, 3).astype(np.float32)
        
        cost_matrix = np.linalg.norm(
            centers[:, None, :].astype(np.float32) - wood_palette_lab[None, :, :],
            axis=2,
        )
        row_ind, col_ind = linear_sum_assignment(cost_matrix)
        
        assigned_palette_rgb = wood_palette_rgb[col_ind]
        assigned_palette_lab = wood_palette_lab[col_ind]
        palette_map_rgb = {row: assigned_palette_rgb[i] for i, row in enumerate(row_ind)}
        palette_map_lab = {row: assigned_palette_lab[i] for i, row in enumerate(row_ind)}
        
        self.color_map = {}
        self.preview_color_map = {}
        self.cluster_assignments = {}
        self.original_mean_colors = {}
        
        for idx, poly_id in enumerate(self.polygon_ids):
            cluster = labels[idx]
            cluster_palette_rgb = palette_map_rgb.get(cluster, assigned_palette_rgb[cluster % len(assigned_palette_rgb)])
            cluster_palette_lab = palette_map_lab.get(cluster, assigned_palette_lab[cluster % len(assigned_palette_lab)])
            base_rgb = tuple(int(v) for v in cluster_palette_rgb)
            
            piece_lab = piece_labs[idx]
            piece_rgb = piece_rgbs[idx]
            self.original_mean_colors[poly_id] = tuple(int(v) for v in np.clip(piece_rgb, 0, 255))
            
            adjusted_lab = cluster_palette_lab.copy()
            adjusted_lab[0] = np.clip(piece_lab[0], adjusted_lab[0] - 18, adjusted_lab[0] + 18)
            adjusted_lab[1] = np.clip(piece_lab[1], adjusted_lab[1] - 12, adjusted_lab[1] + 12)
            adjusted_lab[2] = np.clip(piece_lab[2], adjusted_lab[2] - 15, adjusted_lab[2] + 15)
            adjusted_lab = np.clip(adjusted_lab, 0, 255)
            
            preview_lab = adjusted_lab.astype(np.uint8).reshape(1, 1, 3)
            preview_rgb = cv2.cvtColor(preview_lab, cv2.COLOR_LAB2RGB).reshape(3).astype(np.float32)
            blended = 0.55 * preview_rgb + 0.45 * piece_rgb
            shade_factor = np.clip(piece_lab[0] / 255.0, 0.2, 1.0)
            blended *= (0.85 + 0.3 * shade_factor)
            preview_rgb = np.clip(blended, 0, 255)
            preview_rgb = tuple(int(v) for v in preview_rgb)
            
            self.color_map[poly_id] = base_rgb
            self.preview_color_map[poly_id] = preview_rgb
            self.cluster_assignments[poly_id] = int(cluster + 1)
        
        cluster_palette_rgb_ordered = np.zeros((num_clusters, 3), dtype=np.uint8)
        for cluster_idx in range(num_clusters):
            color = palette_map_rgb.get(cluster_idx)
            if color is None:
                color = wood_palette_rgb[cluster_idx % len(wood_palette_rgb)]
            cluster_palette_rgb_ordered[cluster_idx] = color
        return cluster_palette_rgb_ordered
    
    # -------------------------------------------------------------------------
    # Preview rendering (rewritten)
    # -------------------------------------------------------------------------
    def generate_preview(self, output_path: Optional[str] = None):
        """Generate high-fidelity PNG preview of the color-mapped puzzle."""
        if not self.color_map:
            return
        
        width_in = self.width_mm / 25.4
        height_in = self.height_mm / 25.4
        
        fig, ax = plt.subplots(figsize=(width_in, height_in), dpi=800)
        ax.set_xlim(self.x_min, self.x_max)
        ax.set_ylim(self.y_min, self.y_max)
        ax.set_aspect('equal')
        ax.axis('off')
        ax.set_facecolor('#f3ede2')
        fig.patch.set_facecolor('#f3ede2')
        
        frame_rect = mpatches.Rectangle(
            (self.x_min, self.y_min),
            self.width_mm,
            self.height_mm,
            fill=False,
            edgecolor='#1f1712',
            linewidth=0.6,
            zorder=2
        )
        ax.add_patch(frame_rect)
        
        polygon_data = list(zip(self.polygon_ids, self.polygons))
        polygon_data.sort(key=lambda item: ShapelyPolygon(item[1]).area, reverse=True)
        
        for poly_id, polygon in polygon_data:
            if poly_id in (self.preview_color_map or {}):
                color_rgb = np.array(self.preview_color_map[poly_id]) / 255.0
            elif poly_id in self.color_map:
                color_rgb = np.array(self.color_map[poly_id]) / 255.0
            else:
                color_rgb = np.array([0.75, 0.73, 0.70])
            
            poly_patch = mpatches.Polygon(
                polygon,
                facecolor=color_rgb,
                edgecolor='#2d2d2d',
                linewidth=0.18,
                antialiased=True,
                joinstyle='round',
                capstyle='round',
                zorder=1
            )
            ax.add_patch(poly_patch)
        
        plt.subplots_adjust(left=0, right=1, top=1, bottom=0)
        
        if output_path:
            plt.savefig(
                output_path,
                dpi=800,
                bbox_inches='tight',
                facecolor='#f3ede2',
                edgecolor='none',
                pad_inches=0.0,
                metadata={'Creation Software': 'Puzzle Generator'}
            )
        plt.close()
    
    # -------------------------------------------------------------------------
    # Original export methods (unchanged except for new data where relevant)
    # -------------------------------------------------------------------------
    def export_template_svg(self, output_path: str):
        """Export cutting template as SVG."""
        dwg = svgwrite.Drawing(output_path, size=(f'{self.width_mm}mm', f'{self.height_mm}mm'))
        dwg.viewbox(self.x_min, self.y_min, self.width_mm, self.height_mm)
        
        frame_group = dwg.g(id='frame')
        frame = dwg.rect(
            insert=(self.x_min, self.y_min),
            size=(self.width_mm, self.height_mm),
            fill='none',
            stroke='black',
            stroke_width=0.1
        )
        frame_group.add(frame)
        dwg.add(frame_group)
        
        pieces_group = dwg.g(id='pieces')
        for poly_id, polygon in zip(self.polygon_ids, self.polygons):
            points = [f"{p[0]},{p[1]}" for p in polygon]
            path_data = f"M {points[0]} L {' L '.join(points[1:])} Z"
            
            path = dwg.path(
                d=path_data,
                fill='none',
                stroke='black',
                stroke_width=0.1,
                id=f'piece_{poly_id}'
            )
            pieces_group.add(path)
            
            centroid = np.mean(polygon, axis=0)
            text = dwg.text(
                str(poly_id),
                insert=(centroid[0], centroid[1]),
                font_size=2.2,
                text_anchor='middle',
                fill='black',
                id=f'label_{poly_id}'
            )
            pieces_group.add(text)
        
        dwg.add(pieces_group)
        dwg.save()
    
    def export_color_map_svg(self, output_path: str, cluster_colors: np.ndarray):
        """Export color-mapped puzzle as SVG."""
        dwg = svgwrite.Drawing(output_path, size=(f'{self.width_mm}mm', f'{self.height_mm}mm'))
        dwg.viewbox(self.x_min, self.y_min, self.width_mm, self.height_mm)
        
        frame = dwg.rect(
            insert=(self.x_min, self.y_min),
            size=(self.width_mm, self.height_mm),
            fill='white',
            stroke='black',
            stroke_width=0.1
        )
        dwg.add(frame)
        
        pieces_group = dwg.g(id='colored_pieces')
        palette = [tuple(int(v) for v in color) for color in cluster_colors]
        
        for poly_id, polygon in zip(self.polygon_ids, self.polygons):
            if self.cluster_assignments and poly_id in self.cluster_assignments:
                cluster_idx = self.cluster_assignments[poly_id] - 1
                color = palette[cluster_idx]
            elif self.color_map and poly_id in self.color_map:
                color = self.color_map[poly_id]
            else:
                color = (128, 128, 128)
            
            color_hex = f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}"
            
            points = [f"{p[0]},{p[1]}" for p in polygon]
            path_data = f"M {points[0]} L {' L '.join(points[1:])} Z"
            
            path = dwg.path(
                d=path_data,
                fill=color_hex,
                stroke='black',
                stroke_width=0.1,
                id=f'piece_{poly_id}'
            )
            pieces_group.add(path)
        
        dwg.add(pieces_group)
        dwg.save()
    
    def export_legend(self, output_path: str, cluster_colors: np.ndarray):
        """Export color legend as PNG."""
        num_colors = len(cluster_colors)
        cols = 5
        rows = (num_colors + cols - 1) // cols
        
        fig, ax = plt.subplots(figsize=(10, rows * 2))
        ax.set_xlim(0, cols)
        ax.set_ylim(0, rows)
        ax.axis('off')
        ax.set_facecolor('white')
        
        for idx, color in enumerate(cluster_colors):
            row = idx // cols
            col = idx % cols
            
            rect = mpatches.Rectangle(
                (col + 0.1, row + 0.4),
                0.8, 0.5,
                facecolor=color / 255.0,
                edgecolor='black',
                linewidth=2
            )
            ax.add_patch(rect)
            
            hex_color = f"#{int(color[0]):02x}{int(color[1]):02x}{int(color[2]):02x}"
            ax.text(
                col + 0.5, row + 0.15,
                hex_color,
                ha='center',
                va='top',
                fontsize=10,
                fontweight='bold',
                fontfamily='monospace'
            )
            
            rgb_text = f"RGB({int(color[0])}, {int(color[1])}, {int(color[2])})"
            ax.text(
                col + 0.5, row + 0.05,
                rgb_text,
                ha='center',
                va='top',
                fontsize=8,
                fontfamily='monospace',
                color='gray'
            )
        
        plt.tight_layout()
        plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
    
    def export_pieces_data(self, output_path: str):
        """Export piece coordinates and metadata to JSON."""
        data = {
            'frame': {
                'width_mm': self.width_mm,
                'height_mm': self.height_mm
            },
            'pieces': []
        }
        
        for poly_id, kerf_polygon, original_polygon in zip(
            self.polygon_ids, self.polygons, self.original_polygons
        ):
            base_color = None
            preview_color = None
            cluster_idx = None
            source_color = None
            if self.color_map and poly_id in self.color_map:
                base_color = list(self.color_map[poly_id])
            if self.preview_color_map and poly_id in self.preview_color_map:
                preview_color = list(self.preview_color_map[poly_id])
            if self.cluster_assignments and poly_id in self.cluster_assignments:
                cluster_idx = self.cluster_assignments[poly_id]
            if self.original_mean_colors and poly_id in self.original_mean_colors:
                source_color = list(self.original_mean_colors[poly_id])
            
            piece_data = {
                'id': poly_id,
                'kerf_vertices': kerf_polygon.tolist(),
                'original_vertices': original_polygon.tolist(),
                'average_color_rgb': base_color,
                'preview_color_rgb': preview_color,
                'cluster_index': cluster_idx,
                'source_mean_rgb': source_color,
            }
            data['pieces'].append(piece_data)
        
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)


def main():
    parser = argparse.ArgumentParser(
        description='Generate universal wood puzzle template for laser cutting'
    )
    parser.add_argument(
        '--photo',
        type=str,
        help='Path to image file for color mapping'
    )
    parser.add_argument(
        '--no-color',
        action='store_true',
        help='Export only SVG template without color mapping'
    )
    parser.add_argument(
        '--output-dir',
        type=str,
        default='output',
        help='Output directory (default: output)'
    )
    parser.add_argument(
        '--num-pieces',
        type=int,
        default=120,
        help='Number of puzzle pieces to target (default: 120)'
    )
    parser.add_argument(
        '--kerf',
        type=float,
        default=0.2,
        help='Kerf tolerance in mm (default: 0.2)'
    )
    parser.add_argument(
        '--clusters',
        type=int,
        default=20,
        help='Number of color clusters for wood stains (default: 20)'
    )
    parser.add_argument(
        '--detail-level',
        type=float,
        default=1.0,
        help='Scale tessellation density (e.g., 0.8 for fewer pieces, 1.5 for more)'
    )
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for deterministic tessellation and clustering'
    )
    
    args = parser.parse_args()
    
    if args.detail_level <= 0:
        parser.error("--detail-level must be positive.")
    
    target_pieces = max(12, int(round(args.num_pieces * args.detail_level)))
    
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)
    
    generator = PuzzleGenerator(
        num_pieces=target_pieces,
        kerf_mm=args.kerf,
        seed=args.seed
    )
    
    print(f"Generating tessellation for ~{target_pieces} puzzle pieces ...")
    generator.generate_polygons()
    print(f"Generated {generator.num_pieces} pieces")
    
    cluster_colors = None
    if args.photo and not args.no_color:
        print(f"Mapping colors from {args.photo} ...")
        try:
            cluster_colors = generator.map_colors_from_image(args.photo, args.clusters)
            print(f"Color mapping complete with {len(cluster_colors)} warm clusters")
        except Exception as e:
            print(f"Warning: Color mapping failed: {e}")
            print("Continuing without color mapping...")
    
    print("Exporting files...")
    
    template_path = output_dir / 'template.svg'
    generator.export_template_svg(str(template_path))
    print(f"✔ Exported {template_path}")
    
    if cluster_colors is not None and not args.no_color:
        color_map_path = output_dir / 'color_map.svg'
        generator.export_color_map_svg(str(color_map_path), cluster_colors)
        print(f"✔ Exported {color_map_path}")
        
        legend_path = output_dir / 'legend.png'
        generator.export_legend(str(legend_path), cluster_colors)
        print(f"✔ Exported {legend_path}")
        
        preview_path = output_dir / 'preview.png'
        generator.generate_preview(str(preview_path))
        print(f"✔ Exported {preview_path}")
    
    pieces_data_path = output_dir / 'pieces_data.json'
    generator.export_pieces_data(str(pieces_data_path))
    print(f"✔ Exported {pieces_data_path}")
    
    print("\nGeneration complete!")


if __name__ == '__main__':
    main()
