import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Scoreboard, type ScoreEntry } from './Scoreboard.tsx';

const entries: ScoreEntry[] = [
  { seat: 0, name: 'You', gamePoints: 5, isMe: true },
  { seat: 1, name: 'AI West', gamePoints: -2, isMe: false },
  { seat: 2, name: 'AI East', gamePoints: -3, isMe: false },
];

describe('Scoreboard', () => {
  it('renders each entry points and the zole-tree count', () => {
    render(<Scoreboard entries={entries} zoleTreeBranches={4} />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
    expect(screen.getByText('Zole tree: 4')).toBeInTheDocument();
  });

  it('marks the me row', () => {
    const { container } = render(<Scoreboard entries={entries} zoleTreeBranches={0} />);
    const meRows = container.querySelectorAll('.score-row--me');
    expect(meRows).toHaveLength(1);
    expect(meRows[0]).toHaveTextContent('You');
  });
});
