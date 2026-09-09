import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { cardId, type Card } from '../../engine/index.ts';
import { Hand } from './Hand.tsx';

const ace: Card = { rank: 'A', suit: 'clubs' };
const ten: Card = { rank: '10', suit: 'spades' };
const king: Card = { rank: 'K', suit: 'hearts' };

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
});
