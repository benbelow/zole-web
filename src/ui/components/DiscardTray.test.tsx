import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Card } from '../../engine/index.ts';
import { DiscardTray } from './DiscardTray.tsx';

const a: Card = { rank: 'A', suit: 'clubs' };
const b: Card = { rank: '10', suit: 'spades' };
const c: Card = { rank: 'K', suit: 'hearts' };

describe('DiscardTray', () => {
  it('disables confirm until exactly two are selected', () => {
    const { rerender } = render(
      <DiscardTray cards={[a, b, c]} selected={[]} onToggle={() => {}} onConfirm={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Discard 2' })).toBeDisabled();

    rerender(
      <DiscardTray cards={[a, b, c]} selected={[a]} onToggle={() => {}} onConfirm={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Discard 2' })).toBeDisabled();

    rerender(
      <DiscardTray cards={[a, b, c]} selected={[a, b]} onToggle={() => {}} onConfirm={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Discard 2' })).toBeEnabled();
  });

  it('calls onConfirm when confirm clicked with two selected', async () => {
    const onConfirm = vi.fn();
    render(
      <DiscardTray cards={[a, b, c]} selected={[a, b]} onToggle={() => {}} onConfirm={onConfirm} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Discard 2' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
