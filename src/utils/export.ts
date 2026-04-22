import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Frame } from '@/types';

export interface ExportOptions {
  frames: Frame[];
  resolution: number;
  spriteCols: number;
  palette: string[];
  fps: number;
  projectName: string;
  frameNaming: string;
  asepriteLayerName?: string;
  asepriteFrameTags?: string;
}

/**
 * Export frames as a spritesheet PNG
 */
export async function exportSpritesheet(options: ExportOptions): Promise<void> {
  const { frames, resolution, spriteCols } = options;
  if (frames.length === 0) return;

  const cols = Math.min(spriteCols, frames.length);
  const rows = Math.ceil(frames.length / cols);

  const canvas = document.createElement('canvas');
  canvas.width = resolution * cols;
  canvas.height = resolution * rows;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  for (let i = 0; i < frames.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    if (frames[i].imgEl && frames[i].imgEl.complete) {
      ctx.drawImage(
        frames[i].imgEl,
        col * resolution,
        row * resolution,
        resolution,
        resolution
      );
    }
  }

  canvas.toBlob(blob => {
    if (blob) saveAs(blob, `spritesheet_${Date.now()}.png`);
  });
}

/**
 * Export frames as GIF animation
 */
export async function exportGif(
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<void> {
  const { frames, resolution, fps } = options;
  if (frames.length === 0) return;

  const GIF = (window as unknown as { GIF: typeof import('gif.js').default }).GIF;

  return new Promise((resolve, _reject) => {
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: resolution,
      height: resolution,
      workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js',
    });

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = resolution;
    tempCanvas.height = resolution;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.imageSmoothingEnabled = false;

    frames.forEach((frame, index) => {
      tempCtx.clearRect(0, 0, resolution, resolution);
      if (frame.imgEl && frame.imgEl.complete) {
        tempCtx.drawImage(frame.imgEl, 0, 0, resolution, resolution);
      }
      gif.addFrame(tempCtx, { copy: true, delay: frame.duration || Math.round(1000 / fps) });
      onProgress?.(((index + 1) / frames.length) * 50);
    });

    gif.on('progress', (p: number) => {
      onProgress?.(50 + p * 50);
    });

    gif.on('finished', (blob: Blob) => {
      saveAs(blob, `animation_${Date.now()}.gif`);
      resolve();
    });

    gif.render();
  });
}

/**
 * Export frames as individual PNG files in a ZIP
 */
export async function exportZip(options: ExportOptions): Promise<void> {
  const { frames, resolution, projectName, frameNaming } = options;
  if (frames.length === 0) return;

  const zip = new JSZip();
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = resolution;
  tempCanvas.height = resolution;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.imageSmoothingEnabled = false;

  for (let i = 0; i < frames.length; i++) {
    tempCtx.clearRect(0, 0, resolution, resolution);
    if (frames[i].imgEl && frames[i].imgEl.complete) {
      tempCtx.drawImage(frames[i].imgEl, 0, 0, resolution, resolution);
    }

    const dataUrl = tempCanvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const filename = frameNaming
      .replace('{n}', String(i + 1).padStart(3, '0'))
      .replace('{name}', frames[i].name || `frame_${i + 1}`);
    zip.file(`${filename}.png`, base64, { base64: true });
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${projectName || 'pixelforge'}_${Date.now()}.zip`);
}

/**
 * Export as ASEprite format (JSON)
 */
export async function exportAseprite(options: ExportOptions): Promise<void> {
  const { frames, resolution, asepriteLayerName, asepriteFrameTags } = options;
  if (frames.length === 0) return;

  const asepriteData = {
    frames: frames.map((frame, index) => ({
      filename: frame.name || `frame_${index + 1}`,
      frame: {
        x: 0,
        y: 0,
        w: resolution,
        h: resolution,
      },
      rotated: false,
      trimmed: false,
      duration: frame.duration || 100,
    })),
    meta: {
      app: 'PixelForge',
      version: '2.0',
      image: 'spritesheet.png',
      format: 'RGBA8888',
      size: {
        w: resolution,
        h: resolution,
      },
      layers: [
        {
          name: asepriteLayerName || 'Layer 1',
          opacity: 255,
          visible: true,
        },
      ],
      frameTags: asepriteFrameTags
        ? [{ name: asepriteFrameTags, from: 0, to: frames.length - 1 }]
        : [],
    },
  };

  const blob = new Blob([JSON.stringify(asepriteData, null, 2)], {
    type: 'application/json',
  });
  saveAs(blob, `spritesheet_${Date.now()}.json`);
}

/**
 * Generate TPS XML for TexturePacker
 */
export function generateTpsXml(data: {
  frames: { name: string; x: number; y: number; width: number; height: number }[];
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
}): string {
  const escapeXml = (str: string) =>
    (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<TexturePacker>\n`;
  xml += `  <Content>\n`;
  xml += `    <Image filename="spritesheet.png" width="${data.width}" height="${data.height}" />\n`;
  xml += `    <Sprites>\n`;
  for (const frame of data.frames) {
    xml += `      <Sprite name="${escapeXml(frame.name)}" x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" />\n`;
  }
  xml += `    </Sprites>\n`;
  xml += `  </Content>\n`;
  xml += `</TexturePacker>\n`;
  return xml;
}

/**
 * Export as TexturePacker TPS format
 */
export async function exportTexturePacker(options: ExportOptions): Promise<void> {
  const { frames, resolution, spriteCols, projectName } = options;
  if (frames.length === 0) return;

  const cols = Math.min(spriteCols, frames.length);
  const rows = Math.ceil(frames.length / cols);

  const tpsData = {
    frames: frames.map((frame, i) => ({
      name: frame.name || `frame_${i + 1}`,
      x: (i % cols) * resolution,
      y: Math.floor(i / cols) * resolution,
      width: resolution,
      height: resolution,
    })),
    width: resolution * cols,
    height: resolution * rows,
    frameWidth: resolution,
    frameHeight: resolution,
  };

  const tpsXml = generateTpsXml(tpsData);
  const blob = new Blob([tpsXml], { type: 'application/xml' });
  saveAs(blob, `${projectName || 'spritesheet'}.tps`);
}
