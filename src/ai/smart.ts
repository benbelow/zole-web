/**
 * The "smart" Zole AI (rules §5, `AIPlayer`): a stronger deterministic heuristic derived from the
 * Java `AIPlayer` reference. Depends on `engine` only and stays pure (no React/DOM/I/O; the RNG is
 * part of the contract but not consumed — the heuristics are fully deterministic).
 *
 * Coverage:
 *   - Bidding: greedy thresholds as a floor, slightly more aggressive per `AIPlayer`.
 *   - Discard (ordinary soloist): bank high card points privately, void short side suits, keep
 *     trump strength.
 *   - Play: role/seat-aware heuristics — soloist wins cheaply and flushes trumps; the pair
 *     cooperates (never overtakes a winning partner, dumps points to a winning partner, only takes
 *     when the soloist would otherwise win).
 *   - Galdiņš: minimise tricks — duck when possible, otherwise win as cheaply as possible.
 *
 * Every returned move is guaranteed to be present in `view.legalMoves`.
 */
import {
  cardPoints,
  compareCards,
  currentWinner,
  isTrump,
  sameCard,
  trumpStrength,
  wouldWin,
  type Card,
  type Move,
  type PlayerId,
  type PlayerView,
  type Rng,
  type TrickCard,
} from '../engine/index.ts';
import type { Strategy } from './strategy.ts';

// ---------------------------------------------------------------------------
// Small pure helpers
// ---------------------------------------------------------------------------

/** Non-null first element of a non-empty selection, or undefined. */
function first<T>(items: readonly T[]): T | undefined {
  return items.length > 0 ? items[0] : undefined;
}

/** Cards of the hand belonging to a suit (trumps are their own "suit" via `isTrump`). */
function nonTrumpSuitCount(hand: readonly Card[], suit: Card['suit']): number {
  return hand.filter((c) => !isTrump(c) && c.suit === suit).length;
}

/** Non-trump aces that are the only card of their suit in hand. */
function singleAces(hand: readonly Card[]): Card[] {
  return hand.filter(
    (c) => c.rank === 'A' && !isTrump(c) && nonTrumpSuitCount(hand, c.suit) === 1,
  );
}

function countSingleAces(hand: readonly Card[]): number {
  return singleAces(hand).length;
}

function isTrumpAceOrTen(card: Card): boolean {
  return card.suit === 'diamonds' && (card.rank === 'A' || card.rank === '10');
}

// ---------------------------------------------------------------------------
// Bidding (rules §5) — greedy thresholds as a floor, a touch more aggressive.
// ---------------------------------------------------------------------------

function biddingValue(hand: readonly Card[]): number {
  const queens = hand.filter((c) => c.rank === 'Q').length;
  const jacks = hand.filter((c) => c.rank === 'J').length;
  const aceTen = hand.filter(isTrumpAceOrTen).length;
  return 3 * queens + 2 * jacks + aceTen;
}

function chooseBid(hand: readonly Card[]): 'pickup' | 'zole' | 'pass' {
  const trumps = hand.filter(isTrump).length;
  const aces = countSingleAces(hand);
  const value = biddingValue(hand);

  // Very strong all-trump-or-single-ace holding: call zole.
  if (trumps + aces === 8) return 'zole';
  if (trumps >= 7 && value >= 12) return 'zole';

  // Strong trump holding: pick up.
  if (trumps >= 6) return 'pickup';

  // Greedy floor, plus slightly more aggressive pickups per AIPlayer.
  if (trumps === 4 && aces > 1 && value > 8) return 'pickup';
  if (trumps === 5 && (value > 9 || (aces >= 1 && value >= 9))) return 'pickup';
  // A touch more aggressive than greedy: 5 trumps with a decent value + a cash ace.
  if (trumps === 5 && aces >= 2 && value >= 7) return 'pickup';
  return 'pass';
}

// ---------------------------------------------------------------------------
// Discard (ordinary soloist put-down): bank points, void short side suits,
// keep trump strength.
// ---------------------------------------------------------------------------

/**
 * Rank two non-trump discard candidates: prefer voiding shorter side suits, then higher card
 * points, then weakest card (deterministic tie-break). Single aces are protected — they are cash
 * to lead early, so they sort last among non-trumps.
 */
function discardCompare(a: Card, b: Card, hand: readonly Card[]): number {
  const aSuitCount = nonTrumpSuitCount(hand, a.suit);
  const bSuitCount = nonTrumpSuitCount(hand, b.suit);

  // Protect single aces (cash to lead early): push them to the back.
  const aProtected = a.rank === 'A' && aSuitCount === 1;
  const bProtected = b.rank === 'A' && bSuitCount === 1;
  if (aProtected !== bProtected) return aProtected ? 1 : -1;

  // Prefer voiding shorter suits first.
  if (aSuitCount !== bSuitCount) return aSuitCount - bSuitCount;

  // Among equal-length suits, dump the higher card points first.
  const byPoints = cardPoints(b) - cardPoints(a);
  if (byPoints !== 0) return byPoints;

  return compareCards(a, b); // weakest first
}

