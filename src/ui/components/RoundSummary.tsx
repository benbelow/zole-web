import type { RoundResult } from '../../engine/index.ts';
import { seatName } from '../game/driver.ts';

export interface RoundSummaryProps {
  result: RoundResult;
}

const SEATS = [0, 1, 2] as const;

export function RoundSummary({ result }: RoundSummaryProps) {
  const { gameType, soloist, bigScore, deltas, summary } = result;

  return (
    <div className="round-summary">
      <h2 className="round-summary__title">Round over</h2>
      <p className="summary-row">
        {gameType}
        {soloist === null ? '' : ` · Soloist: ${seatName(soloist)}`}
        {bigScore === null ? '' : ` · Soloist points: ${bigScore}`}
      </p>
      <p className="summary-row">{summary}</p>
      {SEATS.map((seat) => {
        const delta = deltas[seat];
        const deltaClass = [
          'delta',
          delta > 0 && 'delta--pos',
          delta < 0 && 'delta--neg',
          delta === 0 && 'delta--zero',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div key={seat} className="summary-row">
            <span>{seatName(seat)}</span>
            <span className={deltaClass}>{delta > 0 ? `+${delta}` : delta}</span>
          </div>
        );
      })}
    </div>
  );
}
