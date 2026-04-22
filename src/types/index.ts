export interface VersionConfig {
  maxResolution: number;
  maxFrames: number;
  customPalette: boolean;
  onionSkin: boolean;
  animationPresets: boolean;
  asepriteExport: boolean;
  gifImport: boolean;
  threePreview: boolean;
  aiFeatures: boolean;
}

export interface Frame {
  id: string;
  imgEl: HTMLImageElement;
  name: string;
  duration: number;
  group?: string;
}

export interface Palette {
  id: string;
  name: string;
  description?: string;
  colors: string[];
  tags?: string[];
  category?: string;
  categoryName?: string;
}

export interface AnimationTemplate {
  id: string;
  category: string;
  categoryName: string;
  categoryIcon: string;
  name: string;
  description: string;
  frames: number;
  loop: boolean;
  duration: number;
  suggestedRes: number;
  loopFrame: number | null;
  events: AnimationEvent[];
}

export interface AnimationEvent {
  frame: number;
  type: 'sound' | 'effect' | 'shake' | 'flash' | 'fade' | 'state' | 'glow';
  value: string;
}

export interface StateMachineTransition {
  from: string;
  to: string;
  event: string;
  condition: string | null;
}

export interface StateMachine {
  initial: string;
  transitions: StateMachineTransition[];
}

export interface AnimGroup {
  id: string;
  name: string;
  nameCn: string;
  color: string;
  icon: string;
  frameIds: string[];
}

export interface ProjectMeta {
  name: string;
  author: string;
  description: string;
}

export interface Slot {
  id: string;
  name: string;
  frames: SlotFrame[];
  palette: string[];
  resolution: number;
}

export interface SlotFrame {
  id: string;
  name: string;
  group: string;
  imageDataUrl: string | null;
  duration: number;
}

export interface BatchItem {
  id: number;
  file: File;
  name: string;
  size: string;
  width: number;
  height: number;
  preview: string | null;
  status: 'pending' | 'processing' | 'done';
  resultUrl: string | null;
}

export interface PixelForgePlugin {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  hooks?: {
    onInit?: (app: unknown) => void;
    onMenu?: () => MenuItem[];
    onExport?: (frames: Frame[], format: string) => unknown;
  };
}

export interface MenuItem {
  label: string;
  action: () => void;
}

export interface ExportData {
  frames: Frame[];
  format: string;
  resolution: number;
  palette: string[];
}

export type ScalingAlgorithm = 'bilinear' | 'xbr-2x' | 'xbr-3x' | 'xbr-4x';

export type PaletteMode = 'auto' | 'fixed';

export type TransparencyFixMode = 'none' | 'fill' | 'delete';

export type LoopMode = 'none' | 'horizontal' | 'vertical' | 'both';

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
