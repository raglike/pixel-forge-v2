import { useState, useCallback } from 'react';
import {
  exportSpritesheet,
  exportGif,
  exportZip,
  exportAseprite,
  exportTexturePacker,
} from '@/utils/export';
import type { Frame } from '@/types';

interface UseExportReturn {
  isExporting: boolean;
  exportProgress: number;
  exportSpritesheet: (frames: Frame[], resolution: number, spriteCols: number, projectName: string) => Promise<void>;
  exportGif: (frames: Frame[], resolution: number, fps: number, projectName: string) => Promise<void>;
  exportZip: (frames: Frame[], resolution: number, projectName: string, frameNaming: string) => Promise<void>;
  exportAseprite: (frames: Frame[], resolution: number, projectName: string, layerName: string, frameTags: string) => Promise<void>;
  exportTexturePacker: (frames: Frame[], resolution: number, spriteCols: number, projectName: string) => Promise<void>;
}

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExportSpritesheet = useCallback(
    async (frames: Frame[], resolution: number, spriteCols: number, projectName: string) => {
      setIsExporting(true);
      setExportProgress(0);
      try {
        await exportSpritesheet({
          frames,
          resolution,
          spriteCols,
          palette: [],
          fps: 12,
          projectName,
          frameNaming: 'frame_{n}',
        });
        setExportProgress(100);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const handleExportGif = useCallback(
    async (frames: Frame[], resolution: number, fps: number, projectName: string) => {
      setIsExporting(true);
      setExportProgress(0);
      try {
        await exportGif(
          {
            frames,
            resolution,
            spriteCols: 1,
            palette: [],
            fps,
            projectName,
            frameNaming: 'frame_{n}',
          },
          (progress) => setExportProgress(progress)
        );
        setExportProgress(100);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const handleExportZip = useCallback(
    async (frames: Frame[], resolution: number, projectName: string, frameNaming: string) => {
      setIsExporting(true);
      setExportProgress(0);
      try {
        await exportZip({
          frames,
          resolution,
          spriteCols: 1,
          palette: [],
          fps: 12,
          projectName,
          frameNaming,
        });
        setExportProgress(100);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const handleExportAseprite = useCallback(
    async (
      frames: Frame[],
      resolution: number,
      projectName: string,
      layerName: string,
      frameTags: string
    ) => {
      setIsExporting(true);
      setExportProgress(0);
      try {
        await exportAseprite({
          frames,
          resolution,
          spriteCols: 1,
          palette: [],
          fps: 12,
          projectName,
          frameNaming: 'frame_{n}',
          asepriteLayerName: layerName,
          asepriteFrameTags: frameTags,
        });
        setExportProgress(100);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const handleExportTexturePacker = useCallback(
    async (frames: Frame[], resolution: number, spriteCols: number, projectName: string) => {
      setIsExporting(true);
      setExportProgress(0);
      try {
        await exportTexturePacker({
          frames,
          resolution,
          spriteCols,
          palette: [],
          fps: 12,
          projectName,
          frameNaming: 'frame_{n}',
        });
        setExportProgress(100);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return {
    isExporting,
    exportProgress,
    exportSpritesheet: handleExportSpritesheet,
    exportGif: handleExportGif,
    exportZip: handleExportZip,
    exportAseprite: handleExportAseprite,
    exportTexturePacker: handleExportTexturePacker,
  };
}
