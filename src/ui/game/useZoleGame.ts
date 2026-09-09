/**
 * The React hook that owns the authoritative `GameState` + the seeded `Rng`, exposes the human's
 * view-model, and auto-advances AI turns (design D2). All impurity (timers, seed generation, React
 * state) lives here in the `ui` layer; the engine and AI stay pure.
 *
 * The `{ state, rng }` pair is held together in one `useState`: the RNG must survive re-renders and
 * never be recreated on render, but React forbids writing a ref during render — bundling it into
 * state (with a lazy, seeded initializer) is safe because the deal is deterministic, so StrictMode's
 * double-invoke of the initializer produces the same game either way.
 *
 * When a play completes a trick, the engine resolves it atomically (the winner collects the cards
 * and the trick clears). To let the human actually see the completed trick, we capture those three
 * cards as `pendingTrick` and pause — auto-advance and human play are gated until `continueAfterTrick`.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyMove,
  cardId,
  carryOverFromEnd,
  createRng,
  dealRound,
  isLegal,
  trickWinner,
  type BidAction,
  type Card,
  type GameState,
  type Move,
  type Phase,
  type PlayerId,
  type PlayerView,
  type Rng,
  type TrickCard,
} from '../../engine/index.ts';
import {
  AI_DELAY_MS,
  aiMove,
  DEFAULT_STRATEGY,
  humanView,
  isAiTurn,
  isHumanTurn as driverIsHumanTurn,
  newGame,
  nextRound,
  strategyById,
  type StrategyId,
} from './driver.ts';
import { clearScores, loadCarryOver, saveCarryOver } from './scorePersistence.ts';

/** A just-completed trick, held so the human can see it before the next one begins. */
export interface PendingTrick {
  readonly cards: readonly TrickCard[];
  readonly winner: PlayerId;
}

export interface ZoleGameVM {
  readonly view: PlayerView;
  readonly phase: Phase;
  readonly isHumanTurn: boolean;
  readonly isRoundOver: boolean;
  readonly seed: number;
  readonly selectedDiscards: readonly Card[];
  readonly pendingTrick: PendingTrick | null;
  readonly bid: (action: BidAction) => void;
  readonly toggleDiscardSelection: (card: Card) => void;
  readonly confirmDiscard: () => void;
  readonly playCard: (card: Card) => void;
  readonly continueAfterTrick: () => void;
  readonly dealNextRound: () => void;
  readonly newGame: (seed?: number) => void;
  readonly aiStrategies: Readonly<Record<PlayerId, StrategyId>>;
  readonly setAiStrategy: (seat: PlayerId, id: StrategyId) => void;
}

interface Game {
  readonly state: GameState;
  readonly rng: Rng;
}

/** A one-time, UI-layer-only random seed. The engine/AI never see `Math.random`. */
function makeSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

/**
 * Deal the initial round of a session, restoring the persisted cumulative scoreboard when present
 * so it survives a page refresh. Mirrors `driver.newGame` (createRng + dealRound), but deals from
 * the stored carry-over instead of `initialCarryOver()` when one exists. `driver.newGame` already
 * deals from the zero carry-over, so it is reused for the fresh-start path.
 */
function initialGame(seed: number): Game {
  const restored = loadCarryOver();
  if (restored === null) return newGame(seed);
  const rng = createRng(seed);
  return { state: dealRound(restored, rng), rng };
}

/** If `move` completes the current trick, return the three cards + winner to hold on screen. */
function completedTrick(prev: GameState, move: Move): PendingTrick | null {
  if (prev.phase !== 'playing' || move.type !== 'play' || prev.trick.length !== 2) return null;
  const cards: TrickCard[] = [...prev.trick, { by: prev.current, card: move.card }];
  return { cards, winner: trickWinner(cards) };
}

