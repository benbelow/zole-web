/**
 * The immutable game-state model and move vocabulary for a Zole round (design D1).
 *
 * Types only — no logic. Transitions live in `round.ts`; scoring in `scoring.ts`; redaction in
 * `view.ts`. All state is `readonly`; reducers return new state without mutating inputs.
 */

import type { Card } from './cards.ts';

export type PlayerId = 0 | 1 | 2;
export type GameType = 'ordinary' | 'zole' | 'galdins';

/** A single card played into the current trick, tagged with who played it. */
export interface TrickCard {
  readonly by: PlayerId;
  readonly card: Card;
}

export interface PlayerState {
  readonly hand: readonly Card[];
  readonly captured: readonly Card[]; // cards won in tricks this round
  readonly tricksWon: number; // number of tricks taken this round (for galdiņš)
  readonly gamePoints: number; // cumulative score across rounds
}

export interface RoundBase {
  readonly players: readonly [PlayerState, PlayerState, PlayerState];
  readonly dealer: PlayerId;
  readonly current: PlayerId; // whose turn to act
  readonly zoleTreeBranches: number;
  readonly roundNumber: number;
}

export interface BiddingState extends RoundBase {
  readonly phase: 'bidding';
  readonly stock: readonly [Card, Card];
  readonly passed: readonly PlayerId[];
}

export interface DiscardingState extends RoundBase {
  readonly phase: 'discarding';
  readonly gameType: 'ordinary';
  readonly soloist: PlayerId; // holds 10 cards pending a 2-card discard
}

export interface PlayingState extends RoundBase {
  readonly phase: 'playing';
  readonly gameType: GameType;
  readonly soloist: PlayerId | null; // null in galdiņš
  readonly trickLeader: PlayerId;
  readonly trick: readonly TrickCard[]; // 0..3 cards played to the current trick
  readonly soloistDiscard: readonly Card[]; // ordinary: 2 cards banked for the soloist
  readonly pairStock: readonly Card[]; // zole: 2 stock cards banked for the pair
}

export interface RoundEndState extends RoundBase {
  readonly phase: 'roundEnd';
  readonly result: RoundResult; // per-player deltas + explanation
}

export type GameState = BiddingState | DiscardingState | PlayingState | RoundEndState;
export type Phase = GameState['phase'];

export type BidAction = 'pickup' | 'zole' | 'pass';

export type Move =
  | { readonly type: 'bid'; readonly action: BidAction }
  | { readonly type: 'discard'; readonly cards: readonly [Card, Card] }
  | { readonly type: 'play'; readonly card: Card };

/** Outcome of a scored round (see `scoring.ts`). */
export interface RoundResult {
  readonly gameType: GameType;
  readonly soloist: PlayerId | null;
  /** Card points won by the soloist (null in galdiņš). */
  readonly bigScore: number | null;
  /**
   * Card points won by the allied pair ("small") in ordinary/Zole: the two opponents' trick
   * points plus, in a Zole call, the two banked talon cards. Equals `120 − bigScore` for
   * ordinary and Zole. `null` in galdiņš (no pair). (rules §4a)
   */
  readonly smallScore: number | null;
  /**
   * Card points each player won *in tricks* this round (by PlayerId). Excludes banked cards
   * (the soloist's ordinary discard and the Zole talon), so it is a pure "points taken in play"
   * figure. Present for every game type; it is the primary per-seat figure for galdiņš.
   * (rules §1, §4)
   */
  readonly cardPointsByPlayer: readonly [number, number, number];
  /** Game-point change applied to each player this round; sums to zero. */
  readonly deltas: readonly [number, number, number];
  readonly treeBranchesBefore: number;
  readonly treeBranchesAfter: number;
  /** Human-readable explanation of the settlement. */
  readonly summary: string;
}

/** What survives between rounds; consumed by `dealRound` to start the next round. */
export interface RoundCarryOver {
  readonly gamePoints: readonly [number, number, number];
  /** The dealer of the round that just finished; `dealRound` rotates it left. */
  readonly dealer: PlayerId;
  readonly zoleTreeBranches: number;
  readonly roundNumber: number;
}

/** A brand-new game: nobody scored, player 2 "dealt" so player 0 bids first, empty tree. */
export function initialCarryOver(): RoundCarryOver {
  return {
    gamePoints: [0, 0, 0],
    dealer: 2,
    zoleTreeBranches: 0,
    roundNumber: 0,
  };
}

// ---------------------------------------------------------------------------
// Redacted view for AI / UI (design D3). A player sees its own hand, the public
// trick, scores, and counts of others' cards — never opponents' faces, the
// stock, or the soloist's discard.
// ---------------------------------------------------------------------------

export interface OpponentView {
  readonly id: PlayerId;
  readonly handCount: number;
  readonly capturedCount: number;
  readonly tricksWon: number;
  readonly gamePoints: number;
  readonly hasPassed: boolean; // meaningful during bidding
}

export interface PlayerView {
  readonly me: PlayerId;
  readonly phase: Phase;
  readonly hand: readonly Card[];
  readonly gamePoints: number;
  readonly zoleTreeBranches: number;
  readonly dealer: PlayerId;
  readonly current: PlayerId;
  readonly gameType: GameType | null;
  readonly soloist: PlayerId | null;
  readonly trick: readonly TrickCard[];
  readonly trickLeader: PlayerId | null;
  readonly passed: readonly PlayerId[];
  readonly opponents: readonly OpponentView[];
  /** The moves that are legal for `me` right now (empty unless it is my turn). */
  readonly legalMoves: readonly Move[];
  /** Present only once the round has ended. */
  readonly result: RoundResult | null;
}
