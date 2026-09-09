import { describe, it, expect } from 'vitest';
import { scoreRound } from './scoring.ts';
import type { Card } from './cards.ts';
import type { PlayerId, GameType, PlayingState, PlayerState } from './state.ts';

// A=11, 10=10, K=4, Q=3, J=2, 9/8/7=0.
const ACE: Card = { suit: 'clubs', rank: 'A' };
const TEN: Card = { suit: 'clubs', rank: '10' };
const KING: Card = { suit: 'clubs', rank: 'K' };

/** Repeat a card `n` times (card identity does not matter for scoring — only points do). */
function cards(card: Card, n: number): Card[] {
  return Array.from({ length: n }, () => card);
}

interface PlayerSpec {
  readonly captured?: readonly Card[];
  readonly tricksWon?: number;
}

interface StateSpec {
  readonly gameType: GameType;
  readonly soloist: PlayerId | null;
  readonly players: readonly [PlayerSpec, PlayerSpec, PlayerSpec];
  readonly soloistDiscard?: readonly Card[];
  readonly pairStock?: readonly Card[];
  readonly zoleTreeBranches?: number;
}

function makeState(spec: StateSpec): PlayingState {
  const player = (p: PlayerSpec): PlayerState => ({
    hand: [],
    captured: p.captured ?? [],
    tricksWon: p.tricksWon ?? 0,
    gamePoints: 0,
  });
  return {
    phase: 'playing',
    gameType: spec.gameType,
    soloist: spec.soloist,
    players: [player(spec.players[0]), player(spec.players[1]), player(spec.players[2])],
    dealer: 0,
    current: 0,
    trickLeader: 0,
    trick: [],
    soloistDiscard: spec.soloistDiscard ?? [],
    pairStock: spec.pairStock ?? [],
    zoleTreeBranches: spec.zoleTreeBranches ?? 0,
    roundNumber: 0,
  };
}

function sum(deltas: readonly number[]): number {
  return deltas.reduce((a, b) => a + b, 0);
}

describe('scoreRound — ordinary', () => {
  it('soloist win with bigScore 75 → +2 / -1 / -1 (toScore 1)', () => {
    // 5 aces (55) + 2 tens (20) = 75, split across captured + discard.
    const state = makeState({
      gameType: 'ordinary',
      soloist: 0,
      players: [{ captured: [...cards(ACE, 5)] }, {}, {}],
      soloistDiscard: cards(TEN, 2),
    });
    const result = scoreRound(state);
    expect(result.bigScore).toBe(75);
    expect(result.deltas).toEqual([2, -1, -1]);
    expect(sum(result.deltas)).toBe(0);
    expect(result.treeBranchesAfter).toBe(0);
  });

  it('heavy loss bigScore 20 → soloist -6, opponents +3 each', () => {
    const state = makeState({
      gameType: 'ordinary',
      soloist: 0,
      players: [{ captured: cards(TEN, 2) }, {}, {}], // 20
      soloistDiscard: [],
    });
    const result = scoreRound(state);
    expect(result.bigScore).toBe(20);
    expect(result.deltas).toEqual([-6, 3, 3]);
    expect(sum(result.deltas)).toBe(0);
    expect(result.treeBranchesAfter).toBe(0);
  });

  it('60–60 tie (bigScore 60) → deltas all 0, tree branch added', () => {
    const state = makeState({
      gameType: 'ordinary',
      soloist: 1,
      players: [{}, { captured: cards(TEN, 6) }, {}], // 60
      zoleTreeBranches: 2,
    });
    const result = scoreRound(state);
    expect(result.bigScore).toBe(60);
    expect(result.deltas).toEqual([0, 0, 0]);
    expect(result.treeBranchesBefore).toBe(2);
    expect(result.treeBranchesAfter).toBe(3);
  });

  it('zole-tree payout: band-1 win with 2 branches → +6 / -3 / -3, tree resets to 0', () => {
    const state = makeState({
      gameType: 'ordinary',
      soloist: 2,
      players: [{}, {}, { captured: cards(ACE, 5) }], // 55
      soloistDiscard: cards(ACE, 2), // +22 → 77, band 1
      zoleTreeBranches: 2,
    });
    const result = scoreRound(state);
    expect(result.bigScore).toBe(77); // band 1; toScore 1 + 2 branches = 3
    expect(result.deltas).toEqual([-3, -3, 6]);
    expect(sum(result.deltas)).toBe(0);
    expect(result.treeBranchesBefore).toBe(2);
    expect(result.treeBranchesAfter).toBe(0);
  });
});

describe('scoreRound — zole', () => {
  it('zole win bigScore 70 → per-opponent 4, soloist +8 (pairStock excluded)', () => {
    const state = makeState({
      gameType: 'zole',
      soloist: 0,
      players: [{ captured: cards(TEN, 7) }, {}, {}], // 70
      pairStock: [ACE, KING], // counts for pair, excluded from bigScore
    });
    const result = scoreRound(state);
    expect(result.bigScore).toBe(70); // toScore: band 1 (1) + zole (3) = 4
    expect(result.deltas).toEqual([8, -4, -4]);
    expect(sum(result.deltas)).toBe(0);
    expect(result.treeBranchesAfter).toBe(0);
  });
});

describe('scoreRound — galdiņš', () => {
  it('single loser: tricksWon [5,2,1] → player0 -4, others +2', () => {
    const state = makeState({
      gameType: 'galdins',
      soloist: null,
      players: [{ tricksWon: 5 }, { tricksWon: 2 }, { tricksWon: 1 }],
      zoleTreeBranches: 3,
    });
    const result = scoreRound(state);
    expect(result.bigScore).toBeNull();
    expect(result.soloist).toBeNull();
    expect(result.deltas).toEqual([-4, 2, 2]);
    expect(sum(result.deltas)).toBe(0);
    expect(result.treeBranchesBefore).toBe(3);
    expect(result.treeBranchesAfter).toBe(3); // unchanged
  });

  it('tie for most tricks: [3,3,2] → deltas [0,0,0]', () => {
    const state = makeState({
      gameType: 'galdins',
      soloist: null,
      players: [{ tricksWon: 3 }, { tricksWon: 3 }, { tricksWon: 2 }],
      zoleTreeBranches: 1,
    });
    const result = scoreRound(state);
    expect(result.deltas).toEqual([0, 0, 0]);
    expect(result.treeBranchesAfter).toBe(1);
  });
});
