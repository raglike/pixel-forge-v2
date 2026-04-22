import { useState, useCallback, useMemo } from 'react';
import { hexPaletteToRgb } from '@/utils/pixelate';
import { BUILTIN_PALETTES, getAllPalettes, searchPalettes, getPaletteById } from '@/data/palettes';

interface UsePaletteReturn {
  currentPaletteName: string;
  setCurrentPaletteName: (name: string) => void;
  currentPaletteRgb: [number, number, number][];
  allPalettes: ReturnType<typeof getAllPalettes>;
  searchPalettes: (query: string) => ReturnType<typeof searchPalettes>;
  getPaletteById: (id: string) => ReturnType<typeof getPaletteById>;
  customPalettes: Record<string, string[]>;
  addCustomPalette: (name: string, colors: string[]) => void;
  removeCustomPalette: (name: string) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  eyedropperActive: boolean;
  setEyedropperActive: (active: boolean) => void;
}

export function usePalette(
  initialPalette: string = 'PICO-8',
  initialCustomPalettes: Record<string, string[]> = {}
): UsePaletteReturn {
  const [currentPaletteName, setCurrentPaletteName] = useState(initialPalette);
  const [customPalettes, setCustomPalettes] = useState<Record<string, string[]>>(initialCustomPalettes);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [eyedropperActive, setEyedropperActive] = useState(false);

  const currentPaletteRgb = useMemo((): [number, number, number][] => {
    const allPalettes = { ...BUILTIN_PALETTES, ...customPalettes };
    const hexPalette = allPalettes[currentPaletteName] || allPalettes['PICO-8'] || [];
    return hexPaletteToRgb(hexPalette);
  }, [currentPaletteName, customPalettes]);

  const allPalettes = useMemo(() => getAllPalettes(), []);

  const addCustomPalette = useCallback((name: string, colors: string[]) => {
    setCustomPalettes((prev) => ({
      ...prev,
      [name]: colors,
    }));
  }, []);

  const removeCustomPalette = useCallback((name: string) => {
    setCustomPalettes((prev) => {
      const newPalettes = { ...prev };
      delete newPalettes[name];
      return newPalettes;
    });
  }, []);

  return {
    currentPaletteName,
    setCurrentPaletteName,
    currentPaletteRgb,
    allPalettes,
    searchPalettes,
    getPaletteById,
    customPalettes,
    addCustomPalette,
    removeCustomPalette,
    selectedColor,
    setSelectedColor,
    eyedropperActive,
    setEyedropperActive,
  };
}

export function usePaletteEditor() {
  const [editingPaletteName, setEditingPaletteName] = useState('');
  const [editingColors, setEditingColors] = useState<string[]>([]);

  const addColor = useCallback((color: string) => {
    setEditingColors((prev) => [...prev, color]);
  }, []);

  const removeColor = useCallback((index: number) => {
    setEditingColors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateColor = useCallback((index: number, color: string) => {
    setEditingColors((prev) => prev.map((c, i) => (i === index ? color : c)));
  }, []);

  const clearColors = useCallback(() => {
    setEditingColors([]);
  }, []);

  return {
    editingPaletteName,
    setEditingPaletteName,
    editingColors,
    addColor,
    removeColor,
    updateColor,
    clearColors,
  };
}
