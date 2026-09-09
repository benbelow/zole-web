/**
 * A small, muted secondary figure showing the card points a seat won in tricks this round.
 * Presentational only — it never affects game state. Shown beneath the big `RoundDelta` at round
 * end (see `Table.tsx` / `OpponentPanel.tsx`); the full soloist `bigScore` lives in `RoundSummary`.
 */
export interface CardPointsPillProps {
  /** Card points this seat took in tricks this round (from `RoundResult.cardPointsByPlayer`). */
  points: number;
}

export function CardPointsPill({ points }: CardPointsPillProps) {
  return (
    <div className="card-points-pill" aria-label={`Card points taken ${points}`}>
      {points} pts
    </div>
  );
}
