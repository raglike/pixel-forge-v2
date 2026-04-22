/**
 * Median cut color quantization algorithm
 */
export function medianCut(imgData: ImageData, maxColors: number): [number, number, number][] {
  if (!imgData || !imgData.data || imgData.data.length === 0) return [];

  const pixels: [number, number, number][] = [];
  for (let i = 0; i < imgData.data.length; i += 4) {
    pixels.push([imgData.data[i], imgData.data[i + 1], imgData.data[i + 2]]);
  }

  function getColorRange(pixels: [number, number, number][]): number {
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    for (const p of pixels) {
      minR = Math.min(minR, p[0]); maxR = Math.max(maxR, p[0]);
      minG = Math.min(minG, p[1]); maxG = Math.max(maxG, p[1]);
      minB = Math.min(minB, p[2]); maxB = Math.max(maxB, p[2]);
    }
    const r = maxR - minR, g = maxG - minG, b = maxB - minB;
    if (r >= g && r >= b) return 0;
    if (g >= r && g >= b) return 1;
    return 2;
  }

  function split(pixels: [number, number, number][]): [number, number, number][][] {
    const channel = getColorRange(pixels);
    pixels.sort((a, b) => a[channel] - b[channel]);
    const mid = Math.floor(pixels.length / 2);
    return [pixels.slice(0, mid), pixels.slice(mid)];
  }

  function avgColor(pixels: [number, number, number][]): [number, number, number] {
    if (pixels.length === 0) return [0, 0, 0];
    const s = pixels.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0] as [number, number, number]);
    return [Math.round(s[0] / pixels.length), Math.round(s[1] / pixels.length), Math.round(s[2] / pixels.length)];
  }

  let buckets: [number, number, number][][] = [pixels];
  while (buckets.length < maxColors) {
    buckets.sort((a, b) => b.length - a.length);
    const b = buckets.shift();
    if (!b || b.length < 2) { buckets.push(b!); break; }
    const [a1, a2] = split(b);
    buckets.push(a1, a2);
  }
  return buckets.map(avgColor);
}

/**
 * Convert hex palette string array to RGB array
 */
export function hexPaletteToRgb(hexColors: string[]): [number, number, number][] {
  return hexColors.map(c => {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return [r, g, b];
  });
}

/**
 * Find the closest color in a palette to a given RGB color
 */
export function findClosestColor(
  r: number,
  g: number,
  b: number,
  palette: [number, number, number][]
): [number, number, number] {
  let best = palette[0] || [0, 0, 0];
  let bestDist = Infinity;
  for (const c of palette) {
    const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/**
 * Process an image element to a pixelated canvas
 */
export function processImageToCanvas(
  imgEl: HTMLImageElement,
  targetCanvas: HTMLCanvasElement,
  targetRes: number,
  paletteRgb: [number, number, number][],
  numColors: number
): void {
  if (!imgEl || !imgEl.complete || imgEl.naturalWidth === 0) return;

  const maxW = 512, maxH = 512;
  let w = imgEl.naturalWidth, h = imgEl.naturalHeight;
  const scale = Math.min(maxW / w, maxH / h, 1);
  w = Math.round(w * scale);
  h = Math.round(h * scale);

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.drawImage(imgEl, 0, 0, w, h);

  targetCanvas.width = targetRes;
  targetCanvas.height = targetRes;
  const targetCtx = targetCanvas.getContext('2d')!;
  targetCtx.imageSmoothingEnabled = false;
  targetCtx.drawImage(tempCanvas, 0, 0, targetRes, targetRes);

  const pixelData = targetCtx.getImageData(0, 0, targetRes, targetRes);
  const data = pixelData.data;

  const limitedPalette = paletteRgb.slice(0, numColors);

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const best = findClosestColor(r, g, b, limitedPalette);
    data[i] = best[0];
    data[i + 1] = best[1];
    data[i + 2] = best[2];
  }
  targetCtx.putImageData(pixelData, 0, 0);
}

/**
 * Quantize image data to a limited color palette
 */
export function quantizeImageData(
  imageData: ImageData,
  palette: [number, number, number][]
): Uint8ClampedArray {
  const data = imageData.data;
  const result = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const best = findClosestColor(r, g, b, palette);
    result[i] = best[0];
    result[i + 1] = best[1];
    result[i + 2] = best[2];
    result[i + 3] = data[i + 3];
  }

  return result;
}