export function useZoleGame(initialSeed?: number): ZoleGameVM {
  const [seed, setSeed] = useState<number>(() => initialSeed ?? makeSeed());
  const [game, setGame] = useState<Game>(() => initialGame(seed));
  const [selectedDiscards, setSelectedDiscards] = useState<readonly Card[]>([]);
  const [pendingTrick, setPendingTrick] = useState<PendingTrick | null>(null);
  const [aiStrategies, setAiStrategies] = useState<Record<PlayerId, StrategyId>>(() => ({
    0: DEFAULT_STRATEGY,
    1: DEFAULT_STRATEGY,
    2: DEFAULT_STRATEGY,
  }));
  const state = game.state;

  // Auto-advance AI turns one step per effect run, unless a completed trick is waiting to be
  // acknowledged. Applying a step re-runs this effect and chains the next AI seat until it is the
  // human's turn, a trick pauses, or the round ends.
  useEffect(() => {
    if (pendingTrick || !isAiTurn(state)) return;
    let cancelled = false;
    const id = setTimeout(() => {
      if (cancelled || !isAiTurn(state)) return;
      const move = aiMove(state, game.rng, strategyById(aiStrategies[state.current]));
      const pending = completedTrick(state, move);
      setGame({ state: applyMove(state, move), rng: game.rng });
      if (pending) setPendingTrick(pending);
    }, AI_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [state, game.rng, pendingTrick, aiStrategies]);

  // Persist the cumulative scoreboard whenever a round completes, so a refresh mid-game restores a
  // scoreboard that reflects every finished round. We store `carryOverFromEnd(state)` — the exact
  // carry-over the NEXT round would be dealt from — so restoring on load resumes the running total.
  useEffect(() => {
    if (state.phase === 'roundEnd') {
      saveCarryOver(carryOverFromEnd(state));
    }
  }, [state]);

  const bid = useCallback((action: BidAction) => {
    setGame((g) => {
      const move: Move = { type: 'bid', action };
      return driverIsHumanTurn(g.state) && isLegal(g.state, move)
        ? { state: applyMove(g.state, move), rng: g.rng }
        : g;
    });
  }, []);

  const playCard = useCallback(
    (card: Card) => {
      if (pendingTrick) return;
      const move: Move = { type: 'play', card };
      if (!driverIsHumanTurn(state) || !isLegal(state, move)) return;
      const pending = completedTrick(state, move);
      setGame({ state: applyMove(state, move), rng: game.rng });
      if (pending) setPendingTrick(pending);
    },
    [state, game.rng, pendingTrick],
  );

  const toggleDiscardSelection = useCallback((card: Card) => {
    setSelectedDiscards((sel) => {
      const id = cardId(card);
      if (sel.some((c) => cardId(c) === id)) return sel.filter((c) => cardId(c) !== id);
      if (sel.length >= 2) return sel; // at most two
      return [...sel, card];
    });
  }, []);

  const confirmDiscard = useCallback(() => {
    if (selectedDiscards.length !== 2) return;
    const cards: [Card, Card] = [selectedDiscards[0]!, selectedDiscards[1]!];
    setGame((g) => {
      const move: Move = { type: 'discard', cards };
      return driverIsHumanTurn(g.state) && isLegal(g.state, move)
        ? { state: applyMove(g.state, move), rng: g.rng }
        : g;
    });
    setSelectedDiscards([]);
  }, [selectedDiscards]);

  const continueAfterTrick = useCallback(() => setPendingTrick(null), []);

  const dealNextRound = useCallback(() => {
    setPendingTrick(null);
    setGame((g) =>
      g.state.phase === 'roundEnd' ? { state: nextRound(g.state, g.rng), rng: g.rng } : g,
    );
  }, []);

  const setAiStrategy = useCallback((seat: PlayerId, id: StrategyId) => {
    setAiStrategies((prev) => ({ ...prev, [seat]: id }));
  }, []);

  const startNewGame = useCallback((nextSeed?: number) => {
    const chosen = nextSeed ?? makeSeed();
    // A new game resets the scoreboard to zero, so drop the persisted carry-over first; deal from
    // the zero carry-over (driver.newGame's behavior).
    clearScores();
    setSeed(chosen);
    setSelectedDiscards([]);
    setPendingTrick(null);
    setGame(newGame(chosen));
  }, []);

  const view = useMemo(() => humanView(state), [state]);

  return {
    view,
    phase: state.phase,
    isHumanTurn: driverIsHumanTurn(state),
    isRoundOver: state.phase === 'roundEnd',
    seed,
    selectedDiscards,
    pendingTrick,
    bid,
    toggleDiscardSelection,
    confirmDiscard,
    playCard,
    continueAfterTrick,
    dealNextRound,
    newGame: startNewGame,
    aiStrategies,
    setAiStrategy,
  };
}
