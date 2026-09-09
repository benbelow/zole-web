import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameControls } from './GameControls.tsx';

describe('GameControls', () => {
  it('disables Deal next round unless the round is over', () => {
    const { rerender } = render(
      <GameControls isRoundOver={false} seed={42} onDealNext={() => {}} onNewGame={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Deal next round' })).toBeDisabled();
    rerender(
      <GameControls isRoundOver seed={42} onDealNext={() => {}} onNewGame={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Deal next round' })).toBeEnabled();
  });

  it('keeps New game always enabled', () => {
    render(<GameControls isRoundOver={false} seed={1} onDealNext={() => {}} onNewGame={() => {}} />);
    expect(screen.getByRole('button', { name: 'New game' })).toBeEnabled();
  });

  it('fires both callbacks and shows the seed', async () => {
    const onDealNext = vi.fn();
    const onNewGame = vi.fn();
    render(
      <GameControls isRoundOver seed={99} onDealNext={onDealNext} onNewGame={onNewGame} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Deal next round' }));
    await userEvent.click(screen.getByRole('button', { name: 'New game' }));
    expect(onDealNext).toHaveBeenCalledTimes(1);
    expect(onNewGame).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Seed: 99')).toBeInTheDocument();
  });
});
