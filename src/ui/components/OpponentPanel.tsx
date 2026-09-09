import type { OpponentView, Phase } from '../../engine/index.ts';
import { AI_STRATEGIES, seatName, type StrategyId } from '../game/driver.ts';
import { RoundDelta } from './RoundDelta.tsx';
import { CardPointsPill } from './CardPointsPill.tsx';

/** A player's side once a soloist is decided: 'big' = soloist, 'small' = allied pair. */
export type Role = 'big' | 'small' | null;

export interface OpponentPanelProps {
  opponent: OpponentView; // { id, handCount, capturedCount, tricksWon, gamePoints, hasPassed }
  isCurrent: boolean;
  isSoloist: boolean;
  phase: Phase;
  role?: Role;
  isDealer?: boolean;
  strategyId?: StrategyId;
  onStrategyChange?: (id: StrategyId) => void;
  /** Per-round game-point change to show large in this seat at round end (null = hide). */
  roundDelta?: number | null;
  /** Card points this seat took in tricks this round, shown small beneath the delta (null = hide). */
  cardPoints?: number | null;
}

export function OpponentPanel({
  opponent,
  isCurrent,
  isSoloist,
  phase,
  role = null,
  isDealer = false,
  strategyId,
  onStrategyChange,
  roundDelta = null,
  cardPoints = null,
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
      {roundDelta !== null && <RoundDelta delta={roundDelta} />}
      {cardPoints !== null && <CardPointsPill points={cardPoints} />}
      {strategyId && onStrategyChange && (
        <label className="ai-picker">
          <span className="ai-picker__label">AI</span>
          <select
            className="ai-picker__select"
            value={strategyId}
            onChange={(e) => onStrategyChange(e.target.value as StrategyId)}
          >
            {AI_STRATEGIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {isCurrent && <span className="badge">Playing…</span>}
      {phase === 'bidding' && opponent.hasPassed && <span className="badge">Passed</span>}
    </div>
  );
}
