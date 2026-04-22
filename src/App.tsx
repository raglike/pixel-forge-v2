import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useFrameManagement, useImageProcessor } from '@/hooks/useImageProcessor';
import { usePalette, usePaletteEditor } from '@/hooks/usePalette';
import { useExport } from '@/hooks/useExport';
import { BUILTIN_PALETTES, getAllPalettes, getCategories } from '@/data/palettes';
import { getAllTemplates, getAnimationCategories } from '@/data/templates';
import type { Frame, VersionConfig, ScalingAlgorithm, ProjectMeta } from '@/types';

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

  const { processFile, isProcessing } = useImageProcessor(
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
    <div className="min-h-screen bg-[var(--bg-main)]">
      <header className="bg-white border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">PixelForge</h1>
          <span className="badge badge-pro">v2.0</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-muted)]">{projectMeta.name}</span>
          <button className="btn btn-secondary text-sm" onClick={() => setShowProjectModal(true)}>
            项目
          </button>
          <button className="btn btn-secondary text-sm" onClick={() => setShowExportModal(true)}>
            导出
          </button>
          <button className="btn btn-secondary text-sm" onClick={() => setShowVersionModal(true)}>
            {version === 'pro' ? 'Pro' : version === 'enterprise' ? 'Enterprise' : 'Free'}
          </button>
        </div>
      </header>

      <div className="flex">
        <div className="flex-1 p-4">
          <div className="card">
            <div className="card-header">
              <span className="title-text">画布</span>
              <div className="toolbar-group">
                <label className="text-sm text-[var(--text-secondary)]">
                  分辨率:
                  <select value={res} onChange={e => setRes(Number(e.target.value))} className="ml-2">
                    {[8, 16, 32, 48, 64, 128, 256].map(r => (
                      <option key={r} value={r}>{r}x{r}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="canvas-container mb-4" style={{ width: 400, height: 400 }}>
              <canvas
                ref={pixelCanvasRef}
                width={res}
                height={res}
                className="max-w-full max-h-full"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <div
              className={`drop-zone p-8 text-center cursor-pointer ${isProcessing ? 'opacity-50' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <p className="text-[var(--text-secondary)]">
                {isProcessing ? '处理中...' : '拖放图片或点击上传'}
              </p>
            </div>

            {frames.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="section-title">帧 ({frames.length})</span>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-secondary text-sm"
                      onClick={() => setCurrentFrameIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentFrameIndex === 0}
                    >
                      上一帧
                    </button>
                    <button
                      className="btn btn-primary text-sm"
                      onClick={() => isPlaying ? stopAnimation() : playAnimation()}
                    >
                      {isPlaying ? '暂停' : '播放'}
                    </button>
                    <button
                      className="btn btn-secondary text-sm"
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
                        className="w-16 h-16"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <p className="text-xs text-center truncate w-16">{frame.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-64px)]">
          <div className="card">
            <div className="card-header">
              <span className="title-text">设置</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">缩放算法</label>
                <select
                  value={scalingAlgorithm}
                  onChange={e => setScalingAlgorithm(e.target.value as ScalingAlgorithm)}
                  className="w-full"
                >
                  <option value="bilinear">双线性</option>
                  <option value="xbr-2x">xBR 2x</option>
                  <option value="xbr-3x">xBR 3x</option>
                  <option value="xbr-4x">xBR 4x</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">颜色数量: {colors}</label>
                <input
                  type="range"
                  min={2}
                  max={256}
                  value={colors}
                  onChange={e => setColors(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">帧率: {fps} FPS</label>
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={fps}
                  onChange={e => setFps(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">精灵列数</label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={spriteCols}
                  onChange={e => setSpriteCols(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="title-text">调色板</span>
              <button
                className="btn btn-secondary text-sm"
                onClick={() => setShowPaletteLibrary(true)}
              >
                调色板库
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">调色板模式</label>
                <div className="flex gap-2">
                  <button
                    className={`btn ${paletteMode === 'auto' ? 'btn-primary' : 'btn-secondary'} flex-1`}
                    onClick={() => setPaletteMode('auto')}
                  >
                    自动
                  </button>
                  <button
                    className={`btn ${paletteMode === 'fixed' ? 'btn-primary' : 'btn-secondary'} flex-1`}
                    onClick={() => setPaletteMode('fixed')}
                  >
                    固定
                  </button>
                </div>
              </div>

              {paletteMode === 'fixed' && (
                <div>
                  <label className="block text-sm mb-1">选择调色板</label>
                  <select
                    value={currentPaletteName}
                    onChange={e => setCurrentPaletteName(e.target.value)}
                    className="w-full"
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

              <div className="flex flex-wrap gap-1">
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
                className="btn btn-secondary text-sm"
                onClick={() => setShowPresetPanel(!showPresetPanel)}
              >
                预设
              </button>
            </div>

            {showPresetPanel && (
              <div className="mb-4 space-y-2">
                {getAnimationCategories().map(cat => (
                  <div key={cat.id}>
                    <p className="text-sm font-medium mb-1">{cat.icon} {cat.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {getAllTemplates()
                        .filter(t => t.category === cat.id)
                        .map(template => (
                          <button
                            key={template.id}
                            className={`preset-card text-xs ${selectedPreset === template.id ? 'active' : ''}`}
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

            <div className="space-y-2">
              <button
                className="btn btn-secondary w-full"
                onClick={() => setShowGifPanel(true)}
              >
                导入 GIF
              </button>
            </div>
          </div>

          {versionConf.onionSkin && (
            <div className="card">
              <div className="card-header">
                <span className="title-text">洋葱皮</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onionSkin}
                    onChange={e => setOnionSkin(e.target.checked)}
                  />
                  <span className="text-sm">启用</span>
                </label>
              </div>

              {onionSkin && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">透明度: {onionOpacity}%</label>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      value={onionOpacity}
                      onChange={e => setOnionOpacity(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={onionPrev}
                        onChange={e => setOnionPrev(e.target.checked)}
                      />
                      <span className="text-sm">前帧</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={onionNext}
                        onChange={e => setOnionNext(e.target.checked)}
                      />
                      <span className="text-sm">后帧</span>
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
            <h2 className="text-lg font-semibold mb-4">导出</h2>

            {isExporting && (
              <div className="mb-4">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${exportProgress}%` }} />
                </div>
                <p className="text-sm text-center mt-2">导出中... {Math.round(exportProgress)}%</p>
              </div>
            )}

            <div className="space-y-2">
              <button className="btn btn-primary w-full" onClick={handleExportSpritesheet}>
                导出为 PNG 精灵图
              </button>
              <button className="btn btn-primary w-full" onClick={handleExportGif}>
                导出为 GIF 动画
              </button>
              <button className="btn btn-secondary w-full" onClick={handleExportZip}>
                导出为 ZIP (PNG序列)
              </button>
              {versionConf.asepriteExport && (
                <button className="btn btn-secondary w-full" onClick={handleExportAseprite}>
                  导出为 Aseprite JSON
                </button>
              )}
              <button className="btn btn-secondary w-full" onClick={handleExportTexturePacker}>
                导出为 TexturePacker (.tps)
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <label className="block text-sm mb-1">Aseprite 图层名</label>
              <input
                type="text"
                value={asepriteLayerName}
                onChange={e => setAsepriteLayerName(e.target.value)}
                className="w-full"
              />
            </div>

            <button
              className="btn btn-secondary w-full mt-4"
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
            <h2 className="text-lg font-semibold mb-4">调色板库</h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="搜索调色板..."
                value={paletteSearchQuery}
                onChange={e => setPaletteSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="flex gap-2 mb-4">
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

            <div className="max-h-96 overflow-y-auto">
              {paletteTab === 'builtin' && (
                <div className="space-y-4">
                  {filteredPalettes.slice(0, 20).map(palette => (
                    <div
                      key={palette.id}
                      className={`palette-item ${currentPaletteName === palette.id ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentPaletteName(palette.id);
                        setShowPaletteLibrary(false);
                      }}
                    >
                      <p className="font-medium">{palette.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{palette.description}</p>
                      <div className="flex gap-1 mt-1">
                        {palette.colors.slice(0, 8).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {paletteTab === 'custom' && (
                <div className="space-y-2">
                  {Object.keys(customPalettes).map(name => (
                    <div
                      key={name}
                      className={`palette-item ${currentPaletteName === name ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentPaletteName(name);
                        setShowPaletteLibrary(false);
                      }}
                    >
                      <p className="font-medium">{name}</p>
                      <div className="flex gap-1 mt-1">
                        {customPalettes[name].slice(0, 8).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className="btn btn-secondary w-full mt-4"
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
            <h2 className="text-lg font-semibold mb-4">版本信息</h2>

            <div className="space-y-2">
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
                  <p className="font-medium capitalize">{ver}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    分辨率: {conf.maxResolution === Infinity ? '无限' : `最大 ${conf.maxResolution}`} |
                    帧数: {conf.maxFrames === Infinity ? '无限' : `最大 ${conf.maxFrames}`}
                  </p>
                </div>
              ))}
            </div>

            <button
              className="btn btn-secondary w-full mt-4"
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
            <h2 className="text-lg font-semibold mb-4">项目设置</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">项目名称</label>
                <input
                  type="text"
                  value={projectMeta.name}
                  onChange={e => setProjectMeta(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">作者</label>
                <input
                  type="text"
                  value={projectMeta.author}
                  onChange={e => setProjectMeta(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">描述</label>
                <textarea
                  value={projectMeta.description}
                  onChange={e => setProjectMeta(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="btn btn-secondary flex-1"
                onClick={() => setShowProjectModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary flex-1"
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
            <h2 className="text-lg font-semibold mb-4">导入 GIF</h2>

            <div
              className="gif-drop-zone"
              onClick={() => gifInputRef.current?.click()}
            >
              <input
                ref={gifInputRef}
                type="file"
                accept=".gif"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setShowGifPanel(false);
                }}
              />
              <p>点击选择 GIF 文件或拖放到此处</p>
            </div>

            <button
              className="btn btn-secondary w-full mt-4"
              onClick={() => setShowGifPanel(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
