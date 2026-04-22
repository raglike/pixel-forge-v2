export interface PaletteEntry {
  name: string;
  description: string;
  colors: string[];
  tags: string[];
}

export interface PaletteCategory {
  name: string;
  palettes: Record<string, PaletteEntry>;
}

export const PALETTE_LIBRARY: Record<string, PaletteCategory> = {
  game: {
    name: '游戏主机',
    palettes: {
      'PICO-8': {
        name: 'PICO-8',
        description: 'PICO-8 fantasy console官方调色板',
        colors: ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'],
        tags: ['pico-8', 'fantasy-console', 'colorful'],
      },
      'NES': {
        name: 'NES',
        description: '任天堂娱乐系统调色板',
        colors: ['#000000', '#fcfcfc', '#f8f8f8', '#bcbcbc', '#7c7c7c', '#a4e4fc', '#3cbcfc', '#0078f8', '#0000fc', '#b8b8f8', '#6888fc', '#0058f8', '#0000bc', '#d8b8f8', '#9878f8', '#6844fc', '#4428bc', '#f8b8f8', '#f878f8', '#d800cc', '#940084', '#f8a4c0', '#f85898', '#e40058', '#a80020', '#f0d0b0', '#f87858', '#f83800', '#a81000', '#fce0a8', '#fca044', '#e45c10', '#881400', '#f8d878', '#f8b800', '#ac7c00', '#503000', '#d8f878', '#b8f818', '#00b800', '#007800', '#b8f8b8', '#58d854', '#00a800', '#006800', '#b8f8d8', '#58f898', '#00a844', '#005800', '#00fcfc', '#00e8d8', '#008888', '#004058', '#f8d8f8', '#787878'],
        tags: ['nes', 'nintendo', 'retro', '8-bit'],
      },
      'GameBoy': {
        name: 'GameBoy',
        description: '经典GameBoy绿色调色板',
        colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
        tags: ['gameboy', 'nintendo', 'retro', 'green', '4-color'],
      },
      'GameBoy-Alt': {
        name: 'GameBoy-Alt',
        description: 'GameBoy备选灰绿调色板',
        colors: ['#000000', '#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75', '#a7f070', '#38b764', '#257179', '#29366f', '#3b5dc9', '#41a6f6', '#73eff7', '#f4f4f4', '#94b0c2', '#566c86', '#333c57'],
        tags: ['gameboy', 'nintendo', 'retro', 'alternative'],
      },
      'C64': {
        name: 'Commodore-64',
        description: 'C64调色板',
        colors: ['#000000', '#ffffff', '#880000', '#aaffee', '#cc44cc', '#00cc55', '#0000aa', '#eeee77', '#ef8055', '#a80020', '#50a050', '#707070', '#808080', '#aadeee', '#cc6677', '#888800', '#ababab', '#6c5eb5', '#559999', '#98a977'],
        tags: ['c64', 'commodore', 'retro', 'computer'],
      },
    },
  },
  pixelArt: {
    name: '像素艺术',
    palettes: {
      'DB16': {
        name: 'DB16',
        description: 'Deep-Based 16色调色板',
        colors: ['#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75', '#a7f070', '#38b764', '#257179', '#29366f', '#3b5dc9', '#41a6f6', '#73eff7', '#f4f4f4', '#94b0c2', '#566c86', '#333c57'],
        tags: ['pixel-art', 'modern', 'limited', '16-color'],
      },
      'DB32': {
        name: 'DB32',
        description: 'Deep-Based 32色调色板',
        colors: ['#1a1c2c', '#333c57', '#566c86', '#94b0c2', '#f4f4f4', '#a7f070', '#38b764', '#257179', '#41a6f6', '#3b5dc9', '#29366f', '#73eff7', '#b13e53', '#5d275d', '#ef7d57', '#ffcd75', '#cc44cc', '#a80020', '#f0f0f0', '#d77600', '#dec02c', '#aadeee', '#60d270', '#aaffee', '#d80040', '#f8f8f8', '#880000', '#008800', '#000088', '#880088', '#008888', '#888800', '#808080', '#000000'],
        tags: ['pixel-art', 'modern', 'limited', '32-color'],
      },
      'RPG-Packer': {
        name: 'RPG-Packer',
        description: 'RPG游戏调色板',
        colors: ['#000000', '#fcfcfc', '#f8f8f8', '#bcbcbc', '#7c7c7c', '#a4e4fc', '#3cbcfc', '#0078f8', '#0000fc', '#b8b8f8', '#6888fc', '#0058f8', '#0000bc', '#d8b8f8', '#9878f8', '#6844fc', '#4428bc', '#f8b8f8', '#f878f8', '#d800cc', '#940084', '#f8a4c0', '#f85898', '#e40058', '#a80020', '#f0d0b0', '#f87858', '#f83800', '#a81000', '#fce0a8', '#fca044', '#e45c10', '#881400', '#f8d878', '#f8b800', '#ac7c00', '#503000', '#d8f878', '#b8f818', '#00b800', '#007800', '#b8f8b8', '#58d854', '#00a800', '#006800', '#b8f8d8', '#58f898', '#00a844', '#005800', '#00fcfc', '#00e8d8', '#008888', '#004058', '#f8d8f8', '#787878'],
        tags: ['rpg', 'pixel-art', 'game', 'colorful'],
      },
      'Endesga-32': {
        name: 'Endesga-32',
        description: 'Endesga 32色调色板',
        colors: ['#be4a2f', '#d77643', '#ead4aa', '#e4a672', '#b86f50', '#733e39', '#3e2731', '#a22633', '#e43b44', '#f77622', '#feae34', '#fee761', '#63c74d', '#3e8948', '#265c42', '#193c3e', '#124e89', '#0099db', '#2ce8f5', '#ffffff', '#c0cbdc', '#8b9bb4', '#5a6988', '#3a4466', '#262b44', '#559', '#885880', '#c140a5', '#e8e8e8', '#6f6f6f', '#3b3b3b', '#1c1c1c'],
        tags: ['endesga', 'limited', '32-color', 'modern'],
      },
    },
  },
  retro: {
    name: '复古',
    palettes: {
      'CGA-4': {
        name: 'CGA-4',
        description: 'CGA 4色调色板（黑白）',
        colors: ['#000000', '#ffffff', '#00ffff', '#ffff00'],
        tags: ['cga', 'retro', '4-color', 'classic'],
      },
      'CGA-16': {
        name: 'CGA-16',
        description: 'CGA 16色调色板',
        colors: ['#000000', '#0000aa', '#00aa00', '#00aaaa', '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa', '#555555', '#5555ff', '#55ff55', '#55ffff', '#ff5555', '#ff55ff', '#ffff55', '#ffffff'],
        tags: ['cga', 'retro', '16-color', 'classic'],
      },
      'EGA': {
        name: 'EGA',
        description: 'EGA 64色调色板',
        colors: ['#000000', '#0000aa', '#00aa00', '#00aaaa', '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa', '#555555', '#5555ff', '#55ff55', '#55ffff', '#ff5555', '#ff55ff', '#ffff55', '#ffffff', '#000055', '#005500', '#005555', '#550000', '#550055', '#555500', '#5555aa', '#55aa55', '#55aaaa', '#aa5555', '#aa55aa', '#aa5555', '#aa55ff', '#55aa00', '#55aa55', '#55ff00', '#55ffaa', '#ff5500', '#ff55ff', '#ffff00', '#ffffffaa'],
        tags: ['ega', 'retro', '64-color', 'classic'],
      },
      'ZX-Spectrum': {
        name: 'ZX-Spectrum',
        description: 'ZX Spectrum调色板',
        colors: ['#000000', '#0000d7', '#d70000', '#d700d7', '#00d700', '#00d7d7', '#d7d700', '#d7d7d7', '#000000', '#0000ff', '#ff0000', '#ff00ff', '#00ff00', '#00ffff', '#ffff00', '#ffffff'],
        tags: ['zx-spectrum', 'retro', 'sinclair', '8-color'],
      },
    },
  },
  modern: {
    name: '现代',
    palettes: {
      'Bubblegum': {
        name: 'Bubblegum',
        description: '马卡龙粉彩色调',
        colors: ['#ff9eb5', '#ffb08f', '#ffe5a6', '#b8f2be', '#87d5b5', '#72cfe8', '#85b7f2', '#c9a5e8', '#f0c5e8', '#f2c5c5', '#e8d5a5', '#c5e8c5', '#a5d5e8', '#c5c5e8', '#e8c5e8', '#e8c5d5'],
        tags: ['modern', 'pastel', 'cute', 'soft'],
      },
      'Sunset': {
        name: 'Sunset',
        description: '日落渐变调色板',
        colors: ['#1a1c2c', '#b13e53', '#ef7d57', '#ffcd75', '#a7f070', '#38b764', '#257179', '#73eff7', '#3b5dc9', '#29366f', '#5d275d', '#f77622', '#feae34', '#ffffff', '#94b0c2', '#566c86'],
        tags: ['sunset', 'warm', 'gradient', 'nature'],
      },
      'Cyberpunk': {
        name: 'Cyberpunk',
        description: '赛博朋克调色板',
        colors: ['#0d0221', '#0f0326', '#1a0533', '#2d0a4e', '#3c096c', '#5c1886', '#7b2cbf', '#9d33e5', '#c054ff', '#e066ff', '#ff66ff', '#ff66b2', '#ff668c', '#ff6666', '#ff8645', '#ffaa22'],
        tags: ['cyberpunk', 'neon', 'futuristic', 'dark'],
      },
      'Nordic': {
        name: 'Nordic',
        description: '北欧冷淡风调色板',
        colors: ['#2e3440', '#3b4252', '#434c5e', '#4c566a', '#d8dee9', '#e5e9f0', '#eceff4', '#8fbcbb', '#88c0d0', '#81a1c1', '#5e81ac', '#bf616a', '#d08770', '#ebcb8b', '#a3be8c', '#b48ead'],
        tags: ['nordic', 'nord', 'minimalist', 'cold'],
      },
      'Dracula': {
        name: 'Dracula',
        description: 'Dracula主题调色板',
        colors: ['#282a36', '#44475a', '#6272a4', '#8be9fd', '#50fa7b', '#f1fa8c', '#ffb86c', '#ff79c6', '#bd93f9', '#ff5555', '#f8f8f2', '#6272a4', '#44475a', '#50fa7b', '#ffb86c', '#ff79c6'],
        tags: ['dracula', 'code-theme', 'purple', 'dark'],
      },
    },
  },
  character: {
    name: '角色',
    palettes: {
      'Skin-Tones': {
        name: '肤色',
        description: '多样化肤色调色板',
        colors: ['#ffe5d9', '#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#6b4423', '#4a3218', '#ffbf9f', '#ff9c85', '#e08a71', '#d4857a', '#c27a6a', '#a85c4c', '#8b4536', '#6f3226'],
        tags: ['skin', 'flesh', 'character', 'diversity'],
      },
      'Hair-Colors': {
        name: '发色',
        description: '角色发色调色板',
        colors: ['#090806', '#2c222b', '#3d3535', '#574444', '#716353', '#8c7b63', '#a99b7c', '#c9bc9c', '#f5f0e0', '#b81818', '#8c1010', '#5c0e0e', '#c8a86c', '#9a7b4f', '#714a29', '#3c210f', '#e3b64c', '#b8860b', '#8b6508', '#5c4403', '#ff6b6b', '#ee5a5a', '#cc2a2a', '#991f1f', '#4ecdc4', '#26a69a', '#00897b', '#00695c'],
        tags: ['hair', 'character', 'colorful'],
      },
      'Eye-Colors': {
        name: '瞳色',
        description: '角色眼睛颜色调色板',
        colors: ['#0a0a0a', '#3d2314', '#6b4423', '#8b5a2b', '#a67c52', '#c4956a', '#e8c39e', '#1e3a5f', '#2e5090', '#4174b8', '#5c8fd9', '#89b4f5', '#c5daff', '#2d4a3e', '#3d6652', '#4d7a5f', '#5f906f', '#7fb38a', '#a8d5b5', '#6b3a5c', '#8b4a6e', '#a85c80', '#c47a9a', '#dda0bc', '#f0c5e0'],
        tags: ['eye', 'character', 'iris'],
      },
    },
  },
  scene: {
    name: '场景',
    palettes: {
      'Forest-8': {
        name: '森林-8',
        description: '8色森林调色板',
        colors: ['#1a3b2e', '#2d5a3f', '#3d7a4f', '#5da05f', '#7dc07f', '#a0e0a0', '#c0f0c0', '#e0ffe0'],
        tags: ['forest', 'nature', 'green', 'landscape'],
      },
      'Ocean-8': {
        name: '海洋-8',
        description: '8色海洋调色板',
        colors: ['#0a1628', '#1a3550', '#2a5070', '#3a7090', '#5a95b0', '#7ab0c5', '#a0c8d5', '#d0e5eb'],
        tags: ['ocean', 'sea', 'water', 'blue'],
      },
      'Desert-8': {
        name: '沙漠-8',
        description: '8色沙漠调色板',
        colors: ['#3d2817', '#5c3d2e', '#7a5540', '#9a7055', '#ba8f6e', '#d4af8a', '#ecdcc5', '#f8f0e5'],
        tags: ['desert', 'sand', 'warm', 'landscape'],
      },
      'Sunset-Nature': {
        name: '日落自然',
        description: '自然日落调色板',
        colors: ['#1a0a2e', '#4a1a4e', '#8b2a6e', '#d43a7e', '#f46a8a', '#f8a06e', '#f8d06e', '#f8f06e', '#a8e86e', '#68d8a8', '#38b8c8', '#2868d8', '#1a38a8', '#0a1868', '#000038'],
        tags: ['sunset', 'nature', 'warm', 'sky'],
      },
    },
  },
};

