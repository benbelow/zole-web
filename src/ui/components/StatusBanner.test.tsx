import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { GameType } from '../../engine/index.ts';
import { StatusBanner } from './StatusBanner.tsx';

describe('StatusBanner galdiņš emphasis', () => {
  it('renders a distinctive, compact galdiņš badge (full explanation lives in the Table banner)', () => {
    const { container } = render(
      <StatusBanner
        phase="playing"
        current={1}
        gameType="galdins"
        soloist={null}
        isHumanTurn={false}
      />,
    );
    const badge = container.querySelector('.status-banner__galdins');
    expect(badge).not.toBeNull();
    expect(badge).toHaveTextContent(/galdiņš/i);
    // Emphasis is text-carried, not colour-only, for accessibility.
    expect(badge).toHaveTextContent(/no soloist/i);
    // The full "fewest tricks wins" sentence is NOT repeated here — it lives in the Table banner.
    expect(badge).not.toHaveTextContent(/fewest tricks/i);
  });

  it.each<GameType | null>(['zole', 'ordinary', null])(
    'does NOT render the galdiņš element for gameType=%s',
    (gameType) => {
      const { container } = render(
        <StatusBanner
          phase="playing"
          current={1}
          gameType={gameType}
          soloist={gameType === null ? null : 1}
          isHumanTurn={false}
        />,
      );
      expect(container.querySelector('.status-banner__galdins')).toBeNull();
      expect(screen.queryByText(/no soloist/i)).toBeNull();
    },
  );

  it('keeps phase, turn, game-type and dealer text for non-galdiņš games', () => {
    render(
      <StatusBanner
        phase="playing"
        current={1}
        gameType="zole"
        soloist={0}
        isHumanTurn={false}
        dealer={2}
      />,
    );
    const banner = screen.getByText(/Playing/);
    expect(banner).toHaveTextContent('Playing');
    expect(banner).toHaveTextContent('to act');
    expect(banner).toHaveTextContent('Zole');
    expect(banner).toHaveTextContent('Big: You');
    expect(banner).toHaveTextContent('Dealer: AI East');
  });

  it('does not append a plain "· Galdiņš" fragment to the status text', () => {
    render(
      <StatusBanner
        phase="playing"
        current={1}
        gameType="galdins"
        soloist={null}
        isHumanTurn={false}
      />,
    );
    const text = screen.getByText(/Playing/);
    expect(text.textContent).not.toContain('· Galdiņš');
  });
});
