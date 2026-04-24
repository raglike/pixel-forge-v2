import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { DrawingTool } from '@/types';

interface DrawingCanvasProps {
  width: number;
  height: number;
  zoom: number;
  tool: DrawingTool;
  color: string;
  pixels: Record<string, string>;
  selectedPixel: { x: number; y: number; color: string } | null;
  onPixelChange: (pixels: Record<string, string>) => void;
  onPixelSelect: (pixel: { x: number; y: number; color: string } | null) => void;
  visible: boolean;
}

export default function DrawingCanvas({
  width,
  height,
  zoom,
  tool,
  color,
  pixels,
  selectedPixel,
  onPixelChange,
  onPixelSelect,
  visible,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, pixelSize: number) => {
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.15)';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= w; x++) {
      ctx.beginPath();
      ctx.moveTo(x * pixelSize + 0.5, 0);
      ctx.lineTo(x * pixelSize + 0.5, h * pixelSize);
      ctx.stroke();
    }

    for (let y = 0; y <= h; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * pixelSize + 0.5);
      ctx.lineTo(w * pixelSize, y * pixelSize + 0.5);
      ctx.stroke();
    }
  }, []);

  const drawPixels = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, pixelSize: number) => {
    Object.entries(pixels).forEach(([key, rgba]) => {
      const [xStr, yStr] = key.split(',');
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);
      if (x < 0 || x >= w || y < 0 || y >= h) return;

      ctx.fillStyle = rgba;
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    });
  }, [pixels]);

  const drawSelection = useCallback((ctx: CanvasRenderingContext2D, pixelSize: number) => {
    if (!selectedPixel) return;
    const { x, y } = selectedPixel;
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * pixelSize + 1, y * pixelSize + 1, pixelSize - 2, pixelSize - 2);

    ctx.fillStyle = 'rgba(24, 144, 255, 0.2)';
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  }, [selectedPixel]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelSize = zoom;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    drawPixels(ctx, width, height, pixelSize);
    drawGrid(ctx, width, height, pixelSize);
    drawSelection(ctx, pixelSize);
  }, [width, height, zoom, pixels, selectedPixel, drawPixels, drawGrid, drawSelection]);

  useEffect(() => {
    render();
  }, [render]);

  const getPixelCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: -1, y: -1 };
    const rect = canvas.getBoundingClientRect();
    const pixelSize = zoom;
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
    return { x, y };
  }, [zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!visible) return;
    const { x, y } = getPixelCoords(e);
    if (x < 0 || x >= width || y < 0 || y >= height) return;

    if (tool === 'brush') {
      const newPixels = { ...pixels };
      newPixels[`${x},${y}`] = color;
      onPixelChange(newPixels);
      setIsDrawing(true);
      setLastPos({ x, y });
    } else if (tool === 'eraser') {
      const newPixels = { ...pixels };
      delete newPixels[`${x},${y}`];
      onPixelChange(newPixels);
      setIsDrawing(true);
      setLastPos({ x, y });
    } else if (tool === 'eyedropper') {
      const key = `${x},${y}`;
      const pickedColor = pixels[key];
      if (pickedColor) {
        onPixelSelect({ x, y, color: pickedColor });
      }
    } else if (tool === 'select') {
      const key = `${x},${y}`;
      const pixelColor = pixels[key] || 'rgba(0,0,0,0)';
      onPixelSelect({ x, y, color: pixelColor });
    }
  }, [visible, tool, color, pixels, width, height, getPixelCoords, onPixelChange, onPixelSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !visible) return;
    const { x, y } = getPixelCoords(e);
    if (x < 0 || x >= width || y < 0 || y >= height) return;

    if (tool === 'brush') {
      const newPixels = { ...pixels };

      // Draw line from lastPos to current (Bresenham-style)
      if (lastPos) {
        const dx = Math.abs(x - lastPos.x);
        const dy = Math.abs(y - lastPos.y);
        const sx = lastPos.x < x ? 1 : -1;
        const sy = lastPos.y < y ? 1 : -1;
        let err = dx - dy;
        let cx = lastPos.x;
        let cy = lastPos.y;

        while (true) {
          newPixels[`${cx},${cy}`] = color;
          if (cx === x && cy === y) break;
          const e2 = 2 * err;
          if (e2 > -dy) { err -= dy; cx += sx; }
          if (e2 < dx) { err += dx; cy += sy; }
        }
      }

      newPixels[`${x},${y}`] = color;
      onPixelChange(newPixels);
      setLastPos({ x, y });
    } else if (tool === 'eraser') {
      const newPixels = { ...pixels };

      if (lastPos) {
        const dx = Math.abs(x - lastPos.x);
        const dy = Math.abs(y - lastPos.y);
        const sx = lastPos.x < x ? 1 : -1;
        const sy = lastPos.y < y ? 1 : -1;
        let err = dx - dy;
        let cx = lastPos.x;
        let cy = lastPos.y;

        while (true) {
          delete newPixels[`${cx},${cy}`];
          if (cx === x && cy === y) break;
          const e2 = 2 * err;
          if (e2 > -dy) { err -= dy; cx += sx; }
          if (e2 < dx) { err += dx; cy += sy; }
        }
      }

      delete newPixels[`${x},${y}`];
      onPixelChange(newPixels);
      setLastPos({ x, y });
    }
  }, [isDrawing, visible, tool, lastPos, pixels, color, width, height, getPixelCoords, onPixelChange]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setLastPos(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDrawing(false);
    setLastPos(null);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width * zoom}
      height={height * zoom}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: tool === 'brush' ? 'crosshair' : tool === 'eraser' ? 'cell' : tool === 'eyedropper' ? 'zoom-in' : 'default',
        imageRendering: 'pixelated',
        zIndex: 10,
      }}
    />
  );
}
