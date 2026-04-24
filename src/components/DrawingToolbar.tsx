import React, { useState } from 'react';
import type { DrawingTool } from '@/types';

interface DrawingToolbarProps {
  active: boolean;
  tool: DrawingTool;
  color: string;
  paletteColors: string[];
  onToggle: () => void;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onClearPixels: () => void;
  onUndoPixel: () => void;
  canUndo: boolean;
}

const TOOLS: { id: DrawingTool; icon: string; label: string }[] = [
  { id: 'brush', icon: '🖌️', label: '画笔' },
  { id: 'eraser', icon: '🧹', label: '橡皮擦' },
  { id: 'eyedropper', icon: '💧', label: '取色器' },
  { id: 'select', icon: '🔲', label: '选择' },
];

export default function DrawingToolbar({
  active,
  tool,
  color,
  paletteColors,
  onToggle,
  onToolChange,
  onColorChange,
  onClearPixels,
  onUndoPixel,
  canUndo,
}: DrawingToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#000000');

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
    onColorChange(e.target.value);
  };

  const applyCustomColor = () => {
    onColorChange(customColor);
    setShowColorPicker(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Toggle Drawing Mode */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 500 }}>手绘模式</span>
        <button
          className={`btn ${active ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '12px', padding: '4px 12px' }}
          onClick={onToggle}
        >
          {active ? '✏️ 绘画中' : '启用绘画'}
        </button>
      </div>

      {active && (
        <>
          {/* Tool Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              工具
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {TOOLS.map(t => (
                <button
                  key={t.id}
                  className={`btn ${tool === t.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '12px', padding: '8px 4px', justifyContent: 'center' }}
                  onClick={() => onToolChange(t.id)}
                  title={t.label}
                >
                  <span style={{ fontSize: '16px' }}>{t.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              颜色
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Current Color */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '2px solid var(--border)',
                  background: color,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />

              {/* Palette Colors */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
                {paletteColors.slice(0, 12).map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: c,
                      border: `2px solid ${color === c ? 'var(--accent)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      boxShadow: color === c ? '0 0 0 2px var(--accent-light)' : 'none',
                    }}
                    onClick={() => onColorChange(c)}
                  />
                ))}
              </div>
            </div>

            {/* Custom Color Picker */}
            {showColorPicker && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  style={{ width: '40px', height: '32px', cursor: 'pointer', border: 'none' }}
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={e => {
                    setCustomColor(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      onColorChange(e.target.value);
                    }
                  }}
                  style={{ flex: 1, fontSize: '12px', fontFamily: 'monospace' }}
                  placeholder="#000000"
                />
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={applyCustomColor}
                >
                  应用
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '12px' }}
              onClick={onUndoPixel}
              disabled={!canUndo}
            >
              ↩️ 撤销
            </button>
            <button
              className="btn btn-danger"
              style={{ flex: 1, fontSize: '12px' }}
              onClick={onClearPixels}
            >
              🗑️ 清空
            </button>
          </div>

          {/* Tool Tips */}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            <p>🖌️ <b>画笔</b>: 点击/拖动绘制像素</p>
            <p>🧹 <b>橡皮擦</b>: 点击/拖动删除像素</p>
            <p>💧 <b>取色器</b>: 点击画布上的像素获取颜色</p>
            <p>🔲 <b>选择</b>: 点击像素查看信息</p>
            <p style={{ marginTop: '4px' }}>💡 右键点击可删除单个像素</p>
          </div>
        </>
      )}
    </div>
  );
}
