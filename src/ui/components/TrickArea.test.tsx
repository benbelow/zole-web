import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Card, TrickCard } from '../../engine/index.ts';
import { TrickArea } from './TrickArea.tsx';

const cardA: Card = { rank: 'A', suit: 'clubs' };
const cardB: Card = { rank: '10', suit: 'spades' };

describe('TrickArea', () => {
  it('renders each played card with its player name', () => {
    const trick: TrickCard[] = [
      { by: 0, card: cardA },
      { by: 1, card: cardB },
    ];
    render(<TrickArea trick={trick} trickLeader={0} current={2} />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('AI West')).toBeInTheDocument();
    expect(screen.getByLabelText('A♣')).toBeInTheDocument();
    expect(screen.getByLabelText('10♠')).toBeInTheDocument();
  });

  it('shows the empty message when the trick is empty', () => {
    render(<TrickArea trick={[]} trickLeader={null} current={0} />);
    expect(screen.getByText('No cards played yet.')).toBeInTheDocument();
  });
});
