import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RoundCarryOver } from '../../engine/index.ts';
import { clearScores, loadCarryOver, saveCarryOver } from './scorePersistence.ts';

const STORAGE_KEY = 'zole-scores';

const sample: RoundCarryOver = {
  gamePoints: [3, -1, -2],
  dealer: 1,
  zoleTreeBranches: 2,
  roundNumber: 5,
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('scorePersistence', () => {
  it('round-trips a carry-over through save then load', () => {
    saveCarryOver(sample);
    const loaded = loadCarryOver();
    expect(loaded).toEqual(sample);
  });

  it('returns null when nothing is stored', () => {
    expect(loadCarryOver()).toBeNull();
  });

  it('returns null for non-JSON / corrupt data', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(loadCarryOver()).toBeNull();
  });

  it('returns null for a malformed shape (wrong gamePoints length)', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ gamePoints: [1, 2], dealer: 0, zoleTreeBranches: 0, roundNumber: 0 }),
    );
    expect(loadCarryOver()).toBeNull();
  });

  it('returns null when gamePoints contains a non-number', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        gamePoints: [1, 'x', 3],
        dealer: 0,
        zoleTreeBranches: 0,
        roundNumber: 0,
      }),
    );
    expect(loadCarryOver()).toBeNull();
  });

  it('returns null for an out-of-range dealer', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ gamePoints: [0, 0, 0], dealer: 3, zoleTreeBranches: 0, roundNumber: 0 }),
    );
    expect(loadCarryOver()).toBeNull();
  });

  it('returns null for missing numeric fields', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ gamePoints: [0, 0, 0], dealer: 0, zoleTreeBranches: 0 }),
    );
    expect(loadCarryOver()).toBeNull();
  });

  it('accepts all three dealer seats', () => {
    for (const dealer of [0, 1, 2] as const) {
      saveCarryOver({ ...sample, dealer });
      expect(loadCarryOver()?.dealer).toBe(dealer);
    }
  });

  it('clearScores removes the persisted entry', () => {
    saveCarryOver(sample);
    expect(loadCarryOver()).not.toBeNull();
    clearScores();
    expect(loadCarryOver()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
