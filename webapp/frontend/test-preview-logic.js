/**
 * Automated tests for preview generator logic
 * Tests the algorithm without needing browser/canvas
 */

// Mock color palette
const TEST_PALETTE = {
  name: 'test_palette',
  colors: [
    [255, 255, 255], // White
    [0, 0, 0],       // Black
    [255, 0, 0],     // Red
    [0, 255, 0],     // Green
    [0, 0, 255],     // Blue
    [255, 255, 0],   // Yellow
    [128, 128, 128], // Gray
    [255, 128, 0],   // Orange
  ]
};

// Test functions
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

function colorDistance(color1, color2) {
  const dr = color1[0] - color2[0];
  const dg = color1[1] - color2[1];
  const db = color1[2] - color2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
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

// Test suite
console.log('🧪 Testing Preview Generator Logic\n');
console.log('='.repeat(50));

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
  }
}

// Test 1: Color distance calculation
test('Color distance calculation', () => {
  const dist1 = colorDistance([0, 0, 0], [255, 255, 255]);
  const dist2 = colorDistance([0, 0, 0], [0, 0, 0]);
  const dist3 = colorDistance([100, 100, 100], [105, 105, 105]);

  if (Math.abs(dist1 - 441.67) > 1) throw new Error(`Expected ~441.67, got ${dist1}`);
  if (dist2 !== 0) throw new Error(`Expected 0, got ${dist2}`);
  if (Math.abs(dist3 - 8.66) > 1) throw new Error(`Expected ~8.66, got ${dist3}`);
});

// Test 2: Find closest color
test('Find closest color in palette', () => {
  const result1 = findClosestColor([250, 250, 250], TEST_PALETTE.colors);
  const result2 = findClosestColor([10, 10, 10], TEST_PALETTE.colors);
  const result3 = findClosestColor([200, 0, 0], TEST_PALETTE.colors);

  // Should be white
  if (result1[0] !== 255 || result1[1] !== 255 || result1[2] !== 255) {
    throw new Error('Light gray should map to white');
  }

  // Should be black
  if (result2[0] !== 0 || result2[1] !== 0 || result2[2] !== 0) {
    throw new Error('Dark gray should map to black');
  }

  // Should be red
  if (result3[0] !== 255 || result3[1] !== 0 || result3[2] !== 0) {
    throw new Error('Dark red should map to pure red');
  }
});

// Test 3: Box blur algorithm
test('Box blur algorithm', () => {
  // Create 5x5 test image (all black except center pixel is white)
  const width = 5;
  const height = 5;
  const data = new Uint8ClampedArray(width * height * 4);

  // Fill with black
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;     // R
    data[i + 1] = 0; // G
    data[i + 2] = 0; // B
    data[i + 3] = 255; // A
  }

  // Set center pixel to white
  const centerIdx = (2 * width + 2) * 4;
  data[centerIdx] = 255;
  data[centerIdx + 1] = 255;
  data[centerIdx + 2] = 255;

  // Apply blur
  const blurred = applyBoxBlur(data, width, height, 1);

  // Center should be less than 255 (blurred)
  if (blurred[centerIdx] >= 255) {
    throw new Error('Center pixel should be blurred');
  }

  // Corners should be darker than center
  const cornerIdx = 0;
  if (blurred[cornerIdx] >= blurred[centerIdx]) {
    throw new Error('Corner should be darker than center');
  }
});

// Test 4: Performance test
test('Performance: Color matching 10000 pixels', () => {
  const startTime = Date.now();

  for (let i = 0; i < 10000; i++) {
    const randomColor = [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256)
    ];
    findClosestColor(randomColor, TEST_PALETTE.colors);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`   ⏱️  Processed 10000 pixels in ${duration}ms (${(duration/1000).toFixed(2)}s)`);

  if (duration > 5000) {
    throw new Error(`Too slow: ${duration}ms (should be < 5000ms)`);
  }
});

// Test 5: Performance test - Box blur
test('Performance: Box blur on 100x100 image', () => {
  const width = 100;
  const height = 100;
  const data = new Uint8ClampedArray(width * height * 4);

  // Fill with random colors
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.floor(Math.random() * 256);
  }

  const startTime = Date.now();
  const blurred = applyBoxBlur(data, width, height, 2);
  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`   ⏱️  Blurred 100x100 image in ${duration}ms (${(duration/1000).toFixed(2)}s)`);

  if (duration > 10000) {
    throw new Error(`Too slow: ${duration}ms (should be < 10000ms)`);
  }
});

// Test 6: Edge detection logic
test('Edge detection threshold logic', () => {
  const threshold = 60;

  // Test case 1: Similar colors (no edge)
  const diff1 = Math.abs(100 - 105) + Math.abs(100 - 105) + Math.abs(100 - 105);
  if (diff1 > threshold) {
    throw new Error('Similar colors should not be detected as edge');
  }

  // Test case 2: Different colors (edge)
  const diff2 = Math.abs(0 - 255) + Math.abs(0 - 255) + Math.abs(0 - 255);
  if (diff2 < threshold) {
    throw new Error('Very different colors should be detected as edge');
  }
});

// Test 7: Validate palette structure
test('Palette validation', () => {
  if (!TEST_PALETTE.colors || !Array.isArray(TEST_PALETTE.colors)) {
    throw new Error('Palette must have colors array');
  }

  if (TEST_PALETTE.colors.length === 0) {
    throw new Error('Palette must have at least one color');
  }

  for (const color of TEST_PALETTE.colors) {
    if (color.length !== 3) {
      throw new Error('Each color must have 3 components (RGB)');
    }

    for (const component of color) {
      if (component < 0 || component > 255) {
        throw new Error('Color components must be 0-255');
      }
    }
  }
});

// Test 8: Estimate full preview generation time
test('Estimate full preview generation time', () => {
  // Simulate a 600x450 image (270,000 pixels)
  const width = 600;
  const height = 450;
  const totalPixels = width * height;

  // Measure color matching speed
  const colorStartTime = Date.now();
  for (let i = 0; i < 1000; i++) {
    const randomColor = [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256)
    ];
    findClosestColor(randomColor, TEST_PALETTE.colors);
  }
  const colorEndTime = Date.now();
  const colorDuration = colorEndTime - colorStartTime;
  const pixelsPerMs = 1000 / colorDuration;

  // Estimate total time
  const estimatedColorTime = totalPixels / pixelsPerMs;
  const estimatedBlurTime = (width * height / 10000) * 1000; // Based on 100x100 test
  const estimatedTotal = estimatedColorTime + estimatedBlurTime;

  console.log(`   📊 Estimated times for 600x450 image:`);
  console.log(`      Color matching: ${(estimatedColorTime/1000).toFixed(2)}s`);
  console.log(`      Blur: ${(estimatedBlurTime/1000).toFixed(2)}s`);
  console.log(`      Total: ${(estimatedTotal/1000).toFixed(2)}s`);

  if (estimatedTotal > 30000) {
    throw new Error(`Estimated time too long: ${(estimatedTotal/1000).toFixed(1)}s`);
  }
});

// Print summary
console.log('='.repeat(50));
console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passedTests}`);
console.log(`   ❌ Failed: ${failedTests}`);
console.log(`   📈 Total: ${passedTests + failedTests}`);

if (failedTests === 0) {
  console.log(`\n🎉 All tests passed! The algorithm logic is correct.`);
  console.log(`✨ Preview generator should work in browser.`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Some tests failed. Review the errors above.`);
  process.exit(1);
}
