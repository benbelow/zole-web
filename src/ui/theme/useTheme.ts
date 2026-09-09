/**
 * Theme selection (UI-only). Themes are pure CSS: each sets a `data-theme` on the document root and
 * the stylesheet swaps custom properties. The choice is persisted to localStorage. This never
 * touches the game state — it is a presentation concern living entirely in the `ui` layer.
 */
import { useCallback, useEffect, useState } from 'react';

export const THEMES = [
  { id: 'neon', label: 'Neon Holo' },
  { id: 'aerospace', label: 'Aerospace' },
  { id: 'vibrant', label: 'Vibrant' },
  { id: 'classic', label: 'Classic Felt' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const STORAGE_KEY = 'zole-theme';
const DEFAULT_THEME: ThemeId = 'neon';

function isThemeId(value: string | null): value is ThemeId {
  return value !== null && THEMES.some((t) => t.id === value);
}

function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export interface ThemeControls {
  readonly theme: ThemeId;
  readonly setTheme: (theme: ThemeId) => void;
}

export function useTheme(): ThemeControls {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable — the theme still applies for this session */
    }
  }, [theme]);

  const setTheme = useCallback((next: ThemeId) => setThemeState(next), []);

  return { theme, setTheme };
}
