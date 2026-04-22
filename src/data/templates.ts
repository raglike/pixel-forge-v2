import type { AnimationTemplate, StateMachine } from '@/types';

export interface AnimationCategory {
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  templates: Record<string, Omit<AnimationTemplate, 'id' | 'category' | 'categoryName' | 'categoryIcon'>>;
}

export const ANIMATION_TEMPLATES: Record<string, AnimationCategory> = {
  idle: {
    name: '待机',
    nameEn: 'Idle',
    icon: '💤',
    description: '角色静止时的呼吸/待机动画',
    templates: {
      'idle-2f': {
        name: '待机 (2帧)',
        description: '简单2帧待机循环',
        frames: 2,
        loop: true,
        duration: 500,
        suggestedRes: 32,
        loopFrame: 0,
        events: [],
      },
      'idle-4f': {
        name: '待机 (4帧)',
        description: '细腻4帧待机循环',
        frames: 4,
        loop: true,
        duration: 400,
        suggestedRes: 32,
        loopFrame: 0,
        events: [],
      },
    },
  },
  walk: {
    name: '行走',
    nameEn: 'Walk',
    icon: '🚶',
    description: '角色行走/走路动画',
    templates: {
      'walk-4f': {
        name: '行走 (4帧)',
        description: '经典4帧行走循环',
        frames: 4,
        loop: true,
        duration: 250,
        suggestedRes: 32,
        loopFrame: 0,
        events: [],
      },
      'walk-6f': {
        name: '行走 (6帧)',
        description: '流畅6帧行走循环',
        frames: 6,
        loop: true,
        duration: 200,
        suggestedRes: 32,
        loopFrame: 0,
        events: [],
      },
    },
  },
  run: {
    name: '跑步',
    nameEn: 'Run',
    icon: '🏃',
    description: '角色奔跑/冲刺动画',
    templates: {
      'run-4f': {
        name: '跑步 (4帧)',
        description: '快速4帧跑步循环',
        frames: 4,
        loop: true,
        duration: 150,
        suggestedRes: 32,
        loopFrame: 0,
        events: [],
      },
      'run-6f': {
        name: '跑步 (6帧)',
        description: '标准6帧跑步循环',
        frames: 6,
        loop: true,
        duration: 120,
        suggestedRes: 32,
        loopFrame: 0,
        events: [],
      },
    },
  },
  attack: {
    name: '攻击',
    nameEn: 'Attack',
    icon: '⚔️',
    description: '角色攻击动作动画',
    templates: {
      'attack-3f': {
        name: '攻击 (3帧)',
        description: '快速3帧攻击',
        frames: 3,
        loop: false,
        duration: 150,
        suggestedRes: 48,
        loopFrame: null,
        events: [
          { frame: 2, type: 'sound', value: 'swing' },
          { frame: 2, type: 'effect', value: 'hit' },
        ],
      },
      'attack-5f': {
        name: '攻击 (5帧)',
        description: '完整5帧攻击动作',
        frames: 5,
        loop: false,
        duration: 120,
        suggestedRes: 48,
        loopFrame: null,
        events: [
          { frame: 3, type: 'sound', value: 'swing' },
          { frame: 3, type: 'effect', value: 'slash' },
        ],
      },
    },
  },
  hurt: {
    name: '受伤',
    nameEn: 'Hurt',
    icon: '💥',
    description: '角色受击/受伤动画',
    templates: {
      'hurt-2f': {
        name: '受伤 (2帧)',
        description: '快速2帧受伤',
        frames: 2,
        loop: false,
        duration: 100,
        suggestedRes: 32,
        loopFrame: null,
        events: [{ frame: 0, type: 'shake', value: 'medium' }],
      },
      'hurt-4f': {
        name: '受伤 (4帧)',
        description: '标准4帧受伤动画',
        frames: 4,
        loop: false,
        duration: 100,
        suggestedRes: 32,
        loopFrame: null,
        events: [
          { frame: 0, type: 'shake', value: 'strong' },
          { frame: 0, type: 'flash', value: 'white' },
        ],
      },
    },
  },
  death: {
    name: '死亡',
    nameEn: 'Death',
    icon: '💀',
    description: '角色死亡/倒下动画',
    templates: {
      'death-4f': {
        name: '死亡 (4帧)',
        description: '经典4帧死亡动画',
        frames: 4,
        loop: false,
        duration: 250,
        suggestedRes: 32,
        loopFrame: null,
        events: [
          { frame: 0, type: 'sound', value: 'death' },
          { frame: 0, type: 'shake', value: 'weak' },
          { frame: 3, type: 'fade', value: 'out' },
        ],
      },
      'death-6f': {
        name: '死亡 (6帧)',
        description: '完整6帧死亡动画',
        frames: 6,
        loop: false,
        duration: 200,
        suggestedRes: 32,
        loopFrame: null,
        events: [
          { frame: 0, type: 'sound', value: 'death' },
          { frame: 0, type: 'shake', value: 'medium' },
          { frame: 0, type: 'flash', value: 'red' },
          { frame: 5, type: 'fade', value: 'out' },
        ],
      },
    },
  },
  jump: {
    name: '跳跃',
    nameEn: 'Jump',
    icon: '⬆️',
    description: '角色跳跃/跃起动画',
    templates: {
      'jump-4f': {
        name: '跳跃 (4帧)',
        description: '标准4帧跳跃',
        frames: 4,
        loop: false,
        duration: 150,
        suggestedRes: 32,
        loopFrame: null,
        events: [{ frame: 0, type: 'sound', value: 'jump' }],
      },
      'jump-6f': {
        name: '跳跃 (6帧)',
        description: '流畅6帧跳跃',
        frames: 6,
        loop: false,
        duration: 120,
        suggestedRes: 32,
        loopFrame: null,
        events: [
          { frame: 0, type: 'sound', value: 'jump' },
          { frame: 2, type: 'effect', value: 'dust' },
        ],
      },
    },
  },
  cast: {
    name: '施法',
    nameEn: 'Cast',
    icon: '✨',
    description: '魔法/技能施放动画',
    templates: {
      'cast-4f': {
        name: '施法 (4帧)',
        description: '快速4帧施法',
        frames: 4,
        loop: false,
        duration: 150,
        suggestedRes: 48,
        loopFrame: null,
        events: [
          { frame: 0, type: 'sound', value: 'charge' },
          { frame: 2, type: 'effect', value: 'magic' },
          { frame: 3, type: 'sound', value: 'cast' },
        ],
      },
      'cast-6f': {
        name: '施法 (6帧)',
        description: '完整6帧施法动画',
        frames: 6,
        loop: false,
        duration: 120,
        suggestedRes: 48,
        loopFrame: null,
        events: [
          { frame: 0, type: 'sound', value: 'charge' },
          { frame: 2, type: 'glow', value: 'start' },
          { frame: 4, type: 'effect', value: 'magic' },
          { frame: 5, type: 'sound', value: 'cast' },
        ],
      },
    },
  },
};

