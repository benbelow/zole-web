/**
 * The React hook that owns the authoritative `GameState` + the seeded `Rng`, exposes the human's
 * view-model, and auto-advances AI turns (design D2). All impurity (timers, seed generation, React
 * state) lives here in the `ui` layer; the engine and AI stay pure.
 *
 * The `{ state, rng }` pair is held together in one `useState`: the RNG must survive re-renders and
 * never be recreated on render, but React forbids writing a ref during render — bundling it into
 * state (with a lazy, seeded initializer) is safe because the deal is deterministic, so StrictMode's
 * double-invoke of the initializer produces the same game either way.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  cardId,
  isLegal,
  type BidAction,
  type Card,
  type GameState,
  type Move,
  type Phase,
  type PlayerView,
  type Rng,
} from '../../engine/index.ts';
import {
  AI_DELAY_MS,
  applyHumanMove,
  humanView,
  isAiTurn,
  isHumanTurn as driverIsHumanTurn,
  newGame,
  nextRound,
  stepAi,
} from './driver.ts';

export interface ZoleGameVM {
  readonly view: PlayerView;
  readonly phase: Phase;
  readonly isHumanTurn: boolean;
  readonly isRoundOver: boolean;
  readonly seed: number;
  readonly selectedDiscards: readonly Card[];
  readonly bid: (action: BidAction) => void;
  readonly toggleDiscardSelection: (card: Card) => void;
  readonly confirmDiscard: () => void;
  readonly playCard: (card: Card) => void;
  readonly dealNextRound: () => void;
  readonly newGame: (seed?: number) => void;
}

interface Game {
  readonly state: GameState;
  readonly rng: Rng;
}

/** A one-time, UI-layer-only random seed. The engine/AI never see `Math.random`. */
function makeSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

export function useZoleGame(initialSeed?: number): ZoleGameVM {
  const [seed, setSeed] = useState<number>(() => initialSeed ?? makeSeed());
  const [game, setGame] = useState<Game>(() => newGame(seed));
  const [selectedDiscards, setSelectedDiscards] = useState<readonly Card[]>([]);
  const state = game.state;

  // Auto-advance AI turns one step per effect run; applying a step re-runs this effect and chains
  // the next AI seat until it is the human's turn or the round ends.
  useEffect(() => {
    if (!isAiTurn(state)) return;
    let cancelled = false;
    const id = setTimeout(() => {
      if (cancelled) return;
      setGame((g) => (isAiTurn(g.state) ? { state: stepAi(g.state, g.rng), rng: g.rng } : g));
    }, AI_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [state]);

  const bid = useCallback((action: BidAction) => {
    setGame((g) => {
      const move: Move = { type: 'bid', action };
      return driverIsHumanTurn(g.state) && isLegal(g.state, move)
        ? { state: applyHumanMove(g.state, move), rng: g.rng }
        : g;
    });
  }, []);

  const playCard = useCallback((card: Card) => {
    setGame((g) => {
      const move: Move = { type: 'play', card };
      return driverIsHumanTurn(g.state) && isLegal(g.state, move)
        ? { state: applyHumanMove(g.state, move), rng: g.rng }
        : g;
    });
  }, []);

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
        ? { state: applyHumanMove(g.state, move), rng: g.rng }
        : g;
    });
    setSelectedDiscards([]);
  }, [selectedDiscards]);

  const dealNextRound = useCallback(() => {
    setGame((g) =>
      g.state.phase === 'roundEnd' ? { state: nextRound(g.state, g.rng), rng: g.rng } : g,
    );
  }, []);

  const startNewGame = useCallback((nextSeed?: number) => {
    const chosen = nextSeed ?? makeSeed();
    setSeed(chosen);
    setSelectedDiscards([]);
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
    bid,
    toggleDiscardSelection,
    confirmDiscard,
    playCard,
    dealNextRound,
    newGame: startNewGame,
  };
}
