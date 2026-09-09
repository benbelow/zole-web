import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RoundResult } from '../../engine/index.ts';
import { RoundSummary } from './RoundSummary.tsx';

const result: RoundResult = {
  gameType: 'ordinary',
  soloist: 0,
  bigScore: 75,
  deltas: [4, -2, -2],
  treeBranchesBefore: 0,
  treeBranchesAfter: 0,
  summary: 'Soloist won with 75 points.',
};

describe('RoundSummary', () => {
  it('renders the summary text', () => {
    render(<RoundSummary result={result} />);
    expect(screen.getByText('Soloist won with 75 points.')).toBeInTheDocument();
  });

  it('renders each delta with the correct sign class', () => {
    const { container } = render(<RoundSummary result={result} />);
    const deltas = Array.from(container.querySelectorAll('.delta'));
    expect(deltas).toHaveLength(3);

    expect(deltas[0]).toHaveTextContent('+4');
    expect(deltas[0]).toHaveClass('delta--pos');

    expect(deltas[1]).toHaveTextContent('-2');
    expect(deltas[1]).toHaveClass('delta--neg');

    const zeroResult: RoundResult = { ...result, deltas: [0, 0, 0] };
    const { container: c2 } = render(<RoundSummary result={zeroResult} />);
    for (const d of c2.querySelectorAll('.delta')) {
      expect(d).toHaveClass('delta--zero');
      expect(d).toHaveTextContent('0');
    }
  });
});