export const STATE_MACHINE_PRESETS: Record<string, StateMachine & { name: string; description: string }> = {
  platformer: {
    name: '平台跳跃',
    description: '适合平台跳跃游戏的状态机',
    initial: 'idle',
    transitions: [
      { from: 'idle', to: 'walk', event: 'move', condition: null },
      { from: 'idle', to: 'jump', event: 'jump', condition: null },
      { from: 'walk', to: 'idle', event: 'stop', condition: null },
      { from: 'walk', to: 'run', event: 'sprint', condition: null },
      { from: 'walk', to: 'jump', event: 'jump', condition: null },
      { from: 'run', to: 'walk', event: 'slow', condition: null },
      { from: 'run', to: 'jump', event: 'jump', condition: null },
      { from: 'jump', to: 'idle', event: 'land', condition: null },
      { from: 'jump', to: 'walk', event: 'move', condition: null },
      { from: 'idle', to: 'hurt', event: 'damage', condition: null },
      { from: 'walk', to: 'hurt', event: 'damage', condition: null },
      { from: 'run', to: 'hurt', event: 'damage', condition: null },
      { from: 'hurt', to: 'idle', event: 'recover', condition: null },
      { from: 'hurt', to: 'death', event: 'die', condition: null },
      { from: 'idle', to: 'death', event: 'die', condition: null },
    ],
  },
  rpg: {
    name: 'RPG角色',
    description: '适合RPG游戏的状态机',
    initial: 'idle',
    transitions: [
      { from: 'idle', to: 'walk', event: 'move', condition: null },
      { from: 'idle', to: 'attack', event: 'attack', condition: null },
      { from: 'idle', to: 'cast', event: 'cast', condition: null },
      { from: 'walk', to: 'idle', event: 'stop', condition: null },
      { from: 'walk', to: 'run', event: 'sprint', condition: null },
      { from: 'run', to: 'walk', event: 'slow', condition: null },
      { from: 'attack', to: 'idle', event: 'finish', condition: null },
      { from: 'attack', to: 'attack', event: 'combo', condition: null },
      { from: 'cast', to: 'idle', event: 'finish', condition: null },
      { from: 'idle', to: 'hurt', event: 'damage', condition: null },
      { from: 'walk', to: 'hurt', event: 'damage', condition: null },
      { from: 'attack', to: 'hurt', event: 'interrupted', condition: null },
      { from: 'hurt', to: 'idle', event: 'recover', condition: null },
      { from: 'hurt', to: 'death', event: 'die', condition: null },
    ],
  },
  action: {
    name: '动作游戏',
    description: '适合动作游戏的状态机',
    initial: 'idle',
    transitions: [
      { from: 'idle', to: 'walk', event: 'move', condition: null },
      { from: 'idle', to: 'attack', event: 'attack', condition: null },
      { from: 'idle', to: 'run', event: 'sprint', condition: null },
      { from: 'walk', to: 'idle', event: 'stop', condition: null },
      { from: 'walk', to: 'run', event: 'sprint', condition: null },
      { from: 'walk', to: 'attack', event: 'attack', condition: null },
      { from: 'run', to: 'walk', event: 'slow', condition: null },
      { from: 'run', to: 'attack', event: 'attack', condition: null },
      { from: 'attack', to: 'idle', event: 'finish', condition: null },
      { from: 'attack', to: 'attack', event: 'combo', condition: 'canCombo' },
      { from: 'attack', to: 'hurt', event: 'parried', condition: null },
      { from: 'idle', to: 'hurt', event: 'damage', condition: null },
      { from: 'walk', to: 'hurt', event: 'damage', condition: null },
      { from: 'run', to: 'hurt', event: 'damage', condition: null },
      { from: 'hurt', to: 'idle', event: 'recover', condition: null },
      { from: 'hurt', to: 'death', event: 'die', condition: null },
      { from: 'idle', to: 'death', event: 'die', condition: null },
    ],
  },
};

