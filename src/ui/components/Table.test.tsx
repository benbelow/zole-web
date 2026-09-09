import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Card, PlayerView } from '../../engine/index.ts';
import type { ZoleGameVM } from '../game/useZoleGame.ts';
import { Table } from './Table.tsx';

const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });

/** Build a VM around a hand-crafted PlayerView; callbacks are stubs. */
function makeVM(view: PlayerView, overrides: Partial<ZoleGameVM> = {}): ZoleGameVM {
  return {
    view,
    phase: view.phase,
    isHumanTurn: view.current === view.me && view.phase !== 'roundEnd',
    isRoundOver: view.phase === 'roundEnd',
    seed: 123,
    selectedDiscards: [],
    pendingTrick: null,
    bid: vi.fn(),
    toggleDiscardSelection: vi.fn(),
    confirmDiscard: vi.fn(),
    playCard: vi.fn(),
    continueAfterTrick: vi.fn(),
    dealNextRound: vi.fn(),
    newGame: vi.fn(),
    aiStrategies: { 0: 'greedy', 1: 'greedy', 2: 'greedy' },
    setAiStrategy: vi.fn(),
    ...overrides,
  };
}

const opponents: PlayerView['opponents'] = [
  { id: 1, handCount: 8, capturedCount: 0, tricksWon: 0, gamePoints: 0, hasPassed: false },
  { id: 2, handCount: 8, capturedCount: 0, tricksWon: 0, gamePoints: 0, hasPassed: false },
];

describe('Table redaction', () => {
  it('renders only the human hand as card faces; opponents are face-down backs', () => {
    const view: PlayerView = {
      me: 0,
      phase: 'playing',
      hand: [c('A', 'spades'), c('K', 'hearts')],
      gamePoints: 0,
      zoleTreeBranches: 0,
      dealer: 2,
      current: 1, // an AI's turn
      gameType: 'ordinary',
      soloist: 1,
      trick: [],
      trickLeader: 1,
      passed: [],
      opponents,
      legalMoves: [],
      result: null,
    };
    const { container } = render(<Table vm={makeVM(view)} />);

    // Exactly the human's two cards render as faces (data-testid="card-…"); no opponent faces.
    expect(container.querySelectorAll('[data-testid^="card-"]')).toHaveLength(2);
    // Opponents render 8 + 8 face-down backs and no real card labels.
    expect(container.querySelectorAll('.card-back')).toHaveLength(16);
  });
});

describe('Table phase controls', () => {
  it('shows the discard tray when the human soloist must put down', () => {
    const view: PlayerView = {
      me: 0,
      phase: 'discarding',
      hand: [c('A', 'spades'), c('K', 'hearts'), c('Q', 'clubs'), c('9', 'diamonds')],
      gamePoints: 0,
      zoleTreeBranches: 0,
      dealer: 2,
      current: 0, // human's turn
      gameType: 'ordinary',
      soloist: 0,
      trick: [],
      trickLeader: null,
      passed: [],
      opponents,
      legalMoves: [],
      result: null,
    };
    render(<Table vm={makeVM(view)} />);
    expect(screen.getByText('Select two cards to discard')).toBeInTheDocument();
  });
});
