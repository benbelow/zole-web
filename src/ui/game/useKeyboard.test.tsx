import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { BidAction, Card, Move, Phase, PlayerView } from '../../engine/index.ts';
import { useKeyboard } from './useKeyboard.ts';
import type { PendingTrick, ZoleGameVM } from './useZoleGame.ts';

const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });

function makeView(phase: Phase, hand: readonly Card[], legalMoves: readonly Move[]): PlayerView {
  return {
    me: 0,
    phase,
    hand,
    gamePoints: 0,
    zoleTreeBranches: 0,
    dealer: 2,
    current: 0,
    gameType: null,
    soloist: null,
    trick: [],
    trickLeader: null,
    passed: [],
    opponents: [],
    legalMoves,
    result: null,
  };
}

function makeVm(over: Partial<ZoleGameVM> & { view: PlayerView }): ZoleGameVM {
  return {
    phase: over.view.phase,
    isHumanTurn: true,
    isRoundOver: false,
    seed: 1,
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
    ...over,
  };
}

function press(key: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('useKeyboard', () => {
  it('maps bidding hotkeys to legal bids', () => {
    const bids: Move[] = (['pickup', 'zole', 'pass'] as BidAction[]).map((action) => ({
      type: 'bid',
      action,
    }));
    const vm = makeVm({ view: makeView('bidding', [], bids) });
    renderHook(() => useKeyboard(vm));
    press('p');
    expect(vm.bid).toHaveBeenCalledWith('pass');
    press('u');
    expect(vm.bid).toHaveBeenCalledWith('pickup');
  });

  it('plays the Nth card by digit during play', () => {
    const hand = [c('A', 'clubs')];
    const legal: Move[] = [{ type: 'play', card: c('A', 'clubs') }];
    const vm = makeVm({ view: makeView('playing', hand, legal) });
    renderHook(() => useKeyboard(vm));
    press('1');
    expect(vm.playCard).toHaveBeenCalledWith(c('A', 'clubs'));
  });

  it('Enter/Space continues a completed trick', () => {
    const pendingTrick: PendingTrick = { cards: [], winner: 1 };
    const vm = makeVm({ view: makeView('playing', [], []), pendingTrick });
    renderHook(() => useKeyboard(vm));
    press('Enter');
    expect(vm.continueAfterTrick).toHaveBeenCalled();
  });

  it('Enter deals the next round when the round is over', () => {
    const vm = makeVm({ view: makeView('roundEnd', [], []), isRoundOver: true, isHumanTurn: false });
    renderHook(() => useKeyboard(vm));
    press('Enter');
    expect(vm.dealNextRound).toHaveBeenCalled();
  });

  it('N starts a new game any time', () => {
    const vm = makeVm({ view: makeView('bidding', [], []) });
    renderHook(() => useKeyboard(vm));
    press('n');
    expect(vm.newGame).toHaveBeenCalled();
  });

  it('ignores input when it is not the human turn', () => {
    const bids: Move[] = [{ type: 'bid', action: 'pass' }];
    const vm = makeVm({ view: makeView('bidding', [], bids), isHumanTurn: false });
    renderHook(() => useKeyboard(vm));
    press('p');
    expect(vm.bid).not.toHaveBeenCalled();
  });
});
