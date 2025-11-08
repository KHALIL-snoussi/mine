# QBRIX-Level Diamond Painting Quality Prompt

**Context for the AI assistant:**
You are helping me restore the QBRIX-grade clarity in this repository (`mine`). The codebase already contains an advanced multi-region emphasis system (face detection, color re-allocation, saliency fallback) inside `paint_by_numbers/`. Recent commits weakened the results because the generator sometimes bypasses that system. You must analyze the repo and ship code that always delivers premium QBRIX-quality diamond painting templates.

---
## 🔍 Analyze the reference aesthetic (from supplied QBRIX kits)
Even though you cannot view the pictures directly, treat the following description as ground truth for the desired output:

1. **Final Mosaic Poster**
   - Portrait of a man wearing a brown leather jacket, neutral background with subtle clouds.
   - Uses **exactly six yarn/peg colors** (palette IDs on the poster: `1478`, `2351`, `379`, `712`, `1309`, `1397`, `1851`).
   - Colors are tightly packed; faces have crisp edges, lips and eyes well-defined, jacket folds preserved.
   - Background remains flat/airy so focus stays on the subject.

2. **Assembly Sheets (Pages 1–84)**
   - 84 segments laid out 12 per sheet; each segment is a 24×24 grid of squares containing symbol + color ID.
   - Dark regions (hair, jacket) concentrate the darker palette entries; skin uses lighter IDs with controlled dithering.
   - Each page transitions smoothly—no abrupt palette swings across neighboring tiles.

**Key Qualities to match:** ultra-sharp facial detail, disciplined color allocation, tiny region size around faces, simplified background, consistent palette per kit.

---
## 🛠️ Repository expectations
Tell the AI to inspect and update the following core areas:

- `paint_by_numbers/main.py`: make sure `PaintByNumbersGenerator.generate()` always honors `use_region_emphasis=True` by default and automatically derives a `subject_region` using `SubjectDetector` when none is provided.
- `paint_by_numbers/intelligence/subject_detector.py`: verify face/saliency detection remains robust; improve fallback heuristics if needed (e.g., better confidence thresholds, centered crop tuning).
- `paint_by_numbers/core/multi_region_processor.py` (or equivalent): ensure color budgets and min region sizes align with the QBRIX allocation table (70–75% of colors to subject, region size multiplier ≈0.6 for subject vs 1.8 for background).
- `paint_by_numbers/models.py`: confirm premium models (`ultra_detailed`, `original`, etc.) set color counts and min region sizes that reinforce QBRIX sharpness; keep palettes balanced and allow 30+ colors for HD kits.
- `paint_by_numbers/utils/visualization.py` (and exports): guarantee generated legend sheets mirror the 24×24 tile layout with consistent symbol-color mapping.
- Front-end (`webapp/`): ensure the Area Selector defaults to auto-detected regions, clearly differentiates emphasized/background overlays, and exposes toggles for users.

---
## ✅ Success criteria for the AI
Have the AI produce changes that satisfy all of these checks:

1. **Automatic emphasis**: Running `generate_ultra_hd.py` or `test_ultra_detailed_now.py` without manually passing `subject_region` still triggers the multi-region pipeline.
2. **Subject-first color allocation**: Unit or integration tests demonstrate that emphasized regions get ≥70% of the color budget and min region size shrinks by ~40% compared to background.
3. **Palette fidelity**: Exported PDF/PNG assembly sheets show limited, carefully distributed palette usage similar to the described QBRIX poster (faces sharp, backgrounds smooth).
4. **Regression coverage**: Add or update automated tests under `tests/` (or `paint_by_numbers/tests`) to assert the behavior above; include golden-output comparison if feasible.
5. **Documentation**: Update README/guide files (e.g., `QBRIX_STYLE_IMPROVEMENTS.md`) with new instructions so future commits do not regress quality.

---
## 🧠 Guidance for the AI assistant
Include these directives in the prompt you give to the coding AI:

- "Search the repository for `QBRIX` references and follow the documented multi-region strategy."  
- "If you change defaults, ensure they remain backward compatible for existing API clients; add config flags only when necessary."  
- "Prefer deterministic algorithms (fixed random seeds) when generating sample outputs so comparisons stay stable."  
- "Do not reduce the number of colors or enlarge region sizes in premium models unless you provide quantitative justification."  
- "Document every change in CHANGELOG or relevant markdown with before/after quality notes."  
- "Run `pytest` (or provided test scripts) to prove the pipeline works after your modifications."  

---
## 📋 Final prompt structure
When you hand this to the AI engineer, format it like so:

```
You are an expert Python + TypeScript developer working on the `mine` repository. Your mission is to restore QBRIX-level diamond painting quality.

1. Study `QBRIX_PROMPT.md` and `QBRIX_STYLE_IMPROVEMENTS.md` for the target aesthetic.
2. Ensure automatic face/subject emphasis runs by default in `PaintByNumbersGenerator.generate()`.
3. Audit models, palettes, and multi-region processing so emphasized regions get ≥70% color allocation with smaller min region sizes.
4. Update exports + visualization to maintain 24×24 tile sheets with crisp symbol mapping.
5. Strengthen detection fallbacks and front-end area selector defaults.
6. Add regression tests + documentation proving QBRIX-quality outputs.
7. Run `python generate_ultra_hd.py` (or relevant tests) and document results.

The reference QBRIX kit uses six colors (IDs: 1478, 2351, 379, 712, 1309, 1397, 1851), sharp facial details, simplified background, and 84 assembly tiles (24×24). Mirror these qualities exactly.
```

Hand this prompt to the AI so it knows precisely what to build.
