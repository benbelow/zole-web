import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RoundResult } from '../../engine/index.ts';
import { RoundSummary } from './RoundSummary.tsx';

const result: RoundResult = {
  gameType: 'ordinary',
  soloist: 0,
  bigScore: 75,
  smallScore: 45,
  cardPointsByPlayer: [55, 25, 20],
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

  it('shows the big/small card-point split for ordinary/Zole', () => {
    render(<RoundSummary result={result} />);
    const line = screen.getByText(/Soloist \(BIG\): 75/);
    expect(line).toHaveTextContent('Pair (SMALL): 45');
  });

  it('shows per-seat card points for galdiņš without implying a 120 sum', () => {
    const galdins: RoundResult = {
      gameType: 'galdins',
      soloist: null,
      bigScore: null,
      smallScore: null,
      cardPointsByPlayer: [55, 20, 12], // sums to 87, not 120 (talon unattributed)
      deltas: [-4, 2, 2],
      treeBranchesBefore: 0,
      treeBranchesAfter: 0,
      summary: 'Galdiņš outcome.',
    };
    render(<RoundSummary result={galdins} />);
    const line = screen.getByText(/Cards taken —/);
    expect(line).toHaveTextContent('55');
    expect(line).toHaveTextContent('20');
    expect(line).toHaveTextContent('12');
    // No BIG/SMALL split for galdiņš.
    expect(screen.queryByText(/\(BIG\)/)).toBeNull();
    expect(screen.queryByText(/\(SMALL\)/)).toBeNull();
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
