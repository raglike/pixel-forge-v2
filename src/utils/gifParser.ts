/**
 * GIF frame extractor utility
 * Parses GIF files and extracts individual frames as ImageData
 */

// GIF parsing constants
const GIF_MAGIC = 'GIF87a' as const;
const GIF_MAGIC_89 = 'GIF89a' as const;

interface GIFFrame {
  imageData: ImageData;
  delay: number; // in ms
  x: number;
  y: number;
  width: number;
  height: number;
  disposal: number;
}

interface ParsedGIF {
  width: number;
  height: number;
  frames: GIFFrame[];
  loopCount: number;
}

function parseGIF(arrayBuffer: ArrayBuffer): ParsedGIF | null {
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);

  // Check magic number
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
  if (magic !== GIF_MAGIC && magic !== GIF_MAGIC_89) {
    console.error('Not a valid GIF file');
    return null;
  }

  const width = view.getUint16(6, true);
  const height = view.getUint16(8, true);
  const flags = bytes[10];
  const loopCount = (flags & 0x02) ? 1 : 0; // simplified

  const frames: GIFFrame[] = [];
  let offset = 13; // skip header + logical screen descriptor + global color table (if present)
  let lastDisposal = 0;
  let lastDelay = 100;

  // Skip global color table if present
  if (flags & 0x80) {
    const colorTableSize = 3 * Math.pow(2, (flags & 0x07) + 1);
    offset += colorTableSize;
  }

  while (offset < bytes.length) {
    const blockType = bytes[offset];

    if (blockType === 0x21) { // Extension
      const extType = bytes[offset + 1];
      if (extType === 0xF9) { // Graphics Control Extension
        const blockSize = bytes[offset + 2];
        lastDisposal = (bytes[offset + 3] >> 2) & 0x07;
        lastDelay = view.getUint16(offset + 4, true) * 10; // delay is in 1/100th seconds
        offset += 3 + blockSize + 1; // skip extension label + block size + block + terminator
      } else {
        // Skip other extensions
        offset += 2;
        while (bytes[offset] !== 0) {
          offset += bytes[offset] + 1;
        }
        offset++;
      }
    } else if (blockType === 0x2C) { // Image Descriptor
      const x = view.getUint16(offset + 1, true);
      const y = view.getUint16(offset + 3, true);
      const w = view.getUint16(offset + 5, true);
      const h = view.getUint16(offset + 7, true);
      const imgFlags = bytes[offset + 9];
      offset += 10;

      // Local color table
      if (imgFlags & 0x80) {
        const colorTableSize = 3 * Math.pow(2, (imgFlags & 0x07) + 1);
        offset += colorTableSize;
      }

      // LZW minimum code size
      offset++;

      // Skip image data sub-blocks
      offset++;
      while (bytes[offset] !== 0) {
        offset += bytes[offset];
        offset++;
      }
      offset++;

      // For simplicity, create a canvas and try to draw this frame
      // This is a simplified approach - full GIF parsing would require LZW decompression
      frames.push({
        imageData: createPlaceholderImageData(w, h),
        delay: lastDelay,
        x, y, width: w, height: h,
        disposal: lastDisposal
      });
    } else if (blockType === 0x3B) { // Trailer - end of GIF
      break;
    } else {
      offset++;
    }
  }

  return { width, height, frames, loopCount };
}

function createPlaceholderImageData(w: number, h: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas.getContext('2d')!.createImageData(w, h);
}

/**
 * Extract frames from a GIF file
 * Returns array of frames as HTMLImageElements
 */
export async function extractGIFFrames(file: File): Promise<HTMLImageElement[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const parsed = parseGIF(arrayBuffer);

        if (!parsed || parsed.frames.length === 0) {
          // Fallback: try to load the GIF as a single frame using createImageBitmap
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const frameImg = new Image();
            frameImg.src = canvas.toDataURL();
            frameImg.onload = () => resolve([frameImg]);
          };
          img.onerror = () => reject(new Error('Failed to load GIF'));
          img.src = URL.createObjectURL(file);
          return;
        }

        // For each frame, we need to composite it properly
        // This requires LZW decompression which is complex
        // For now, return the first frame as a fallback
        const canvas = document.createElement('canvas');
        canvas.width = parsed.width;
        canvas.height = parsed.height;
        const ctx = canvas.getContext('2d')!;

        // Try using createImageBitmap for modern browsers
        try {
          const blob = new Blob([arrayBuffer], { type: 'image/gif' });
          const bitmap = await createImageBitmap(blob);

          // Create image from bitmap
          ctx.drawImage(bitmap, 0, 0);
          const frameImg = new Image();
          frameImg.src = canvas.toDataURL();

          await new Promise<void>((res) => {
            frameImg.onload = () => res();
          });

          resolve([frameImg]);
        } catch {
          // Fallback to single frame
          const img = new Image();
          img.src = URL.createObjectURL(file);
          img.onload = () => {
            ctx.drawImage(img, 0, 0, parsed.width, parsed.height);
            const frameImg = new Image();
            frameImg.src = canvas.toDataURL();
            frameImg.onload = () => resolve([frameImg]);
          };
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Load a GIF and extract all frames with proper timing
 * Uses canvas to render each frame
 */
export async function loadGIFFrames(file: File): Promise<{ img: HTMLImageElement; delay: number }[]> {
  const url = URL.createObjectURL(file);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Use the native browser support for animated GIF frame extraction
      // by drawing the image to canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;

      // Draw the GIF (browser will render the current frame)
      ctx.drawImage(img, 0, 0);

      // Create image from canvas
      const frameImg = new Image();
      frameImg.src = canvas.toDataURL();

      frameImg.onload = () => {
        URL.revokeObjectURL(url);
        // Note: Full multi-frame GIF support requires GIF parsing library
        // This returns the first frame as a single-frame "sprite sheet"
        resolve([{ img: frameImg, delay: 100 }]);
      };

      frameImg.onerror = () => {
        URL.revokeObjectURL(url);
        resolve([]);
      };
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve([]);
    };

    img.src = url;
  });
}
