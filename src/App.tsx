import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useFrameManagement, useImageProcessor } from '@/hooks/useImageProcessor';
import { usePalette, usePaletteEditor } from '@/hooks/usePalette';
import { useExport } from '@/hooks/useExport';
import { BUILTIN_PALETTES, getAllPalettes, getCategories } from '@/data/palettes';
import { getAllTemplates, getAnimationCategories, getStateMachinePresets } from '@/data/templates';
import { loadGIFFrames } from '@/utils/gifParser';
import { exportPaletteHex, exportPaletteJson, exportPalettePal } from '@/utils/export';
import { medianCut, hexPaletteToRgb } from '@/utils/pixelate';
import type { Frame, VersionConfig, ScalingAlgorithm, ProjectMeta, StateMachine, AnimGroup, LoopMode } from '@/types';

const VERSION_CONFIG: Record<string, VersionConfig> = {
  free: {
    maxResolution: 64,
    maxFrames: 8,
    customPalette: false,
    onionSkin: false,
    animationPresets: false,
    asepriteExport: false,
    gifImport: false,
    threePreview: false,
    aiFeatures: false,
  },
  pro: {
    maxResolution: 256,
    maxFrames: 32,
    customPalette: true,
    onionSkin: true,
    animationPresets: true,
    asepriteExport: true,
    gifImport: true,
    threePreview: true,
    aiFeatures: true,
  },
  enterprise: {
    maxResolution: Infinity,
    maxFrames: Infinity,
    customPalette: true,
    onionSkin: true,
    animationPresets: true,
    asepriteExport: true,
    gifImport: true,
    threePreview: true,
    aiFeatures: true,
  },
};

const DEFAULT_VERSION = 'pro';

