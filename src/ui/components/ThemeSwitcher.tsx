import { THEMES, type ThemeId } from '../theme/useTheme.ts';

export interface ThemeSwitcherProps {
  theme: ThemeId;
  onChange: (theme: ThemeId) => void;
}

export function ThemeSwitcher({ theme, onChange }: ThemeSwitcherProps) {
  return (
    <div className="theme-switcher" role="group" aria-label="Theme">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          className={t.id === theme ? 'theme-chip theme-chip--active' : 'theme-chip'}
          aria-pressed={t.id === theme}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
