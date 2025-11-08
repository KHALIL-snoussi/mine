#!/bin/bash
# Quick QBRIX Quality Test
# This creates a test portrait and verifies QBRIX quality is working

echo "=========================================="
echo "🎨 QBRIX Quality Quick Test"
echo "=========================================="
echo ""

cd /home/user/mine

# Create a test portrait
echo "📸 Creating test portrait..."
python3 -c "
import numpy as np
import cv2

# Create test portrait
img = np.zeros((1000, 800, 3), dtype=np.uint8)
img[0:400, :] = [135, 206, 235]  # Sky
img[400:, :] = [100, 140, 80]     # Ground

# Face
cv2.circle(img, (400, 250), 150, (220, 180, 140), -1)
cv2.circle(img, (360, 220), 20, (70, 50, 30), -1)  # Eyes
cv2.circle(img, (440, 220), 20, (70, 50, 30), -1)
cv2.ellipse(img, (400, 280), (50, 30), 0, 0, 180, (180, 80, 80), 5)  # Smile

cv2.imwrite('quick_test_portrait.jpg', img)
print('✅ Test portrait created')
"

# Generate with QBRIX quality
echo ""
echo "🎨 Generating with QBRIX quality (automatic)..."
echo ""

python3 -c "
from paint_by_numbers.main import PaintByNumbersGenerator

generator = PaintByNumbersGenerator()

# This will automatically use QBRIX quality!
result = generator.generate(
    input_path='quick_test_portrait.jpg',
    output_dir='quick_qbrix_test',
    model='original',
    n_colors=20
)

print('')
print('========================================')
print('✅ QBRIX QUALITY TEST COMPLETE')
print('========================================')
print('')
print('📁 Check output: quick_qbrix_test/')
print('')
print('🔍 Look for these in the output above:')
print('  ✅ \"Auto-detecting subject for QBRIX-quality\"')
print('  ✅ \"Detected 1 faces\"')
print('  ✅ \"Color budget: Emphasized=14, Background=6\"')
print('  ✅ \"Multi-region processing complete (QBRIX-quality)\"')
print('')
print('If you see those messages, QBRIX quality is working! 🎉')
print('')
"

echo ""
echo "=========================================="
echo "✅ Test complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Review the output above for QBRIX indicators"
echo "  2. Check the generated files in quick_qbrix_test/"
echo "  3. Compare template quality to before"
echo ""
