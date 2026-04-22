import { useState, useCallback, useRef } from 'react';
import { medianCut, hexPaletteToRgb, processImageToCanvas } from '@/utils/pixelate';
import { BUILTIN_PALETTES } from '@/data/palettes';
import type { Frame, ScalingAlgorithm } from '@/types';

interface UseImageProcessorOptions {
  resolution: number;
  colorCount: number;
  paletteName: string;
  scalingAlgorithm: ScalingAlgorithm;
}

interface UseImageProcessorReturn {
  processFile: (file: File) => Promise<Frame | null>;
  processImageElement: (imgEl: HTMLImageElement, paletteRgb: [number, number, number][]) => HTMLCanvasElement;
  isProcessing: boolean;
}

export function useImageProcessor(
  options: UseImageProcessorOptions,
  _setFrames: React.Dispatch<React.SetStateAction<Frame[]>>
): UseImageProcessorReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const processImageElement = useCallback(
    (imgEl: HTMLImageElement, paletteRgb: [number, number, number][]) => {
      const canvas = document.createElement('canvas');
      processImageToCanvas(
        imgEl,
        canvas,
        options.resolution,
        paletteRgb,
        options.colorCount
      );
      return canvas;
    },
    [options.resolution, options.colorCount]
  );

  const processFile = useCallback(
    async (file: File): Promise<Frame | null> => {
      if (processingRef.current) return null;
      processingRef.current = true;
      setIsProcessing(true);

      try {
        const imgEl = await loadImage(file);
        if (!imgEl) return null;

        let paletteRgb: [number, number, number][];
        if (options.paletteName === 'auto') {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = imgEl.naturalWidth;
          tempCanvas.height = imgEl.naturalHeight;
          const ctx = tempCanvas.getContext('2d')!;
          ctx.drawImage(imgEl, 0, 0);
          const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          paletteRgb = medianCut(imageData, options.colorCount);
        } else {
          const hexPalette = BUILTIN_PALETTES[options.paletteName] || BUILTIN_PALETTES['PICO-8'];
          paletteRgb = hexPaletteToRgb(hexPalette);
        }

        const canvas = processImageElement(imgEl, paletteRgb);

        const newImg = new Image();
        await new Promise<void>((resolve) => {
          newImg.onload = () => resolve();
          newImg.src = canvas.toDataURL();
        });

        const frame: Frame = {
          id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          imgEl: newImg,
          name: file.name.replace(/\.[^.]+$/, ''),
          duration: 100,
        };

        return frame;
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    },
    [options.paletteName, options.colorCount, processImageElement]
  );

  return {
    processFile,
    processImageElement,
    isProcessing,
  };
}

function loadImage(file: File): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function useFrameManagement(initialFrames: Frame[] = []) {
  const [frames, setFrames] = useState<Frame[]>(initialFrames);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  const addFrame = useCallback((frame: Frame) => {
    setFrames((prev) => [...prev, frame]);
  }, []);

  const removeFrame = useCallback(
    (index: number) => {
      setFrames((prev) => prev.filter((_, i) => i !== index));
      setCurrentFrameIndex((prev) => Math.min(prev, Math.max(0, prev - 1)));
    },
    []
  );

  const duplicateFrame = useCallback(
    (index: number) => {
      const frame = frames[index];
      if (!frame) return;

      const newFrame: Frame = {
        ...frame,
        id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${frame.name} (copy)`,
      };

      setFrames((prev) => {
        const newFrames = [...prev];
        newFrames.splice(index + 1, 0, newFrame);
        return newFrames;
      });
      setCurrentFrameIndex(index + 1);
    },
    [frames]
  );

  const reorderFrames = useCallback((fromIndex: number, toIndex: number) => {
    setFrames((prev) => {
      const newFrames = [...prev];
      const [removed] = newFrames.splice(fromIndex, 1);
      newFrames.splice(toIndex, 0, removed);
      return newFrames;
    });
  }, []);

  const currentFrame = frames[currentFrameIndex];

  return {
    frames,
    setFrames,
    currentFrame,
    currentFrameIndex,
    setCurrentFrameIndex,
    addFrame,
    removeFrame,
    duplicateFrame,
    reorderFrames,
  };
}
