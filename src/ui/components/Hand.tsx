import { cardId, type Card } from '../../engine/index.ts';
import { CardView } from './CardView.tsx';

export interface HandProps {
  cards: readonly Card[];
  legalCards?: readonly Card[]; // cards legal to play right now
  interactive: boolean; // whether cards may be clicked
  onPlay?: (card: Card) => void;
}

export function Hand({ cards, legalCards, interactive, onPlay }: HandProps) {
  const ids = new Set<string>((legalCards ?? []).map(cardId));

  return (
    <div className="hand">
      {cards.map((card) => {
        const legal = !legalCards || ids.has(cardId(card));
        const disabled = !interactive || !legal;
        const playable = interactive && legal;
        const onClick = interactive && legal ? onPlay : undefined;
        return (
          <CardView
            key={cardId(card)}
            card={card}
            disabled={disabled}
            playable={playable}
            onClick={onClick}
          />
        );
      })}
    </div>
  );
}