export default function App() {
  const [version, setVersion] = useState(() => localStorage.getItem('pixelforge_version') || DEFAULT_VERSION);
  const versionConf = VERSION_CONFIG[version] || VERSION_CONFIG.pro;

  const {
    frames,
    setFrames,
    currentFrame,
    currentFrameIndex,
    setCurrentFrameIndex,
    addFrame,
    removeFrame,
    duplicateFrame,
    reorderFrames,
  } = useFrameManagement();

  const [res, setRes] = useState(64);
  const [colors, setColors] = useState(16);
  const [scalingAlgorithm, setScalingAlgorithm] = useState<ScalingAlgorithm>('bilinear');
  const [fps, setFps] = useState(12);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [frameNaming, setFrameNaming] = useState('frame_{n}');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [spriteCols, setSpriteCols] = useState(4);

  // Image Split / Grid Cut
  const [showSplitImageModal, setShowSplitImageModal] = useState(false);
  const [splitCols, setSplitCols] = useState(2);
  const [splitRows, setSplitRows] = useState(2);
  const [splitUniform, setSplitUniform] = useState(true);
  const splitPreviewRef = useRef<HTMLCanvasElement>(null);

  // Loop Mode - Infinite Canvas
  const [loopMode, setLoopMode] = useState<LoopMode>('none');

  const [paletteMode, setPaletteMode] = useState<'auto' | 'fixed'>('auto');
  const {
    currentPaletteName,
    setCurrentPaletteName,
    currentPaletteRgb,
    customPalettes,
    selectedColor,
    setSelectedColor,
  } = usePalette('PICO-8', {});

  const { editingPaletteName: _editingPaletteName, setEditingPaletteName: _setEditingPaletteName, editingColors: _editingColors, addColor: _addColor, removeColor: _removeColor, updateColor: _updateColor, clearColors: _clearColors } = usePaletteEditor();

  const [showPresetPanel, setShowPresetPanel] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const [onionSkin, setOnionSkin] = useState(false);
  const [onionOpacity, setOnionOpacity] = useState(30);
  const [onionPrev, setOnionPrev] = useState(true);
  const [onionNext, setOnionNext] = useState(true);

  // State Machine
  const [showStateMachine, setShowStateMachine] = useState(false);
  const [animStateMachine, setAnimStateMachine] = useState<StateMachine>({
    initial: 'idle',
    transitions: [
      { from: 'idle', to: 'walk', event: 'move', condition: null },
      { from: 'walk', to: 'idle', event: 'stop', condition: null },
      { from: 'idle', to: 'jump', event: 'jump', condition: null },
      { from: 'jump', to: 'idle', event: 'land', condition: null },
    ],
  });
  const [currentAnimState, setCurrentAnimState] = useState('idle');
  const [selectedStateMachinePreset, setSelectedStateMachinePreset] = useState<string>('platformer');

  // Animation Groups
  const [showAnimGroups, setShowAnimGroups] = useState(false);
  const [animGroups, setAnimGroups] = useState<AnimGroup[]>([
    { id: 'idle', name: 'idle', nameCn: '待机', color: '#1890ff', icon: '💤', frameIds: [] },
    { id: 'walk', name: 'walk', nameCn: '行走', color: '#52c41a', icon: '🚶', frameIds: [] },
    { id: 'run', name: 'run', nameCn: '跑步', color: '#fa8c16', icon: '🏃', frameIds: [] },
    { id: 'attack', name: 'attack', nameCn: '攻击', color: '#f5222d', icon: '⚔️', frameIds: [] },
  ]);
  const [selectedAnimGroup, setSelectedAnimGroup] = useState<string | null>(null);

  const [projectMeta, setProjectMeta] = useState<ProjectMeta>({
    name: '未命名项目',
    author: '',
    description: '',
  });

  const {
    exportSpritesheet,
    exportGif,
    exportZip,
    exportAseprite,
    exportTexturePacker,
  } = useExport();

  const { processFile, processImageElement, isProcessing } = useImageProcessor(
    { resolution: res, colorCount: colors, paletteName: currentPaletteName, scalingAlgorithm },
    setFrames
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);
  const pixelCanvasRef = useRef<HTMLCanvasElement>(null);
  const playTimeoutRef = useRef<number | null>(null);

  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showPaletteLibrary, setShowPaletteLibrary] = useState(false);
  const [paletteTab, setPaletteTab] = useState('builtin');
  const [paletteSearchQuery, setPaletteSearchQuery] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [asepriteLayerName, setAsepriteLayerName] = useState('Layer 1');
  const [_asepriteFrameTags, _setAsepriteFrameTags] = useState('');
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [paletteExportFormat, setPaletteExportFormat] = useState<'hex' | 'json' | 'pal'>('hex');
  const [showResTooltip, setShowResTooltip] = useState(false);
  const [showColorsTooltip, setShowColorsTooltip] = useState(false);

  const filteredPalettes = paletteSearchQuery
    ? getAllPalettes().filter(
        p =>
          p.name.toLowerCase().includes(paletteSearchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(paletteSearchQuery.toLowerCase())
      )
    : getCategories().flatMap(cat => {
        const catPalettes = getAllPalettes().filter(p => p.category === cat.id);
        return catPalettes;
      });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        const frame = await processFile(file);
        if (frame) {
          addFrame(frame);
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [processFile, addFrame]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      for (const file of files) {
        const frame = await processFile(file);
        if (frame) {
          addFrame(frame);
        }
      }
    },
    [processFile, addFrame]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const drawCurrentFrame = useCallback(() => {
    const canvas = pixelCanvasRef.current;
    if (!canvas || !currentFrame?.imgEl?.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentFrame.imgEl, 0, 0, canvas.width, canvas.height);
  }, [currentFrame]);

  useEffect(() => {
    drawCurrentFrame();
  }, [drawCurrentFrame]);

  // Real-time preview: re-process image when parameters change
  useEffect(() => {
    if (!currentFrame?.imgEl?.complete) return;

    let paletteRgb: [number, number, number][];
    if (paletteMode === 'auto') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = currentFrame.imgEl.naturalWidth;
      tempCanvas.height = currentFrame.imgEl.naturalHeight;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(currentFrame.imgEl, 0, 0);
      const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      paletteRgb = medianCut(imageData, colors);
    } else {
      const hexPalette = BUILTIN_PALETTES[currentPaletteName] || BUILTIN_PALETTES['PICO-8'];
      paletteRgb = hexPaletteToRgb(hexPalette);
    }

    const processed = processImageElement(currentFrame.imgEl, paletteRgb);
    const displayCanvas = pixelCanvasRef.current;
    if (displayCanvas) {
      const dCtx = displayCanvas.getContext('2d')!;
      dCtx.imageSmoothingEnabled = false;
      dCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
      dCtx.drawImage(processed, 0, 0, displayCanvas.width, displayCanvas.height);
    }
  }, [res, colors, scalingAlgorithm, currentFrame, paletteMode, currentPaletteName, processImageElement]);

  // F35: Draw split preview with grid overlay
  useEffect(() => {
    if (!showSplitImageModal || !currentFrame?.imgEl) return;
    const canvas = splitPreviewRef.current;
    if (!canvas) return;

    const imgEl = currentFrame.imgEl;

    function drawSplitPreview() {
      if (!canvas || !imgEl.complete || imgEl.naturalWidth === 0) return;
      const maxW = 400, maxH = 150;
      let w = imgEl.width, h = imgEl.height;
      const scale = Math.min(maxW / w, maxH / h, 1);
      w = Math.round(w * scale);
      h = Math.round(h * scale);

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(imgEl, 0, 0, w, h);

      ctx.strokeStyle = 'rgba(0, 255, 136, 0.8)';
      ctx.lineWidth = 2;

      const cellW = w / splitCols;
      const cellH = h / splitRows;

      for (let col = 1; col < splitCols; col++) {
        ctx.beginPath();
        ctx.moveTo(col * cellW, 0);
        ctx.lineTo(col * cellW, h);
        ctx.stroke();
      }

      for (let row = 1; row < splitRows; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * cellH);
        ctx.lineTo(w, row * cellH);
        ctx.stroke();
      }
    }

    if (!imgEl.complete || imgEl.naturalWidth === 0) {
      imgEl.onload = drawSplitPreview;
    } else {
      drawSplitPreview();
    }
  }, [showSplitImageModal, currentFrame, splitCols, splitRows]);

  const playAnimation = useCallback(() => {
    if (frames.length === 0) return;
    setIsPlaying(true);

    let index = 0;
    const playFrame = () => {
      setCurrentFrameIndex(index);
      index = (index + 1) % frames.length;
      playTimeoutRef.current = window.setTimeout(playFrame, 1000 / fps);
    };
    playFrame();
  }, [frames.length, fps, setCurrentFrameIndex]);

  const stopAnimation = useCallback(() => {
    setIsPlaying(false);
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
  }, []);

  const handleExportSpritesheet = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);
    await exportSpritesheet(frames, res, spriteCols, projectMeta.name);
    setExportProgress(100);
    setIsExporting(false);
    setShowExportModal(false);
  }, [frames, res, spriteCols, projectMeta.name, exportSpritesheet]);

  const handleExportGif = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);
    await exportGif(frames, res, fps, projectMeta.name);
    setExportProgress(100);
    setIsExporting(false);
    setShowExportModal(false);
  }, [frames, res, fps, projectMeta.name, exportGif]);

  const handleExportZip = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);
    await exportZip(frames, res, projectMeta.name, frameNaming);
    setExportProgress(100);
    setIsExporting(false);
    setShowExportModal(false);
  }, [frames, res, projectMeta.name, frameNaming, exportZip]);

  const handleExportAseprite = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);
    await exportAseprite(frames, res, projectMeta.name, asepriteLayerName, _asepriteFrameTags);
    setExportProgress(100);
    setIsExporting(false);
    setShowExportModal(false);
  }, [frames, res, projectMeta.name, asepriteLayerName, _asepriteFrameTags, exportAseprite]);

  const handleExportTexturePacker = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);
    await exportTexturePacker(frames, res, spriteCols, projectMeta.name);
    setExportProgress(100);
    setIsExporting(false);
    setShowExportModal(false);
  }, [frames, res, spriteCols, projectMeta.name, exportTexturePacker]);

  // PV button - Open in Pixel PV tool
  const openInPixelPV = useCallback(() => {
    const palette = BUILTIN_PALETTES[currentPaletteName] || BUILTIN_PALETTES['PICO-8'] || [];
    const colors = palette.map((c: string) => c.startsWith('#') ? c : '#' + c).slice(0, 5);

    const params = new URLSearchParams({
      frames: frames.length.toString(),
      colors: colors.join(','),
      res: res.toString(),
      fps: fps.toString(),
      name: projectMeta.name || 'pixelforge',
      strokeWidth: '4'
    });

    window.open('https://raglike.github.io/pixel-pv/?' + params.toString(), '_blank');
  }, [frames.length, currentPaletteName, res, fps, projectMeta.name]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === ' ') {
        e.preventDefault();
        isPlaying ? stopAnimation() : playAnimation();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (frames.length > 0 && currentFrameIndex < frames.length) {
          removeFrame(currentFrameIndex);
        }
      } else if (e.key === 'ArrowLeft') {
        setCurrentFrameIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentFrameIndex(prev => Math.min(frames.length - 1, prev + 1));
      } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        duplicateFrame(currentFrameIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, frames.length, currentFrameIndex, playAnimation, stopAnimation, removeFrame, duplicateFrame, setCurrentFrameIndex]);

  useEffect(() => {
    const autosaveData = {
      frames: frames.map(f => ({
        id: f.id,
        name: f.name,
        duration: f.duration,
        imageDataUrl: f.imgEl?.src,
      })),
      res,
      colors,
      paletteMode,
      currentPaletteName,
      fps,
      spriteCols,
      frameNaming,
      currentFrameIndex,
      projectMeta,
      version,
    };
    localStorage.setItem('pixelforge_autosave_v2', JSON.stringify(autosaveData));
  }, [frames, res, colors, paletteMode, currentPaletteName, fps, spriteCols, frameNaming, currentFrameIndex, projectMeta, version]);

  useEffect(() => {
    const saved = localStorage.getItem('pixelforge_autosave_v2');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.frames && data.frames.length > 0) {
          const newFrames: Frame[] = [];
          let loadedCount = 0;

          data.frames.forEach((f: { id?: string; name?: string; duration?: number; imageDataUrl?: string }, i: number) => {
            const img = new Image();
            img.onload = () => {
              newFrames[i] = {
                id: f.id || `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                imgEl: img,
                name: f.name || 'frame',
                duration: f.duration || 100,
              };
              loadedCount++;
              if (loadedCount === data.frames.length) {
                setFrames(newFrames.filter(Boolean));
              }
            };
            img.onerror = () => {
              loadedCount++;
              if (loadedCount === data.frames.length) {
                setFrames(newFrames.filter(Boolean));
              }
            };
            img.src = f.imageDataUrl || '';
          });
        }
        if (data.res) setRes(data.res);
        if (data.colors) setColors(data.colors);
        if (data.paletteMode) setPaletteMode(data.paletteMode);
        if (data.currentPaletteName) setCurrentPaletteName(data.currentPaletteName);
        if (data.fps) setFps(data.fps);
        if (data.spriteCols) setSpriteCols(data.spriteCols);
        if (data.frameNaming) setFrameNaming(data.frameNaming);
        if (data.currentFrameIndex !== undefined) setCurrentFrameIndex(data.currentFrameIndex);
        if (data.projectMeta) setProjectMeta(data.projectMeta);
        if (data.version) setVersion(data.version);
      } catch (_e) {
        console.warn('Autosave restore failed:', _e);
      }
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>PixelForge</h1>
          <span className="badge badge-pro">v2.0</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{projectMeta.name}</span>
          <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => setShowProjectModal(true)}>
            项目
          </button>
          <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => setShowExportModal(true)}>
            导出
          </button>
          <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => setShowVersionModal(true)}>
            {version === 'pro' ? 'Pro' : version === 'enterprise' ? 'Enterprise' : 'Free'}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex' }} className="app-layout">
        <div style={{ flex: 1, padding: '16px' }} className="main-content">
          <div className="card">
            <div className="card-header">
              <span className="title-text">画布</span>
              <div className="toolbar-group">
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  分辨率:
                  <select value={res} onChange={e => {
                    const newRes = Number(e.target.value);
                    if (newRes > versionConf.maxResolution) {
                      alert(`分辨率不能超过 ${versionConf.maxResolution}（${version}版本限制）`);
                      return;
                    }
                    setRes(newRes);
                  }} style={{ marginLeft: '8px' }}>
                    {[8, 16, 32, 48, 64, 128, 256].filter(r => r <= versionConf.maxResolution).map(r => (
                      <option key={r} value={r}>{r}x{r}</option>
                    ))}
                  </select>
                  <span
                    style={{ cursor: 'pointer', position: 'relative' }}
                    onMouseEnter={() => setShowResTooltip(true)}
                    onMouseLeave={() => setShowResTooltip(false)}
                  >
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>?</span>
                    {showResTooltip && (
                      <div style={{ position: 'absolute', top: '20px', right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', zIndex: 100, boxShadow: 'var(--shadow-md)' }}>
                        游戏sprite建议16-64像素
                      </div>
                    )}
                  </span>
                </label>
              </div>
            </div>

            <div className="canvas-container" style={{ width: '100%', minWidth: 200, maxWidth: 400, height: 300, marginBottom: '16px' }}>
              <canvas
                ref={pixelCanvasRef}
                width={res}
                height={res}
                style={{ maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated' }}
              />
            </div>

            {frames.length === 0 ? (
              <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>🎨 PixelForge</h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>将图片转换为精美像素艺术</p>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '16px', padding: '12px 32px', marginBottom: '16px' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    上传图片
                  </button>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>支持 PNG、JPG、GIF</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div
                className={`drop-zone ${isProcessing ? 'opacity-50' : ''}`}
                style={{ padding: '16px', textAlign: 'center', cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {isProcessing ? '处理中...' : '拖放更多图片或点击上传'}
                </p>
              </div>
            )}

            {frames.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="section-title">帧 ({frames.length})</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '12px' }}
                      onClick={() => setCurrentFrameIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentFrameIndex === 0}
                    >
                      上一帧
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '12px' }}
                      onClick={() => isPlaying ? stopAnimation() : playAnimation()}
                    >
                      {isPlaying ? '暂停' : '播放'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '12px' }}
                      onClick={() => setCurrentFrameIndex(prev => Math.min(frames.length - 1, prev + 1))}
                      disabled={currentFrameIndex === frames.length - 1}
                    >
                      下一帧
                    </button>
                  </div>
                </div>

                <div className="frame-list">
                  {frames.map((frame, index) => (
                    <div
                      key={frame.id}
                      className={`frame-item ${index === currentFrameIndex ? 'selected' : ''}`}
                      onClick={() => setCurrentFrameIndex(index)}
                      draggable
                      onDragStart={() => setDraggedIndex(index)}
                      onDragEnd={() => setDraggedIndex(null)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => {
                        if (draggedIndex !== null && draggedIndex !== index) {
                          reorderFrames(draggedIndex, index);
                        }
                        setDraggedIndex(null);
                      }}
                    >
                      <canvas
                        width={64}
                        height={64}
                        ref={el => {
                          if (el && frame.imgEl?.complete) {
                            const ctx = el.getContext('2d');
                            if (ctx) {
                              ctx.imageSmoothingEnabled = false;
                              ctx.clearRect(0, 0, 64, 64);
                              ctx.drawImage(frame.imgEl, 0, 0, 64, 64);
                            }
                          }
                        }}
                        style={{ width: '64px', height: '64px', imageRendering: 'pixelated' }}
                      />
                      <p style={{ fontSize: '11px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '64px' }}>{frame.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ width: '320px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: 'calc(100vh - 64px)' }} className="sidebar-panel">
          <div className="card">
            <div className="card-header">
              <span className="title-text">设置</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>缩放算法</label>
                <select
                  value={scalingAlgorithm}
                  onChange={e => setScalingAlgorithm(e.target.value as ScalingAlgorithm)}
                  style={{ width: '100%' }}
                >
                  <option value="nearest-neighbor">最近邻</option>
                  <option value="bilinear">双线性</option>
                  <option value="xbr-2x">xBR 2x</option>
                  <option value="xbr-3x">xBR 3x</option>
                  <option value="xbr-4x">xBR 4x</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', marginBottom: '4px', gap: '4px' }}>
                  颜色数量: {colors}
                  <span
                    style={{ cursor: 'pointer', position: 'relative' }}
                    onMouseEnter={() => setShowColorsTooltip(true)}
                    onMouseLeave={() => setShowColorsTooltip(false)}
                  >
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>?</span>
                    {showColorsTooltip && (
                      <div style={{ position: 'absolute', top: '16px', left: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', zIndex: 100, boxShadow: 'var(--shadow-md)' }}>
                        PICO-8使用16色，NES使用54色
                      </div>
                    )}
                  </span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={256}
                  value={colors}
                  onChange={e => setColors(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>帧率: {fps} FPS</label>
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={fps}
                  onChange={e => setFps(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>精灵列数</label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={spriteCols}
                  onChange={e => setSpriteCols(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>循环模式</label>
                <select
                  value={loopMode}
                  onChange={e => setLoopMode(e.target.value as LoopMode)}
                  style={{ width: '100%' }}
                >
                  <option value="none">无</option>
                  <option value="horizontal">水平循环</option>
                  <option value="vertical">垂直循环</option>
                  <option value="both">双向循环</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="title-text">调色板</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '12px' }}
                  onClick={() => setShowPaletteLibrary(true)}
                >
                  调色板库
                </button>
                <select
                  value={paletteExportFormat}
                  onChange={e => setPaletteExportFormat(e.target.value as 'hex' | 'json' | 'pal')}
                  style={{ fontSize: '12px', borderWidth: '1px', borderRadius: '4px', padding: '0 4px' }}
                >
                  <option value="hex">.hex</option>
                  <option value="json">.json</option>
                  <option value="pal">.pal</option>
                </select>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '12px' }}
                  onClick={() => {
                    const palette = currentPaletteRgb.map(rgb => `#${rgb[0].toString(16).padStart(2,'0')}${rgb[1].toString(16).padStart(2,'0')}${rgb[2].toString(16).padStart(2,'0')}`);
                    if (paletteExportFormat === 'hex') exportPaletteHex(palette, currentPaletteName);
                    else if (paletteExportFormat === 'json') exportPaletteJson(palette, currentPaletteName);
                    else exportPalettePal(palette, currentPaletteName);
                  }}
                >
                  导出
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>调色板模式</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`btn ${paletteMode === 'auto' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setPaletteMode('auto')}
                  >
                    自动
                  </button>
                  <button
                    className={`btn ${paletteMode === 'fixed' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setPaletteMode('fixed')}
                  >
                    固定
                  </button>
                </div>
              </div>

              {paletteMode === 'fixed' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>选择调色板</label>
                  <select
                    value={currentPaletteName}
                    onChange={e => setCurrentPaletteName(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {Object.keys(BUILTIN_PALETTES).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    {Object.keys(customPalettes).map(name => (
                      <option key={name} value={name}>{name} (自定义)</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {currentPaletteRgb.slice(0, colors).map((rgb, i) => (
                  <div
                    key={i}
                    className={`color-swatch ${selectedColor === `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` ? 'selected' : ''}`}
                    style={{ backgroundColor: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` }}
                    onClick={() => setSelectedColor(`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="title-text">动画</span>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '12px' }}
                onClick={() => setShowPresetPanel(!showPresetPanel)}
              >
                预设
              </button>
            </div>

            {versionConf.threePreview && (
              <div style={{ marginBottom: '12px' }}>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => { setShowSplitImageModal(true); }}
                  disabled={frames.length === 0}
                >
                  🪓 图片拆分
                </button>
              </div>
            )}

            {versionConf.animationPresets && showPresetPanel && (
              <div style={{ marginBottom: '8px' }}>
                {getAnimationCategories().map(cat => (
                  <div key={cat.id} style={{ marginBottom: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>{cat.icon} {cat.name}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {getAllTemplates()
                        .filter(t => t.category === cat.id)
                        .map(template => (
                          <button
                            key={template.id}
                            className={`preset-card ${selectedPreset === template.id ? 'active' : ''}`}
                            style={{ fontSize: '11px' }}
                            onClick={() => setSelectedPreset(template.id)}
                          >
                            {template.name}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => setShowStateMachine(!showStateMachine)}
              >
                状态机
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => setShowAnimGroups(!showAnimGroups)}
              >
                动画组
              </button>
              {versionConf.gifImport && (
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setShowGifPanel(true)}
                >
                  🎬 导入 GIF
                </button>
              )}
            </div>
          </div>

          {showAnimGroups && (
            <div className="card">
              <div className="card-header">
                <span className="title-text">动画组</span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {animGroups.map(group => (
                    <button
                      key={group.id}
                      className={`btn ${selectedAnimGroup === group.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={selectedAnimGroup === group.id ? { borderColor: group.color, background: group.color, fontSize: '12px' } : { fontSize: '12px' }}
                      onClick={() => setSelectedAnimGroup(selectedAnimGroup === group.id ? null : group.id)}
                    >
                      {group.icon} {group.nameCn}
                    </button>
                  ))}
                </div>
              </div>

              {selectedAnimGroup && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', marginBottom: '8px' }}>帧列表</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '128px', overflowY: 'auto' }}>
                    {frames
                      .filter(f => animGroups.find(g => g.id === selectedAnimGroup)?.frameIds.includes(f.id))
                      .map(frame => (
                        <div
                          key={frame.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-main)', padding: '4px', borderRadius: '4px' }}
                        >
                          <span style={{ fontSize: '11px' }}>{frame.name}</span>
                          <button
                            style={{ fontSize: '11px', color: '#ef4444' }}
                            onClick={() => {
                              setAnimGroups(prev => prev.map(g =>
                                g.id === selectedAnimGroup
                                  ? { ...g, frameIds: g.frameIds.filter(id => id !== frame.id) }
                                  : g
                              ));
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    点击下方帧列表中的帧可添加到组
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  id="new-group-name"
                  placeholder="新组名称"
                  style={{ flex: 1, fontSize: '12px' }}
                />
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '12px' }}
                  onClick={() => {
                    const input = document.getElementById('new-group-name') as HTMLInputElement;
                    if (input.value) {
                      const newGroup: AnimGroup = {
                        id: input.value.toLowerCase().replace(/\s+/g, '-'),
                        name: input.value.toLowerCase(),
                        nameCn: input.value,
                        color: '#' + Math.floor(Math.random()*16777215).toString(16),
                        icon: '🎭',
                        frameIds: [],
                      };
                      setAnimGroups(prev => [...prev, newGroup]);
                      input.value = '';
                    }
                  }}
                >
                  添加组
                </button>
              </div>
            </div>
          )}

          {showStateMachine && (
            <div className="card">
              <div className="card-header">
                <span className="title-text">状态机</span>
                <select
                  value={selectedStateMachinePreset}
                  onChange={e => {
                    setSelectedStateMachinePreset(e.target.value);
                    const presets = getStateMachinePresets();
                    const preset = presets.find(p => p.id === e.target.value);
                    if (preset) {
                      setAnimStateMachine({
                        initial: preset.initial,
                        transitions: preset.transitions,
                      });
                    }
                  }}
                  style={{ fontSize: '12px' }}
                >
                  {getStateMachinePresets().map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', marginBottom: '8px' }}>当前状态: <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{currentAnimState}</span></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Array.from(new Set(animStateMachine.transitions.map(t => t.from))).map(state => (
                    <button
                      key={state}
                      className={`btn ${currentAnimState === state ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '12px' }}
                      onClick={() => setCurrentAnimState(state)}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>可用转换</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                  {animStateMachine.transitions
                    .filter(t => t.from === currentAnimState)
                    .map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', background: 'var(--bg-main)', padding: '8px', borderRadius: '4px' }}>
                        <span>{currentAnimState} → {t.to} (事件: {t.event})</span>
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={() => {
                            setAnimStateMachine(prev => ({
                              ...prev,
                              transitions: prev.transitions.filter(tr =>
                                !(tr.from === t.from && tr.to === t.to && tr.event === t.event)
                              ),
                            }));
                          }}
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  {animStateMachine.transitions.filter(t => t.from === currentAnimState).length === 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>无可用转换</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  id="sm-to-state"
                  style={{ flex: 1, fontSize: '12px' }}
                >
                  <option value="">选择目标状态...</option>
                  {Array.from(new Set(animStateMachine.transitions.map(t => t.to))).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <input
                  type="text"
                  id="sm-event"
                  placeholder="事件名"
                  style={{ flex: 1, fontSize: '12px' }}
                />
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '12px' }}
                  onClick={() => {
                    const toSelect = document.getElementById('sm-to-state') as HTMLSelectElement;
                    const eventInput = document.getElementById('sm-event') as HTMLInputElement;
                    const toState = toSelect.value;
                    const event = eventInput.value;
                    if (toState && event) {
                      setAnimStateMachine(prev => ({
                        ...prev,
                        transitions: [...prev.transitions, { from: currentAnimState, to: toState, event, condition: null }],
                      }));
                      toSelect.value = '';
                      eventInput.value = '';
                    }
                  }}
                >
                  添加
                </button>
              </div>
            </div>
          )}

          {versionConf.onionSkin && (
            <div className="card">
              <div className="card-header">
                <span className="title-text">洋葱皮</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={onionSkin}
                    onChange={e => setOnionSkin(e.target.checked)}
                  />
                  <span style={{ fontSize: '12px' }}>启用</span>
                </label>
              </div>

              {onionSkin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>透明度: {onionOpacity}%</label>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      value={onionOpacity}
                      onChange={e => setOnionOpacity(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={onionPrev}
                        onChange={e => setOnionPrev(e.target.checked)}
                      />
                      <span style={{ fontSize: '12px' }}>前帧</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={onionNext}
                        onChange={e => setOnionNext(e.target.checked)}
                      />
                      <span style={{ fontSize: '12px' }}>后帧</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>导出</h2>

            {isExporting && (
              <div style={{ marginBottom: '16px' }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${exportProgress}%` }} />
                </div>
                <p style={{ fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>导出中... {Math.round(exportProgress)}%</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleExportSpritesheet}>
                导出为 PNG 精灵图
              </button>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleExportGif}>
                导出为 GIF 动画
              </button>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleExportZip}>
                导出为 ZIP (PNG序列)
              </button>
              {versionConf.asepriteExport && (
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleExportAseprite}>
                  导出为 Aseprite JSON
                </button>
              )}
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleExportTexturePacker}>
                导出为 TexturePacker (.tps)
              </button>
              <button
                className="btn btn-primary"
                style={{ width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                onClick={openInPixelPV}
              >
                制作游戏PV
              </button>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Aseprite 图层名</label>
              <input
                type="text"
                value={asepriteLayerName}
                onChange={e => setAsepriteLayerName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setShowExportModal(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {showPaletteLibrary && (
        <div className="modal-overlay" onClick={() => setShowPaletteLibrary(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>调色板库</h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="搜索调色板..."
                value={paletteSearchQuery}
                onChange={e => setPaletteSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                className={`tab-btn ${paletteTab === 'builtin' ? 'active' : ''}`}
                onClick={() => setPaletteTab('builtin')}
              >
                内置
              </button>
              <button
                className={`tab-btn ${paletteTab === 'custom' ? 'active' : ''}`}
                onClick={() => setPaletteTab('custom')}
              >
                自定义
              </button>
            </div>

            <div style={{ maxHeight: '384px', overflowY: 'auto' }}>
              {paletteTab === 'builtin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredPalettes.slice(0, 20).map(palette => (
                    <div
                      key={palette.id}
                      className={`palette-item ${currentPaletteName === palette.id ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentPaletteName(palette.id);
                        setShowPaletteLibrary(false);
                      }}
                    >
                      <p style={{ fontWeight: 500 }}>{palette.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{palette.description}</p>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        {palette.colors.slice(0, 8).map((color, i) => (
                          <div
                            key={i}
                            style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {paletteTab === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.keys(customPalettes).map(name => (
                    <div
                      key={name}
                      className={`palette-item ${currentPaletteName === name ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentPaletteName(name);
                        setShowPaletteLibrary(false);
                      }}
                    >
                      <p style={{ fontWeight: 500 }}>{name}</p>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        {customPalettes[name].slice(0, 8).map((color, i) => (
                          <div
                            key={i}
                            style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setShowPaletteLibrary(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {showVersionModal && (
        <div className="modal-overlay" onClick={() => setShowVersionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>版本信息</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(VERSION_CONFIG).map(([ver, conf]) => (
                <div
                  key={ver}
                  className={`palette-item ${version === ver ? 'active' : ''}`}
                  onClick={() => {
                    setVersion(ver);
                    localStorage.setItem('pixelforge_version', ver);
                    setShowVersionModal(false);
                  }}
                >
                  <p style={{ fontWeight: 500, textTransform: 'capitalize' }}>{ver}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    分辨率: {conf.maxResolution === Infinity ? '无限' : `最大 ${conf.maxResolution}`} |
                    帧数: {conf.maxFrames === Infinity ? '无限' : `最大 ${conf.maxFrames}`}
                  </p>
                </div>
              ))}
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setShowVersionModal(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>项目设置</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>项目名称</label>
                <input
                  type="text"
                  value={projectMeta.name}
                  onChange={e => setProjectMeta(prev => ({ ...prev, name: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>作者</label>
                <input
                  type="text"
                  value={projectMeta.author}
                  onChange={e => setProjectMeta(prev => ({ ...prev, author: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>描述</label>
                <textarea
                  value={projectMeta.description}
                  onChange={e => setProjectMeta(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%' }}
                  rows={3}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowProjectModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => setShowProjectModal(false)}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showGifPanel && (
        <div className="modal-overlay" onClick={() => setShowGifPanel(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>导入 GIF</h2>

            <div
              className="gif-drop-zone"
              onClick={() => gifInputRef.current?.click()}
            >
              <input
                ref={gifInputRef}
                type="file"
                accept=".gif"
                style={{ display: 'none' }}
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  try {
                    const gifFrames = await loadGIFFrames(file);
                    if (frames.length + gifFrames.length > versionConf.maxFrames) {
                      alert(`GIF有${gifFrames.length}帧，当前${frames.length}帧，相加后超出${versionConf.maxFrames}帧限制（${version}版本限制）`);
                      return;
                    }
                    for (const { img, delay } of gifFrames) {
                      const frame: Frame = {
                        id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        imgEl: img,
                        name: `frame_${frames.length + 1}`,
                        duration: delay,
                      };
                      addFrame(frame);
                    }
                  } catch (err) {
                    console.error('Failed to import GIF:', err);
                  }
                  setShowGifPanel(false);
                }}
              />
              <p>点击选择 GIF 文件或拖放到此处</p>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setShowGifPanel(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {showSplitImageModal && (
        <div className="modal-overlay" onClick={() => setShowSplitImageModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--accent)' }}>🪓 图片拆分</h3>
            <p style={{ fontSize: '13px', marginBottom: '12px', color: 'var(--text-secondary)' }}>将大图按网格拆分为多个帧，适合 spritesheet 拆分</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>当前帧预览</label>
              <div style={{ minHeight: '120px', background: '#0d0d1a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentFrame?.imgEl ? (
                  <canvas
                    ref={splitPreviewRef}
                    style={{ maxWidth: '100%', maxHeight: '150px', imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>请先加载图片</span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="splitUniform"
                  checked={splitUniform}
                  onChange={e => {
                    setSplitUniform(e.target.checked);
                    if (e.target.checked) setSplitRows(splitCols);
                  }}
                />
                <label htmlFor="splitUniform" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>均匀分割（行列数相同）</label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>列数</label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={splitCols}
                    onChange={e => {
                      const val = Math.max(1, Math.min(16, Number(e.target.value)));
                      setSplitCols(val);
                      if (splitUniform) setSplitRows(val);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>行数</label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={splitRows}
                    onChange={e => {
                      const val = Math.max(1, Math.min(16, Number(e.target.value)));
                      setSplitRows(val);
                      if (splitUniform) setSplitCols(val);
                    }}
                    disabled={splitUniform}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', marginBottom: '16px', color: 'var(--text-muted)' }}>
              拆分结果: {splitCols * splitRows} 帧 ({splitCols}×{splitRows})
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', background: 'var(--accent)', borderColor: 'var(--accent)' }}
                onClick={async () => {
                  if (!currentFrame?.imgEl) return;

                  const imgEl = currentFrame.imgEl;
                  const splitResults = splitImageGrid(imgEl, splitCols, splitRows);

                  if (splitResults.length === 0) {
                    alert('拆分失败，请确保图片已加载');
                    return;
                  }

                  const newFrames = await splitResultsToFrames(splitResults, currentFrame.name || 'frame', currentFrame.duration || 100);

                  if (newFrames.length > versionConf.maxFrames) {
                    alert(`拆分后有${newFrames.length}帧，超出${versionConf.maxFrames}帧限制`);
                    return;
                  }

                  setFrames(newFrames);
                  setCurrentFrameIndex(0);
                  setShowSplitImageModal(false);
                }}
                disabled={!currentFrame?.imgEl}
              >
                🪓 拆分
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setShowSplitImageModal(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// F35: Image Split / Grid Cut helper functions
function splitImageGrid(imgEl: HTMLImageElement, splitCols: number, splitRows: number): HTMLCanvasElement[] {
  if (!imgEl || !imgEl.complete || imgEl.naturalWidth === 0) {
    return [];
  }

  const results: HTMLCanvasElement[] = [];
  const cellW = Math.floor(imgEl.naturalWidth / splitCols);
  const cellH = Math.floor(imgEl.naturalHeight / splitRows);

  for (let row = 0; row < splitRows; row++) {
    for (let col = 0; col < splitCols; col++) {
      const canvas = document.createElement('canvas');
      canvas.width = cellW;
      canvas.height = cellH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          imgEl,
          col * cellW, row * cellH, cellW, cellH,
          0, 0, cellW, cellH
        );
      }
      results.push(canvas);
    }
  }

  return results;
}

async function splitResultsToFrames(splitResults: HTMLCanvasElement[], frameName: string, frameDuration: number): Promise<Frame[]> {
  const newFrames: Frame[] = [];

  for (let i = 0; i < splitResults.length; i++) {
    const canvas = splitResults[i];
    const imgEl = new Image();
    imgEl.src = canvas.toDataURL();

    await new Promise<void>(resolve => {
      imgEl.onload = () => resolve();
      if (imgEl.complete && imgEl.naturalWidth > 0) resolve();
    });

    newFrames.push({
      id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`,
      imgEl: imgEl,
      name: `${frameName} ${i + 1}`,
      duration: frameDuration,
    });
  }

  return newFrames;
}
