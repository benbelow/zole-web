import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeSwitcher } from './ThemeSwitcher.tsx';

describe('ThemeSwitcher', () => {
  it('renders a chip per theme and marks the active one', () => {
    render(<ThemeSwitcher theme="neon" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Neon Holo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Aerospace' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Classic Felt' })).toBeInTheDocument();
  });

  it('calls onChange with the chosen theme id', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ThemeSwitcher theme="neon" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Aerospace' }));
    expect(onChange).toHaveBeenCalledWith('aerospace');
  });
});
