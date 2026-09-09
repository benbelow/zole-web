import { describe, expect, it } from 'vitest';
import type { Card, Suit } from '../../engine/index.ts';
import { SUIT_GLYPH, cardLabel, isRedSuit } from './cardText.ts';

describe('cardLabel', () => {
  it('renders a red-suit card', () => {
    const card: Card = { rank: 'A', suit: 'hearts' };
    expect(cardLabel(card)).toBe('A♥');
  });

  it('renders a black-suit card', () => {
    const card: Card = { rank: 'K', suit: 'spades' };
    expect(cardLabel(card)).toBe('K♠');
  });

  it('renders a two-character rank', () => {
    const card: Card = { rank: '10', suit: 'diamonds' };
    expect(cardLabel(card)).toBe('10♦');
  });
});

describe('isRedSuit', () => {
  it('is true for hearts and diamonds', () => {
    expect(isRedSuit('hearts')).toBe(true);
    expect(isRedSuit('diamonds')).toBe(true);
  });

  it('is false for clubs and spades', () => {
    expect(isRedSuit('clubs')).toBe(false);
    expect(isRedSuit('spades')).toBe(false);
  });
});

describe('SUIT_GLYPH', () => {
  it('maps all four suits', () => {
    const suits: Suit[] = ['clubs', 'spades', 'hearts', 'diamonds'];
    for (const suit of suits) {
      expect(SUIT_GLYPH[suit]).toBeTruthy();
      expect(typeof SUIT_GLYPH[suit]).toBe('string');
    }
    expect(SUIT_GLYPH.clubs).toBe('♣');
    expect(SUIT_GLYPH.spades).toBe('♠');
    expect(SUIT_GLYPH.hearts).toBe('♥');
    expect(SUIT_GLYPH.diamonds).toBe('♦');
  });
});
