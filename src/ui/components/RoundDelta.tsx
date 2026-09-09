/**
 * A large, prominent per-round game-point change shown in a player's own space at round end.
 * The full breakdown still lives in `RoundSummary`; this is the at-a-glance number in each seat.
 */
export interface RoundDeltaProps {
  /** Game-point change for this player this round (from `RoundResult.deltas`). */
  delta: number;
}

export function RoundDelta({ delta }: RoundDeltaProps) {
  const sign = delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'zero';
  const label = delta > 0 ? `+${delta}` : `${delta}`;
  return (
    <div
      className={`round-delta round-delta--${sign}`}
      role="status"
      aria-label={`Round score ${label}`}
    >
      {label}
    </div>
  );
}
