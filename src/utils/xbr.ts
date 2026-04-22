/**
 * xBR scaling algorithm wrapper
 * Uses the xBRjs library for high-quality pixel art upscaling
 */

declare global {
  interface Window {
    xBRjs: {
      xbr2x: (pixels: Uint32Array, width: number, height: number, options: { blendColors: boolean }) => Uint32Array;
      xbr3x: (pixels: Uint32Array, width: number, height: number, options: { blendColors: boolean }) => Uint32Array;
      xbr4x: (pixels: Uint32Array, width: number, height: number, options: { blendColors: boolean }) => Uint32Array;
    };
  }
}

export type XbrScale = 2 | 3 | 4;

/**
 * Scale image data using xBR algorithm
 */
export function xbrScale(imageData: ImageData, scale: XbrScale): ImageData {
  if (!imageData || !imageData.data) {
    throw new Error('Invalid imageData');
  }

  if (typeof window.xBRjs === 'undefined') {
    throw new Error('xBRjs vendor library not loaded');
  }

  const srcW = imageData.width;
  const srcH = imageData.height;

  const pixelView = new Uint32Array(imageData.data.buffer);

  let scaledPixels: Uint32Array;
  switch (scale) {
    case 2:
      scaledPixels = window.xBRjs.xbr2x(pixelView, srcW, srcH, { blendColors: true });
      break;
    case 3:
      scaledPixels = window.xBRjs.xbr3x(pixelView, srcW, srcH, { blendColors: true });
      break;
    case 4:
      scaledPixels = window.xBRjs.xbr4x(pixelView, srcW, srcH, { blendColors: true });
      break;
    default:
      throw new Error('Scale must be 2, 3, or 4');
  }

  const dstW = srcW * scale;
  const dstH = srcH * scale;

  const scaledUint8 = new Uint8ClampedArray(scaledPixels.buffer);

  const canvas = document.createElement('canvas');
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext('2d')!;
  const newImageData = ctx.createImageData(dstW, dstH);
  newImageData.data.set(scaledUint8);

  return newImageData;
}

/**
 * Apply xBR scaling to a canvas
 */
export function applyXbrToCanvas(
  sourceCanvas: HTMLCanvasElement,
  scale: XbrScale
): HTMLCanvasElement {
  const ctx = sourceCanvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const scaledImageData = xbrScale(imageData, scale);

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = scaledImageData.width;
  resultCanvas.height = scaledImageData.height;
  const resultCtx = resultCanvas.getContext('2d')!;
  resultCtx.putImageData(scaledImageData, 0, 0);

  return resultCanvas;
}
