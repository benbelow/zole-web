import type { OpponentView, Phase } from '../../engine/index.ts';
import { seatName } from '../game/driver.ts';

export interface OpponentPanelProps {
  opponent: OpponentView; // { id, handCount, capturedCount, tricksWon, gamePoints, hasPassed }
  isCurrent: boolean;
  isSoloist: boolean;
  phase: Phase;
}

export function OpponentPanel({ opponent, isCurrent, isSoloist, phase }: OpponentPanelProps) {
  const className = [
    'opponent-panel',
    isCurrent && 'opponent-panel--current',
    isSoloist && 'opponent-panel--soloist',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <div className="opponent-name">{seatName(opponent.id)}</div>
      <div className="opponent-backs">
        {/* Face-down placeholders only — opponents' actual cards are never rendered (redaction).
            Index keys are fine here: the spans are identical and order-stable. */}
        {Array.from({ length: opponent.handCount }, (_, i) => (
          <span key={i} className="card-back" />
        ))}
      </div>
      <div className="opponent-stats">
        <span>Tricks: {opponent.tricksWon}</span>
        <span>Score: {opponent.gamePoints}</span>
      </div>
      {isSoloist && <span className="badge">Soloist</span>}
      {isCurrent && <span className="badge">Playing…</span>}
      {phase === 'bidding' && opponent.hasPassed && <span className="badge">Passed</span>}
    </div>
  );
}