function chooseDiscard(hand: readonly Card[]): [Card, Card] {
  const nonTrumps = [...hand]
    .filter((c) => !isTrump(c))
    .sort((a, b) => discardCompare(a, b, hand));

  const picks: Card[] = [...nonTrumps];

  if (picks.length < 2) {
    // Holding 8+ trumps: fill with the weakest trumps (never break real trump strength first).
    const trumps = [...hand].filter(isTrump).sort((a, b) => trumpStrength(a) - trumpStrength(b));
    for (const t of trumps) {
      if (picks.length >= 2) break;
      if (!picks.some((p) => sameCard(p, t))) picks.push(t);
    }
  }

  const a = picks[0]!;
  const b = picks[1]!;
  return [a, b];
}

// ---------------------------------------------------------------------------
// Play — shared selection helpers
// ---------------------------------------------------------------------------

/** The legal `play` cards for the current view. */
function playable(view: PlayerView): Card[] {
  return view.legalMoves
    .filter((m): m is Extract<Move, { type: 'play' }> => m.type === 'play')
    .map((m) => m.card);
}

/** Weakest first: fewest card points, then weakest by `compareCards`. */
function byLowPoints(a: Card, b: Card): number {
  const byPoints = cardPoints(a) - cardPoints(b);
  if (byPoints !== 0) return byPoints;
  return compareCards(a, b);
}

/** Highest first: most card points, then strongest by `compareCards`. */
function byHighPoints(a: Card, b: Card): number {
  return -byLowPoints(a, b);
}

/** The lowest-points card in a selection. */
function lowestPoints(cards: readonly Card[]): Card | undefined {
  return first([...cards].sort(byLowPoints));
}

/** The highest-points card in a selection. */
function highestPoints(cards: readonly Card[]): Card | undefined {
  return first([...cards].sort(byHighPoints));
}

/** The weakest winning card, or undefined if none of the candidates win. */
function lowestWinning(cards: readonly Card[], trick: readonly TrickCard[]): Card | undefined {
  const winners = cards.filter((c) => wouldWin(c, trick));
  if (winners.length === 0) return undefined;
  // Cheapest to win: fewest points, then weakest overall.
  return first([...winners].sort(byLowPoints));
}

/** The highest legal card that does NOT win the trick, or undefined if all legal cards win. */
function highestDucking(cards: readonly Card[], trick: readonly TrickCard[]): Card | undefined {
  const losers = cards.filter((c) => !wouldWin(c, trick));
  if (losers.length === 0) return undefined;
  return first([...losers].sort(byHighPoints));
}

/** Who is winning the trick right now (undefined on an empty trick). */
function trickWinnerId(trick: readonly TrickCard[]): PlayerId | undefined {
  const w = currentWinner(trick);
  return w === null ? undefined : w.by;
}

// ---------------------------------------------------------------------------
// Play — Galdiņš: minimise tricks taken.
// ---------------------------------------------------------------------------

function playGaldins(view: PlayerView): Card {
  const cards = playable(view);
  const leading = view.trick.length === 0;

  if (leading) {
    // Lead a low card to avoid winning and to shed strength.
    return lowestPoints(cards) ?? cards[0]!;
  }

  // Following: play the highest card that does NOT win (shed strength while ducking).
  const duck = highestDucking(cards, view.trick);
  if (duck !== undefined) return duck;

  // Forced to win: take as cheaply as possible.
  return lowestWinning(cards, view.trick) ?? lowestPoints(cards) ?? cards[0]!;
}

// ---------------------------------------------------------------------------
// Play — Soloist ("big"): win cheaply, don't bleed points, flush trumps.
// ---------------------------------------------------------------------------

function playBig(view: PlayerView): Card {
  const cards = playable(view);
  const leading = view.trick.length === 0;

  if (leading) {
    // Lead single aces early to cash them before they are trumped.
    const aces = singleAces(view.hand).filter((a) => cards.some((c) => sameCard(c, a)));
    const ace = first([...aces].sort(byHighPoints));
    if (ace !== undefined) return ace;

    // Otherwise flush opponents' trumps: lead a low trump if holding any.
    const trumps = cards.filter(isTrump);
    if (trumps.length > 0) {
      // Lead a cheap trump to draw out opponents' trumps without bleeding points.
      const cheapTrump = first([...trumps].sort(byLowPoints));
      if (cheapTrump !== undefined) return cheapTrump;
    }

    // No trumps to flush: lead the lowest-points card.
    return lowestPoints(cards) ?? cards[0]!;
  }

  // Following: win cheaply if it is worth it; otherwise shed low points.
  const win = lowestWinning(cards, view.trick);
  if (win !== undefined) {
    const trickPoints = view.trick.reduce((s, t) => s + cardPoints(t.card), 0);
    // Only spend a high-point card to win when the trick already carries points, or the win is
    // cheap. Otherwise duck low to avoid bleeding points into a marginal trick.
    if (cardPoints(win) <= 4 || trickPoints > 4) return win;
    const duck = highestDucking(cards, view.trick);
    // Duck only if it doesn't dump big points needlessly; prefer a cheap-ish shed.
    if (duck !== undefined && cardPoints(duck) < cardPoints(win)) {
      return lowestPoints(cards) ?? duck;
    }
    return win;
  }

  // Cannot win: shed the lowest-points card.
  return lowestPoints(cards) ?? cards[0]!;
}