// Simple built-in palettes for quick access
export const BUILTIN_PALETTES: Record<string, string[]> = {
  'PICO-8': ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'],
  'NES': ['#000000', '#fcfcfc', '#f8f8f8', '#bcbcbc', '#7c7c7c', '#a4e4fc', '#3cbcfc', '#0078f8', '#0000fc', '#b8b8f8', '#6888fc', '#0058f8', '#0000bc', '#d8b8f8', '#9878f8', '#6844fc', '#4428bc', '#f8b8f8', '#f878f8', '#d800cc', '#940084', '#f8a4c0', '#f85898', '#e40058', '#a80020', '#f0d0b0', '#f87858', '#f83800', '#a81000', '#fce0a8', '#fca044', '#e45c10', '#881400', '#f8d878', '#f8b800', '#ac7c00', '#503000', '#d8f878', '#b8f818', '#00b800', '#007800', '#b8f8b8', '#58d854', '#00a800', '#006800', '#b8f8d8', '#58f898', '#00a844', '#005800', '#00fcfc', '#00e8d8', '#008888', '#004058', '#f8d8f8', '#787878'],
  'GameBoy': ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  '灰度': Array.from({ length: 16 }, (_, i) => {
    const v = Math.round(i * 17);
    return '#' + v.toString(16).padStart(2, '0').repeat(3);
  }),
};

