/**
 * Realistic performance test with actual image sizes
 */

function colorDistance(color1, color2) {
  const dr = color1[0] - color2[0];
  const dg = color1[1] - color2[1];
  const db = color1[2] - color2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function findClosestColor(color, palette) {
  let minDistance = Infinity;
  let closestColor = palette[0];

  for (const paletteColor of palette) {
    const distance = colorDistance(color, paletteColor);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = paletteColor;
    }
  }

  return closestColor;
}

function applyBoxBlur(data, width, height, radius) {
  const blurred = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const px = Math.min(Math.max(x + kx, 0), width - 1);
          const py = Math.min(Math.max(y + ky, 0), height - 1);
          const idx = (py * width + px) * 4;

          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }

      const idx = (y * width + x) * 4;
      blurred[idx] = r / count;
      blurred[idx + 1] = g / count;
      blurred[idx + 2] = b / count;
      blurred[idx + 3] = data[idx + 3];
    }
  }

  return blurred;
}

// Test with realistic image size (600x450 = what we actually use)
const TEST_PALETTE = [
  [255, 255, 255], [0, 0, 0], [255, 0, 0], [0, 255, 0],
  [0, 0, 255], [255, 255, 0], [128, 128, 128], [255, 128, 0],
  [200, 100, 50], [100, 200, 150], [150, 100, 200], [50, 150, 250],
  [240, 200, 160], [160, 240, 200], [200, 160, 240], [80, 80, 80],
  [220, 220, 220], [40, 40, 40]
];

console.log('🧪 Realistic Performance Test\n');
console.log('Testing with ACTUAL image size: 600x450 pixels');
console.log('='.repeat(60));

const width = 600;
const height = 450;
const totalPixels = width * height;

console.log(`\n📊 Image specs:`);
console.log(`   Dimensions: ${width}x${height}`);
console.log(`   Total pixels: ${totalPixels.toLocaleString()}`);
console.log(`   Palette: ${TEST_PALETTE.length} colors`);

// Create test image data
console.log(`\n⏳ Creating test image data...`);
const data = new Uint8ClampedArray(width * height * 4);
for (let i = 0; i < data.length; i++) {
  data[i] = Math.floor(Math.random() * 256);
}
console.log(`   ✅ Created ${(data.length / 1024 / 1024).toFixed(2)}MB of image data`);

// Test 1: Box Blur
console.log(`\n🔄 Test 1: Box Blur (radius=2)...`);
const blurStart = Date.now();
const blurred = applyBoxBlur(data, width, height, 2);
const blurEnd = Date.now();
const blurDuration = blurEnd - blurStart;

console.log(`   ✅ Completed in ${(blurDuration / 1000).toFixed(2)}s`);

if (blurDuration > 10000) {
  console.log(`   ⚠️  WARNING: Too slow! (should be < 10s)`);
} else if (blurDuration > 5000) {
  console.log(`   ⚡ Acceptable (5-10s)`);
} else {
  console.log(`   🚀 Fast! (< 5s)`);
}

// Test 2: Color Quantization
console.log(`\n🎨 Test 2: Color Quantization...`);
const quantizeStart = Date.now();

for (let i = 0; i < blurred.length; i += 4) {
  const r = blurred[i];
  const g = blurred[i + 1];
  const b = blurred[i + 2];
  const closest = findClosestColor([r, g, b], TEST_PALETTE);
  data[i] = closest[0];
  data[i + 1] = closest[1];
  data[i + 2] = closest[2];
}

const quantizeEnd = Date.now();
const quantizeDuration = quantizeEnd - quantizeStart;

console.log(`   ✅ Completed in ${(quantizeDuration / 1000).toFixed(2)}s`);
console.log(`   📈 ${(totalPixels / quantizeDuration).toFixed(0)} pixels/ms`);

if (quantizeDuration > 5000) {
  console.log(`   ⚠️  WARNING: Too slow! (should be < 5s)`);
} else if (quantizeDuration > 2000) {
  console.log(`   ⚡ Acceptable (2-5s)`);
} else {
  console.log(`   🚀 Fast! (< 2s)`);
}

// Test 3: Edge Detection (simplified)
console.log(`\n📐 Test 3: Edge Detection...`);
const edgeStart = Date.now();

let edgesDetected = 0;
for (let y = 1; y < height - 1; y++) {
  for (let x = 1; x < width - 1; x++) {
    const idx = (y * width + x) * 4;
    const right = ((y * width + (x + 1)) * 4);
    const bottom = (((y + 1) * width + x) * 4);

    const diffRight = Math.abs(data[idx] - data[right]) +
                     Math.abs(data[idx + 1] - data[right + 1]) +
                     Math.abs(data[idx + 2] - data[right + 2]);

    const diffBottom = Math.abs(data[idx] - data[bottom]) +
                      Math.abs(data[idx + 1] - data[bottom + 1]) +
                      Math.abs(data[idx + 2] - data[bottom + 2]);

    if (diffRight > 60 || diffBottom > 60) {
      edgesDetected++;
    }
  }
}

const edgeEnd = Date.now();
const edgeDuration = edgeEnd - edgeStart;

console.log(`   ✅ Completed in ${(edgeDuration / 1000).toFixed(2)}s`);
console.log(`   📊 Detected ${edgesDetected.toLocaleString()} edges (${(edgesDetected/totalPixels*100).toFixed(1)}%)`);

// Total time
const totalDuration = blurDuration + quantizeDuration + edgeDuration;

console.log(`\n${'='.repeat(60)}`);
console.log(`📊 TOTAL PROCESSING TIME: ${(totalDuration / 1000).toFixed(2)}s`);
console.log(`\nBreakdown:`);
console.log(`   Blur:        ${(blurDuration / 1000).toFixed(2)}s (${(blurDuration/totalDuration*100).toFixed(0)}%)`);
console.log(`   Quantize:    ${(quantizeDuration / 1000).toFixed(2)}s (${(quantizeDuration/totalDuration*100).toFixed(0)}%)`);
console.log(`   Edges:       ${(edgeDuration / 1000).toFixed(2)}s (${(edgeDuration/totalDuration*100).toFixed(0)}%)`);

console.log(`\n🎯 Final Assessment:`);
if (totalDuration < 5000) {
  console.log(`   ✅ EXCELLENT: Preview generation is FAST (< 5s)`);
  console.log(`   🚀 Users will love the instant feedback!`);
} else if (totalDuration < 10000) {
  console.log(`   ✅ GOOD: Preview generation is acceptable (5-10s)`);
  console.log(`   👍 Users will wait for quality preview`);
} else if (totalDuration < 20000) {
  console.log(`   ⚠️  SLOW: Preview takes a while (10-20s)`);
  console.log(`   💡 Consider optimizing blur algorithm`);
} else {
  console.log(`   ❌ TOO SLOW: Preview takes too long (> 20s)`);
  console.log(`   🛠️  Need to optimize before shipping`);
}

console.log(`\n${'='.repeat(60)}`);
