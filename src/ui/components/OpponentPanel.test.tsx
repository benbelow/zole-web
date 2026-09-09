import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

describe('OpponentPanel round delta', () => {
  it('shows a large per-round delta when roundDelta is provided', () => {
    const { container } = render(
      <OpponentPanel
        opponent={base}
        isCurrent={false}
        isSoloist={false}
        phase="roundEnd"
        roundDelta={4}
      />,
    );
    const delta = container.querySelector('.round-delta');
    expect(delta).not.toBeNull();
    expect(delta).toHaveClass('round-delta--pos');
    expect(delta).toHaveTextContent('+4');
  });

  it('renders negative deltas with a sign and neg styling', () => {
    const { container } = render(
      <OpponentPanel
        opponent={base}
        isCurrent={false}
        isSoloist={false}
        phase="roundEnd"
        roundDelta={-6}
      />,
    );
    const delta = container.querySelector('.round-delta');
    expect(delta).toHaveClass('round-delta--neg');
    expect(delta).toHaveTextContent('-6');
  });

  it('hides the round delta by default (null)', () => {
    const { container } = render(
      <OpponentPanel opponent={base} isCurrent={false} isSoloist={false} phase="playing" />,
    );
    expect(container.querySelector('.round-delta')).toBeNull();
  });
});

describe('OpponentPanel card points', () => {
  it('shows the card-points pill under the delta when cardPoints is provided', () => {
    const { container } = render(
      <OpponentPanel
        opponent={base}
        isCurrent={false}
        isSoloist={false}
        phase="roundEnd"
        roundDelta={4}
        cardPoints={47}
      />,
    );
    const pill = container.querySelector('.card-points-pill');
    expect(pill).not.toBeNull();
    expect(pill).toHaveTextContent('47 pts');
    // Ordered after the delta (secondary figure beneath it).
    const delta = container.querySelector('.round-delta');
    expect(delta!.compareDocumentPosition(pill!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('hides the card-points pill by default (null / mid-trick)', () => {
    const { container } = render(
      <OpponentPanel opponent={base} isCurrent={false} isSoloist={false} phase="playing" />,
    );
    expect(container.querySelector('.card-points-pill')).toBeNull();
  });
});

describe('OpponentPanel AI picker', () => {
  it('renders a strategy picker and fires onStrategyChange', () => {
    const onStrategyChange = vi.fn();
    render(
      <OpponentPanel
        opponent={base}
        isCurrent={false}
        isSoloist={false}
        phase="playing"
        strategyId="greedy"
        onStrategyChange={onStrategyChange}
      />,
    );
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'random' } });
    expect(onStrategyChange).toHaveBeenCalledWith('random');
  });

  it('omits the picker when no handler is provided', () => {
    render(<OpponentPanel opponent={base} isCurrent={false} isSoloist={false} phase="playing" />);
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});
