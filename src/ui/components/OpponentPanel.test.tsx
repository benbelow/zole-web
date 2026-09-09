import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OpponentView } from '../../engine/index.ts';
import { OpponentPanel } from './OpponentPanel.tsx';

const base: OpponentView = {
  id: 1,
  handCount: 3,
  capturedCount: 0,
  tricksWon: 0,
  gamePoints: 0,
  hasPassed: false,
};

describe('OpponentPanel', () => {
  it('renders the hand-count as card-backs and no card faces', () => {
    const { container } = render(
      <OpponentPanel opponent={base} isCurrent={false} isSoloist={false} phase="playing" />,
    );
    expect(container.querySelectorAll('.card-back')).toHaveLength(3);
    // Never expose opponent card faces.
    expect(container.querySelectorAll('.card--red')).toHaveLength(0);
    expect(container.querySelectorAll('.card--black')).toHaveLength(0);
    expect(container.querySelectorAll('button.card')).toHaveLength(0);
  });

  it('shows the Passed badge only in bidding when hasPassed', () => {
    const passed: OpponentView = { ...base, hasPassed: true };
    const { rerender } = render(
      <OpponentPanel opponent={passed} isCurrent={false} isSoloist={false} phase="bidding" />,
    );
    expect(screen.getByText('Passed')).toBeInTheDocument();

    rerender(
      <OpponentPanel opponent={passed} isCurrent={false} isSoloist={false} phase="playing" />,
    );
    expect(screen.queryByText('Passed')).not.toBeInTheDocument();

    rerender(<OpponentPanel opponent={base} isCurrent={false} isSoloist={false} phase="bidding" />);
    expect(screen.queryByText('Passed')).not.toBeInTheDocument();
  });
});
