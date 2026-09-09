import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { cardId, type Card } from '../../engine/index.ts';
import { diffNewCardIds, Hand } from './Hand.tsx';

const ace: Card = { rank: 'A', suit: 'clubs' };
const ten: Card = { rank: '10', suit: 'spades' };
const king: Card = { rank: 'K', suit: 'hearts' };
const queen: Card = { rank: 'Q', suit: 'diamonds' };
const jack: Card = { rank: 'J', suit: 'clubs' };

describe('Hand', () => {
  it('renders illegal cards as disabled', () => {
    render(<Hand cards={[ace, ten, king]} legalCards={[ace]} interactive onPlay={() => {}} />);
    expect(screen.getByTestId(`card-${cardId(ace)}`)).toBeEnabled();
    expect(screen.getByTestId(`card-${cardId(ten)}`)).toBeDisabled();
    expect(screen.getByTestId(`card-${cardId(king)}`)).toBeDisabled();
  });

  it('calls onPlay with the clicked legal card', async () => {
    const onPlay = vi.fn();
    render(<Hand cards={[ace, ten]} legalCards={[ace]} interactive onPlay={onPlay} />);
    await userEvent.click(screen.getByTestId(`card-${cardId(ace)}`));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledWith(ace);
  });

  it('makes nothing clickable when not interactive', async () => {
    const onPlay = vi.fn();
    render(<Hand cards={[ace, ten]} legalCards={[ace]} interactive={false} onPlay={onPlay} />);
    expect(screen.getByTestId(`card-${cardId(ace)}`)).toBeDisabled();
    expect(screen.getByTestId(`card-${cardId(ten)}`)).toBeDisabled();
    await userEvent.click(screen.getByTestId(`card-${cardId(ace)}`));
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('greys (dims) only illegal cards during the play turn', () => {
    render(<Hand cards={[ace, ten, king]} legalCards={[ace]} interactive onPlay={() => {}} />);
    expect(screen.getByTestId(`card-${cardId(ace)}`).className).not.toContain('card--disabled');
    expect(screen.getByTestId(`card-${cardId(ten)}`).className).toContain('card--disabled');
    expect(screen.getByTestId(`card-${cardId(king)}`).className).toContain('card--disabled');
  });

  it('does NOT grey the hand when it is not the play turn (regression: bidding after New Game)', () => {
    // No legal plays and not interactive — e.g. the bidding phase. Cards are non-clickable but must
    // render at full opacity, never greyed.
    render(<Hand cards={[ace, ten, king]} legalCards={[]} interactive={false} />);
    for (const card of [ace, ten, king]) {
      const el = screen.getByTestId(`card-${cardId(card)}`);
      expect(el).toBeDisabled(); // not clickable
      expect(el.className).not.toContain('card--disabled'); // but not greyed
    }
  });

  it('marks only newly-arrived cards as dealing on pick-up re-render', () => {
    const { rerender } = render(<Hand cards={[ace, ten, king]} interactive={false} />);

    // First render: previous ids were empty, so every card is new (initial deal animates fully).
    for (const card of [ace, ten, king]) {
      expect(screen.getByTestId(`card-${cardId(card)}`).className).toContain('card--dealing');
    }

    // Pick-up: two cards arrive; the three already-held cards must NOT re-animate.
    rerender(<Hand cards={[ace, ten, king, queen, jack]} interactive={false} />);
    for (const card of [ace, ten, king]) {
      expect(screen.getByTestId(`card-${cardId(card)}`).className).not.toContain('card--dealing');
    }
    for (const card of [queen, jack]) {
      expect(screen.getByTestId(`card-${cardId(card)}`).className).toContain('card--dealing');
    }

    // A re-render that does not change the hand never (re)marks a previously-held card as dealing.
    // (Newly-arrived cards may keep their one-shot class, but the held cards must stay untouched.)
    rerender(<Hand cards={[ace, ten, king, queen, jack]} interactive={false} />);
    for (const card of [ace, ten, king]) {
      expect(screen.getByTestId(`card-${cardId(card)}`).className).not.toContain('card--dealing');
    }
  });
});

describe('diffNewCardIds', () => {
  it('treats every card as new on a fresh deal (empty previous set)', () => {
    const result = diffNewCardIds(new Set(), ['a', 'b', 'c']);
    expect(result).toEqual(new Set(['a', 'b', 'c']));
  });

  it('returns only the added ids on pick-up', () => {
    const result = diffNewCardIds(new Set(['a', 'b', 'c']), ['a', 'b', 'c', 'd', 'e']);
    expect(result).toEqual(new Set(['d', 'e']));
  });

  it('returns an empty set when the hand is unchanged', () => {
    const result = diffNewCardIds(new Set(['a', 'b', 'c']), ['a', 'b', 'c']);
    expect(result).toEqual(new Set());
  });
});
