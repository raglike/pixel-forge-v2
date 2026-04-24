import { useState } from 'react';
import type { Board, BoardMode } from '@/types';

interface BoardManagerProps {
  boards: Board[];
  currentBoardId: string | null;
  boardMode: BoardMode;
  onBoardSelect: (id: string) => void;
  onBoardAdd: () => void;
  onBoardDelete: (id: string) => void;
  onBoardRename: (id: string, name: string) => void;
  onBoardModeChange: (mode: BoardMode) => void;
  onBoardDimensionsChange: (id: string, width: number, height: number) => void;
  maxBoards?: number;
}

export default function BoardManager({
  boards,
  currentBoardId,
  boardMode,
  onBoardSelect,
  onBoardAdd,
  onBoardDelete,
  onBoardRename,
  onBoardModeChange,
  onBoardDimensionsChange,
  maxBoards = 16,
}: BoardManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardW, setNewBoardW] = useState(32);
  const [newBoardH, setNewBoardH] = useState(32);

  const currentBoard = boards.find(b => b.id === currentBoardId);

  const handleStartEdit = (board: Board) => {
    setEditingId(board.id);
    setEditName(board.name);
  };

  const handleFinishEdit = (id: string) => {
    if (editName.trim()) {
      onBoardRename(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleAddBoard = () => {
    setNewBoardName('');
    setShowNewBoard(false);
    onBoardAdd();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Board Mode Toggle */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
          画板模式
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className={`btn ${boardMode === 'uniform' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '11px', padding: '6px' }}
            onClick={() => onBoardModeChange('uniform')}
          >
            统一尺寸
          </button>
          <button
            className={`btn ${boardMode === 'independent' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '11px', padding: '6px' }}
            onClick={() => onBoardModeChange('independent')}
          >
            独立尺寸
          </button>
        </div>
      </div>

      {/* Board List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 500 }}>画板 ({boards.length}/{maxBoards})</span>
          <button
            className="btn btn-primary"
            style={{ fontSize: '11px', padding: '4px 8px' }}
            onClick={() => {
              if (boards.length < maxBoards) {
                setShowNewBoard(true);
                setNewBoardName(`画板 ${boards.length + 1}`);
                setNewBoardW(currentBoard?.width || 32);
                setNewBoardH(currentBoard?.height || 32);
              }
            }}
            disabled={boards.length >= maxBoards}
          >
            + 新建
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
          {boards.map(board => (
            <div
              key={board.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '6px',
                background: board.id === currentBoardId ? 'var(--accent-light)' : 'var(--bg-main)',
                border: `1px solid ${board.id === currentBoardId ? 'var(--accent)' : 'transparent'}`,
                cursor: 'pointer',
              }}
              onClick={() => onBoardSelect(board.id)}
            >
              {/* Board thumbnail */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#0d0d1a',
                  borderRadius: '4px',
                  flexShrink: 0,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {Object.keys(board.pixels).length > 0 ? (
                  <canvas
                  width={32}
                  height={32}
                  style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
                  ref={canvas => {
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    ctx.clearRect(0, 0, 32, 32);
                    const scale = Math.min(32 / board.width, 32 / board.height);
                    Object.entries(board.pixels).forEach(([key, rgba]) => {
                      const [xStr, yStr] = key.split(',');
                      const x = parseInt(xStr, 10);
                      const y = parseInt(yStr, 10);
                      const px = Math.floor(x * scale);
                      const py = Math.floor(y * scale);
                      const ps = Math.max(1, Math.floor(scale));
                      ctx.fillStyle = rgba;
                      ctx.fillRect(px, py, ps, ps);
                    });
                  }}
                  />
                ) : (
                  <span style={{ fontSize: '8px', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>空</span>
                )}
              </div>

              {/* Board info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === board.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => handleFinishEdit(board.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleFinishEdit(board.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={e => e.stopPropagation()}
                    autoFocus
                    style={{ width: '100%', fontSize: '12px', padding: '2px 4px' }}
                  />
                ) : (
                  <p
                    style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    onDoubleClick={e => { e.stopPropagation(); handleStartEdit(board); }}
                  >
                    {board.name}
                  </p>
                )}
                <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {board.width}×{board.height} · {board.frames.length}帧
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                  onClick={() => handleStartEdit(board)}
                  title="重命名"
                >
                  ✏️
                </button>
                {boards.length > 1 && (
                  <button
                    className="btn btn-danger"
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                    onClick={() => onBoardDelete(board.id)}
                    title="删除"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Board Dimensions (for independent mode) */}
      {currentBoard && boardMode === 'independent' && (
        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
            当前画板尺寸
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>W</span>
              <input
                type="number"
                min={8}
                max={256}
                value={currentBoard.width}
                onChange={e => {
                  const w = Math.max(8, Math.min(256, Number(e.target.value)));
                  onBoardDimensionsChange(currentBoard.id, w, currentBoard.height);
                }}
                style={{ width: '60px', fontSize: '12px', padding: '4px' }}
              />
            </div>
            <span style={{ color: 'var(--text-muted)' }}>×</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>H</span>
              <input
                type="number"
                min={8}
                max={256}
                value={currentBoard.height}
                onChange={e => {
                  const h = Math.max(8, Math.min(256, Number(e.target.value)));
                  onBoardDimensionsChange(currentBoard.id, currentBoard.width, h);
                }}
                style={{ width: '60px', fontSize: '12px', padding: '4px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* New Board Dialog */}
      {showNewBoard && (
        <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>新建画板</p>
          <div style={{ marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="画板名称"
              value={newBoardName}
              onChange={e => setNewBoardName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddBoard(); }}
              style={{ width: '100%', fontSize: '12px' }}
              autoFocus
            />
          </div>
          {boardMode === 'independent' && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="number"
                min={8}
                max={256}
                value={newBoardW}
                onChange={e => setNewBoardW(Math.max(8, Math.min(256, Number(e.target.value))))}
                style={{ width: '80px', fontSize: '12px' }}
                placeholder="宽"
              />
              <span style={{ color: 'var(--text-muted)', lineHeight: '32px' }}>×</span>
              <input
                type="number"
                min={8}
                max={256}
                value={newBoardH}
                onChange={e => setNewBoardH(Math.max(8, Math.min(256, Number(e.target.value))))}
                style={{ width: '80px', fontSize: '12px' }}
                placeholder="高"
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '12px' }}
              onClick={() => setShowNewBoard(false)}
            >
              取消
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, fontSize: '12px' }}
              onClick={handleAddBoard}
            >
              创建
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