export function getAllPalettes() {
  const palettes = [];
  for (const categoryKey of Object.keys(PALETTE_LIBRARY)) {
    const category = PALETTE_LIBRARY[categoryKey];
    for (const paletteKey of Object.keys(category.palettes)) {
      const palette = category.palettes[paletteKey];
      palettes.push({
        id: paletteKey,
        category: categoryKey,
        categoryName: category.name,
        ...palette,
      });
    }
  }
  return palettes;
}

export function searchPalettes(query: string) {
  const q = query.toLowerCase();
  return getAllPalettes().filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
  );
}

export function getPaletteById(id: string) {
  for (const categoryKey of Object.keys(PALETTE_LIBRARY)) {
    if (PALETTE_LIBRARY[categoryKey].palettes[id]) {
      return {
        id,
        category: categoryKey,
        categoryName: PALETTE_LIBRARY[categoryKey].name,
        ...PALETTE_LIBRARY[categoryKey].palettes[id],
      };
    }
  }
  return null;
}

export function getPalettesByCategory(category: string) {
  if (PALETTE_LIBRARY[category]) {
    const cat = PALETTE_LIBRARY[category];
    return Object.keys(cat.palettes).map(key => ({
      id: key,
      category,
      categoryName: cat.name,
      ...cat.palettes[key],
    }));
  }
  return [];
}

export function getCategories() {
  return Object.keys(PALETTE_LIBRARY).map(key => ({
    id: key,
    name: PALETTE_LIBRARY[key].name,
    count: Object.keys(PALETTE_LIBRARY[key].palettes).length,
  }));
}
