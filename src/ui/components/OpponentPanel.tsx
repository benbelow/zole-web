import type { OpponentView, Phase } from '../../engine/index.ts';
import { seatName } from '../game/driver.ts';

/** A player's side once a soloist is decided: 'big' = soloist, 'small' = allied pair. */
export type Role = 'big' | 'small' | null;

export interface OpponentPanelProps {
  opponent: OpponentView; // { id, handCount, capturedCount, tricksWon, gamePoints, hasPassed }
  isCurrent: boolean;
  isSoloist: boolean;
  phase: Phase;
  role?: Role;
  isDealer?: boolean;
}

export function OpponentPanel({
  opponent,
  isCurrent,
  isSoloist,
  phase,
  role = null,
  isDealer = false,
}: OpponentPanelProps) {
  const className = [
    'opponent-panel',
    isCurrent && 'opponent-panel--current',
    isSoloist && 'opponent-panel--soloist',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <div className="opponent-name">
        {seatName(opponent.id)}
        {isDealer && <span className="dealer-chip" title="Dealer">D</span>}
      </div>
      {role && (
        <span className={`role-badge role-badge--${role}`}>{role === 'big' ? 'BIG' : 'SMALL'}</span>
      )}
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
      {isCurrent && <span className="badge">Playing…</span>}
      {phase === 'bidding' && opponent.hasPassed && <span className="badge">Passed</span>}
    </div>
  );
}
