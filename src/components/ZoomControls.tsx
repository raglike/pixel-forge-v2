interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  min?: number;
  max?: number;
}

export default function ZoomControls({
  zoom,
  onZoomChange,
  min = 100,
  max = 800,
}: ZoomControlsProps) {
  const zoomPresets = [100, 200, 400, 800];

  const handleZoomIn = () => {
    const newZoom = Math.min(max, zoom + 100);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(min, zoom - 100);
    onZoomChange(newZoom);
  };

  const handleReset = () => {
    onZoomChange(100);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        className="btn btn-secondary"
        style={{ padding: '4px 8px', fontSize: '12px' }}
        onClick={handleZoomOut}
        disabled={zoom <= min}
        title="缩小"
      >
        −
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={50}
          value={zoom}
          onChange={e => onZoomChange(Number(e.target.value))}
          style={{ width: '100px' }}
        />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'center' }}>
          {zoom}%
        </span>
      </div>

      <button
        className="btn btn-secondary"
        style={{ padding: '4px 8px', fontSize: '12px' }}
        onClick={handleZoomIn}
        disabled={zoom >= max}
        title="放大"
      >
        +
      </button>

      <div style={{ display: 'flex', gap: '4px' }}>
        {zoomPresets.map(z => (
          <button
            key={z}
            className={`btn btn-secondary ${zoom === z ? 'btn-primary' : ''}`}
            style={{ padding: '2px 6px', fontSize: '11px' }}
            onClick={() => onZoomChange(z)}
          >
            {z}%
          </button>
        ))}
      </div>

      <button
        className="btn btn-secondary"
        style={{ padding: '4px 8px', fontSize: '12px' }}
        onClick={handleReset}
        title="重置缩放"
      >
        ⟲
      </button>
    </div>
  );
}