// Helper functions
export function getAllTemplates(): AnimationTemplate[] {
  const templates: AnimationTemplate[] = [];
  for (const categoryKey of Object.keys(ANIMATION_TEMPLATES)) {
    const category = ANIMATION_TEMPLATES[categoryKey];
    for (const templateKey of Object.keys(category.templates)) {
      const template = category.templates[templateKey];
      templates.push({
        id: templateKey,
        category: categoryKey,
        categoryName: category.name,
        categoryIcon: category.icon,
        ...template,
      });
    }
  }
  return templates;
}

export function getTemplateById(id: string): AnimationTemplate | null {
  for (const categoryKey of Object.keys(ANIMATION_TEMPLATES)) {
    const category = ANIMATION_TEMPLATES[categoryKey];
    if (category.templates[id]) {
      return {
        id,
        category: categoryKey,
        categoryName: category.name,
        categoryIcon: category.icon,
        ...category.templates[id],
      };
    }
  }
  return null;
}

export function getTemplatesByCategory(category: string): AnimationTemplate[] {
  if (ANIMATION_TEMPLATES[category]) {
    const cat = ANIMATION_TEMPLATES[category];
    return Object.keys(cat.templates).map(key => ({
      id: key,
      category,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      ...cat.templates[key],
    }));
  }
  return [];
}

export function getAnimationCategories() {
  return Object.keys(ANIMATION_TEMPLATES).map(key => ({
    id: key,
    name: ANIMATION_TEMPLATES[key].name,
    nameEn: ANIMATION_TEMPLATES[key].nameEn,
    icon: ANIMATION_TEMPLATES[key].icon,
    description: ANIMATION_TEMPLATES[key].description,
    count: Object.keys(ANIMATION_TEMPLATES[key].templates).length,
  }));
}

export function getStateMachinePresets() {
  return Object.keys(STATE_MACHINE_PRESETS).map(key => ({
    id: key,
    ...STATE_MACHINE_PRESETS[key],
  }));
}

export function getStateMachinePresetById(id: string) {
  return STATE_MACHINE_PRESETS[id] || null;
}