// ---------------------------------------------------------------------------
// Play — Pair ("small"): cooperate with the partner against the soloist.
// ---------------------------------------------------------------------------

function playSmall(view: PlayerView, soloist: PlayerId): Card {
  const cards = playable(view);
  const leading = view.trick.length === 0;
  const winnerId = trickWinnerId(view.trick);

  if (leading) {
    // Lead single aces early (cash before they are trumped).
    const aces = singleAces(view.hand).filter((a) => cards.some((c) => sameCard(c, a)));
    const ace = first([...aces].sort(byHighPoints));
    if (ace !== undefined) return ace;

    // Otherwise lead low from a short side suit to develop voids / keep points back.
    const nonTrumps = cards.filter((c) => !isTrump(c));
    if (nonTrumps.length > 0) {
      const shortest = [...nonTrumps].sort((a, b) => {
        const bySuit = nonTrumpSuitCount(view.hand, a.suit) - nonTrumpSuitCount(view.hand, b.suit);
        if (bySuit !== 0) return bySuit;
        return byLowPoints(a, b);
      });
      return shortest[0]!;
    }
    return lowestPoints(cards) ?? cards[0]!;
  }

  const partnerWinning = winnerId !== undefined && winnerId !== soloist && winnerId !== view.me;
  const soloistWinning = winnerId === soloist;

  if (partnerWinning) {
    // Partner is taking the trick: dump the highest-point card WITHOUT overtaking them.
    const notOvertaking = cards.filter((c) => !wouldWin(c, view.trick));
    const dump = highestPoints(notOvertaking);
    if (dump !== undefined) return dump;
    // Forced to overtake (only winning cards are legal): take as cheaply as possible.
    return lowestWinning(cards, view.trick) ?? lowestPoints(cards) ?? cards[0]!;
  }

  if (soloistWinning) {
    // Only the soloist is currently winning: take the trick if we can, cheaply.
    const win = lowestWinning(cards, view.trick);
    if (win !== undefined) return win;
    // Cannot take it: shed the lowest-points card (don't feed the soloist).
    return lowestPoints(cards) ?? cards[0]!;
  }

  // Nobody is winning yet is impossible mid-trick, but as a safe default: if we can win cheaply
  // (and thus keep the trick from the soloist later), do so; else shed low.
  const win = lowestWinning(cards, view.trick);
  if (win !== undefined && cardPoints(win) <= 4) return win;
  return lowestPoints(cards) ?? cards[0]!;
}

// ---------------------------------------------------------------------------
// Play — dispatch by game type / role.
// ---------------------------------------------------------------------------

function choosePlay(view: PlayerView): Card {
  const cards = playable(view);
  if (cards.length === 0) {
    // Should not happen while it is our turn to play; fall back defensively.
    const anyPlay = view.legalMoves.find(
      (m): m is Extract<Move, { type: 'play' }> => m.type === 'play',
    );
    if (anyPlay === undefined) {
      throw new Error('smartPlayer: no legal play available');
    }
    return anyPlay.card;
  }

  if (view.gameType === 'galdins' || view.soloist === null) {
    return playGaldins(view);
  }

  if (view.me === view.soloist) {
    return playBig(view);
  }

  return playSmall(view, view.soloist);
}

// ---------------------------------------------------------------------------
// Strategy
// ---------------------------------------------------------------------------

/**
 * The "smart" strategy. Deterministic: given the same view it returns the same move regardless of
 * the RNG (which it does not consume). Every returned move is present in `view.legalMoves`.
 */
export const smartPlayer: Strategy = (view: PlayerView, rng: Rng): Move => {
  void rng; // deterministic heuristic: RNG is part of the contract but not consumed
  switch (view.phase) {
    case 'bidding':
      return { type: 'bid', action: chooseBid(view.hand) };
    case 'discarding':
      return { type: 'discard', cards: chooseDiscard(view.hand) };
    case 'playing':
      return { type: 'play', card: choosePlay(view) };
    case 'roundEnd':
      break;
  }
  const fallback = view.legalMoves[0];
  if (fallback === undefined) {
    throw new Error(`smartPlayer: no legal move available in phase "${view.phase}"`);
  }
  return fallback;
};
