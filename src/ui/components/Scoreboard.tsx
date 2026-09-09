import type { PlayerId } from '../../engine/index.ts';

export interface ScoreEntry {
  seat: PlayerId;
  name: string;
  gamePoints: number;
  isMe: boolean;
}

export interface ScoreboardProps {
  entries: readonly ScoreEntry[];
  zoleTreeBranches: number;
}

export function Scoreboard({ entries, zoleTreeBranches }: ScoreboardProps) {
  return (
    <div className="scoreboard">
      {entries.map((entry) => (
        <div
          key={entry.seat}
          className={['score-row', entry.isMe && 'score-row--me'].filter(Boolean).join(' ')}
        >
          <span className="score-name">{entry.name}</span>
          <span className="score-points">{entry.gamePoints}</span>
        </div>
      ))}
      <div className="score-tree">Zole tree: {zoleTreeBranches}</div>
    </div>
  );
}
