import { cardId, type PlayerId, type TrickCard } from '../../engine/index.ts';
import { seatName } from '../game/driver.ts';
import { CardView } from './CardView.tsx';

export interface TrickAreaProps {
  trick: readonly TrickCard[];
  trickLeader: PlayerId | null;
  current: PlayerId;
}

export function TrickArea({ trick }: TrickAreaProps) {
  if (trick.length === 0) {
    return (
      <div className="trick-area">
        <p className="trick-empty">No cards played yet.</p>
      </div>
    );
  }

  return (
    <div className="trick-area">
      {trick.map((t) => (
        <div key={cardId(t.card)} className="trick-card">
          <CardView card={t.card} />
          <span className="trick-card__player">{seatName(t.by)}</span>
        </div>
      ))}
    </div>
  );
}
