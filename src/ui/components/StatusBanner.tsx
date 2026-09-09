import type { GameType, Phase, PlayerId } from '../../engine/index.ts';
import { seatName } from '../game/driver.ts';

export interface StatusBannerProps {
  phase: Phase;
  current: PlayerId;
  gameType: GameType | null;
  soloist: PlayerId | null;
  isHumanTurn: boolean;
  dealer?: PlayerId;
}

const PHASE_WORD: Record<Phase, string> = {
  bidding: 'Bidding',
  discarding: 'Put-down',
  playing: 'Playing',
  roundEnd: 'Round over',
};

const GAME_TYPE_WORD: Record<GameType, string> = {
  galdins: 'Galdiņš',
  zole: 'Zole',
  ordinary: 'Ordinary',
};

export function StatusBanner({
  phase,
  current,
  gameType,
  soloist,
  isHumanTurn,
  dealer,
}: StatusBannerProps) {
  let text = PHASE_WORD[phase];
  if (phase !== 'roundEnd') {
    text += ' · ' + (isHumanTurn ? 'Your turn' : `${seatName(current)} to act`);
  }
  // Galdiņš gets its own compact badge (rendered below) instead of a plain "· Galdiņš" fragment.
  // The full "no soloist — fewest tricks wins" explanation lives in the Table header banner, so the
  // badge here stays a short game-type indicator to avoid stating the same sentence twice.
  if (gameType !== null && gameType !== 'galdins') {
    text += ' · ' + GAME_TYPE_WORD[gameType];
  }
  if (soloist !== null) {
    text += ' · Big: ' + seatName(soloist);
  }
  if (dealer !== undefined) {
    text += ' · Dealer: ' + seatName(dealer);
  }

  return (
    <div className="status-banner">
      {gameType === 'galdins' ? (
        <span className="status-banner__galdins">
          <span className="status-banner__galdins-title">Galdiņš</span>
          <span className="status-banner__galdins-sub">no soloist</span>
        </span>
      ) : null}
      <span className="status-banner__text">{text}</span>
    </div>
  );
}
