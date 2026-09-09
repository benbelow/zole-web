export interface GameControlsProps {
  isRoundOver: boolean;
  seed: number;
  onDealNext: () => void;
  onNewGame: () => void;
}

export function GameControls({ isRoundOver, seed, onDealNext, onNewGame }: GameControlsProps) {
  return (
    <div className="game-controls">
      <button type="button" className="btn" disabled={!isRoundOver} onClick={onDealNext}>
        Deal next round
      </button>
      <button type="button" className="btn" onClick={onNewGame}>
        New game
      </button>
      <span className="seed">Seed: {seed}</span>
    </div>
  );
}
