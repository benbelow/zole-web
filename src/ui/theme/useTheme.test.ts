import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTheme } from './useTheme.ts';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to the neon theme and applies it to the document root', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('neon');
    expect(document.documentElement.getAttribute('data-theme')).toBe('neon');
  });

  it('changes the theme and persists it to localStorage', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('vibrant'));
    expect(result.current.theme).toBe('vibrant');
    expect(document.documentElement.getAttribute('data-theme')).toBe('vibrant');
    expect(localStorage.getItem('zole-theme')).toBe('vibrant');
  });

  it('restores a previously stored theme', () => {
    localStorage.setItem('zole-theme', 'aerospace');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('aerospace');
  });
});
