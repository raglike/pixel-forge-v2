# PixelForge v2.0

Modern pixel art animation tool built with Vite + React + TypeScript.

## Features

- **Multi-frame pixel art editing** - Upload images and convert to pixel art with adjustable resolution
- **Palette management** - 50+ built-in palettes, custom palette support
- **Animation preview and playback** - Real-time animation with configurable FPS
- **xBR pixel scaling** - 2x/3x/4x xBR algorithm for crisp pixel art upscaling
- **Multiple export formats** - PNG spritesheet, GIF, ZIP, Aseprite JSON, TexturePacker
- **Onion skinning** - See previous/next frames overlaid for animation reference
- **Batch processing** - Process multiple images at once
- **Project save/load** - LocalStorage autosave
- **Plugin system support**
- **Animation state machine** - Define animation states and transitions
- **Animation groups** - Organize frames into animation states (idle, walk, run, etc.)
- **GIF import** - Import animated GIFs as frame sequences
- **Image splitting** - Split large images into grid frames
- **Infinite loop mode** - Create seamless looping animations
- **Pixel inspector** - Detect and fix orphan pixels, semi-transparent pixels

## New in v2.1: Drawing & Boards

- **Canvas zoom (100%-800%)** - Zoom in/out on the canvas with pixel-crisp rendering
- **Manual pixel drawing** - Draw pixels directly on the canvas with:
  - Brush tool - Paint pixels with selected color
  - Eraser tool - Remove pixels
  - Eyedropper - Pick color from canvas
  - Selection tool - Select and inspect pixels
- **Multi-board support** - Create and manage multiple independent canvases
- **Color picker** - Custom color input with palette presets
- **Apply pixels to frame** - Merge drawn pixels back into animation frames

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Deployment

The project is configured for GitHub Pages deployment. To deploy:

1. Push to a GitHub repository
2. Enable GitHub Pages in repository settings
3. The site will be available at `https://[username].github.io/[repo-name]/`

## Version Tiers

- **Free**: Max 64x64 resolution, 8 frames
- **Pro**: Max 256x256 resolution, 32 frames, all features
- **Enterprise**: Unlimited resolution and frames

## License

MIT
