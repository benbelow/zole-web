import { describe, expect, it } from 'vitest';
import { createRng, shuffle } from './rng.ts';

describe('createRng', () => {
  it('produces identical sequences for identical seeds', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 20 }, () => a.nextInt(1000));
    const seqB = Array.from({ length: 20 }, () => b.nextInt(1000));
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 20 }, () => a.nextInt(1000));
    const seqB = Array.from({ length: 20 }, () => b.nextInt(1000));
    expect(seqA).not.toEqual(seqB);
  });

  it('bounds nextInt to [0, maxExclusive)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 500; i++) {
      const n = rng.nextInt(6);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(6);
    }
  });
});

describe('shuffle', () => {
  it('is a deterministic permutation that does not mutate its input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const s1 = shuffle(input, createRng(99));
    const s2 = shuffle(input, createRng(99));
    expect(s1).toEqual(s2);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]); // unchanged
    expect([...s1].sort((a, b) => a - b)).toEqual(input); // same multiset
  });
});
