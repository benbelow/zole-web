import { describe, it, expect } from 'vitest';

import type { Card, Rank, Suit } from './cards.ts';
import type { PlayerId, TrickCard } from './state.ts';
import {
  currentWinner,
  inLedCategory,
  ledCategory,
  legalPlays,
  trickWinner,
  wouldWin,
} from './trick.ts';

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit });
const tc = (by: PlayerId, card: Card): TrickCard => ({ by, card });

describe('ledCategory', () => {
  it('treats any diamond as trump', () => {
    expect(ledCategory(c('7', 'diamonds'))).toBe('trump');
    expect(ledCategory(c('A', 'diamonds'))).toBe('trump');
  });

  it('treats Queens and Jacks of any suit as trump', () => {
    expect(ledCategory(c('Q', 'hearts'))).toBe('trump');
    expect(ledCategory(c('J', 'clubs'))).toBe('trump');
    expect(ledCategory(c('Q', 'spades'))).toBe('trump');
  });

  it('returns the suit for a non-trump card', () => {
    expect(ledCategory(c('A', 'hearts'))).toBe('hearts');
    expect(ledCategory(c('K', 'clubs'))).toBe('clubs');
    expect(ledCategory(c('9', 'spades'))).toBe('spades');
  });
});

describe('inLedCategory', () => {
  it('matches trumps against the trump category and non-trumps by suit', () => {
    expect(inLedCategory(c('J', 'hearts'), 'trump')).toBe(true);
    expect(inLedCategory(c('A', 'hearts'), 'trump')).toBe(false);
    expect(inLedCategory(c('A', 'hearts'), 'hearts')).toBe(true);
    // A heart Queen is a trump, so it does NOT belong to the 'hearts' non-trump category.
    expect(inLedCategory(c('Q', 'hearts'), 'hearts')).toBe(false);
    expect(inLedCategory(c('K', 'clubs'), 'hearts')).toBe(false);
  });
});

describe('legalPlays', () => {
  it('returns the whole hand when leading (empty trick)', () => {
    const hand = [c('A', 'hearts'), c('K', 'clubs'), c('Q', 'clubs')];
    expect(legalPlays(hand, [])).toEqual(hand);
  });

  it('forces following the led non-trump suit when able', () => {
    const hand = [c('A', 'hearts'), c('9', 'hearts'), c('K', 'clubs'), c('A', 'diamonds')];
    const trick = [tc(0, c('10', 'hearts'))]; // hearts led
    const legal = legalPlays(hand, trick);
    expect(legal).toEqual([c('A', 'hearts'), c('9', 'hearts')]);
  });

  it('allows any card when void in the led suit', () => {
    const hand = [c('K', 'clubs'), c('A', 'spades'), c('A', 'diamonds')];
    const trick = [tc(0, c('10', 'hearts'))]; // hearts led, hand has no hearts
    expect(legalPlays(hand, trick)).toEqual(hand);
  });

  it('forces a trump when trump is led and the player holds any trump', () => {
    const hand = [c('J', 'spades'), c('7', 'diamonds'), c('A', 'hearts'), c('K', 'clubs')];
    const trick = [tc(0, c('Q', 'diamonds'))]; // trump led
    const legal = legalPlays(hand, trick);
    // J♠ and 7♦ are trumps; A♥ and K♣ are not.
    expect(legal).toEqual([c('J', 'spades'), c('7', 'diamonds')]);
  });

  it('allows any card when trump is led but the player has no trump', () => {
    const hand = [c('A', 'hearts'), c('K', 'clubs'), c('9', 'spades')];
    const trick = [tc(0, c('J', 'diamonds'))]; // trump led
    expect(legalPlays(hand, trick)).toEqual(hand);
  });

  it('does not mutate the input hand', () => {
    const hand = [c('A', 'hearts'), c('9', 'hearts')];
    const copy = [...hand];
    legalPlays(hand, []);
    expect(hand).toEqual(copy);
  });
});

describe('trickWinner', () => {
  it('throws on an incomplete trick', () => {
    expect(() => trickWinner([])).toThrow();
    expect(() => trickWinner([tc(0, c('A', 'hearts'))])).toThrow();
    expect(() => trickWinner([tc(0, c('A', 'hearts')), tc(1, c('K', 'hearts'))])).toThrow();
  });

  it('lets the highest trump win — Q♣ beats Q♦ and A♦', () => {
    const trick = [
      tc(0, c('A', 'diamonds')), // trump led
      tc(1, c('Q', 'diamonds')), // stronger trump
      tc(2, c('Q', 'clubs')), // strongest trump
    ];
    expect(trickWinner(trick)).toBe(2);
  });

  it('lets a trump beat a non-trump even when a non-trump led', () => {
    const trick = [
      tc(0, c('A', 'hearts')), // hearts led
      tc(1, c('10', 'hearts')), // higher heart, but not trump
      tc(2, c('7', 'diamonds')), // weakest trump still wins
    ];
    expect(trickWinner(trick)).toBe(2);
  });

  it('cannot let an off-suit non-trump discard win', () => {
    const trick = [
      tc(0, c('9', 'hearts')), // hearts led
      tc(1, c('A', 'hearts')), // led-suit high card
      tc(2, c('A', 'clubs')), // off-suit non-trump discard — cannot win
    ];
    expect(trickWinner(trick)).toBe(1);
  });

  it('awards a no-trump trick to the highest led-suit card', () => {
    const trick = [
      tc(0, c('K', 'spades')), // spades led
      tc(1, c('9', 'spades')),
      tc(2, c('A', 'spades')), // highest spade
    ];
    expect(trickWinner(trick)).toBe(2);
  });

  it('ignores an off-suit non-trump when the led-suit low card is the only led card', () => {
    const trick = [
      tc(0, c('9', 'clubs')), // clubs led
      tc(1, c('A', 'hearts')), // off-suit non-trump
      tc(2, c('K', 'spades')), // off-suit non-trump
    ];
    expect(trickWinner(trick)).toBe(0);
  });
});

describe('currentWinner', () => {
  it('is null on an empty trick', () => {
    expect(currentWinner([])).toBeNull();
  });

  it('tracks the strongest card under the led category so far', () => {
    const trick = [tc(0, c('9', 'hearts')), tc(1, c('A', 'hearts'))];
    expect(currentWinner(trick)).toEqual(tc(1, c('A', 'hearts')));
  });

  it('keeps the led-suit card over a later off-suit non-trump', () => {
    const trick = [tc(0, c('A', 'hearts')), tc(1, c('A', 'clubs'))];
    expect(currentWinner(trick)).toEqual(tc(0, c('A', 'hearts')));
  });
});

describe('wouldWin', () => {
  it('is true when the trick is empty (leading)', () => {
    expect(wouldWin(c('9', 'clubs'), [])).toBe(true);
  });

  it('is true for a higher led-suit card after a low led card', () => {
    const trick = [tc(0, c('9', 'hearts'))];
    expect(wouldWin(c('A', 'hearts'), trick)).toBe(true);
  });

  it('is false for an off-suit non-trump discard', () => {
    const trick = [tc(0, c('9', 'hearts'))];
    expect(wouldWin(c('A', 'clubs'), trick)).toBe(false);
  });

  it('is true for any trump against a non-trump led card', () => {
    const trick = [tc(0, c('A', 'hearts'))];
    expect(wouldWin(c('7', 'diamonds'), trick)).toBe(true);
  });

  it('is false for a weaker trump than the current trump winner', () => {
    const trick = [tc(0, c('Q', 'clubs'))]; // strongest trump led
    expect(wouldWin(c('7', 'diamonds'), trick)).toBe(false);
  });
});
