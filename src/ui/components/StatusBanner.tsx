import type { GameType, Phase, PlayerId } from '../../engine/index.ts';
import { seatName } from '../game/driver.ts';

export interface StatusBannerProps {
  phase: Phase;
  current: PlayerId;
  gameType: GameType | null;
  soloist: PlayerId | null;
  isHumanTurn: boolean;
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
}: StatusBannerProps) {
  let text = PHASE_WORD[phase];
  if (phase !== 'roundEnd') {
    text += ' · ' + (isHumanTurn ? 'Your turn' : `${seatName(current)} to act`);
  }
  if (gameType !== null) {
    text += ' · ' + GAME_TYPE_WORD[gameType];
  }
  if (soloist !== null) {
    text += ' · Soloist: ' + seatName(soloist);
  }

  return <div className="status-banner">{text}</div>;
}
