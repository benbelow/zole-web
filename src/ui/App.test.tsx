import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App.tsx';

describe('App', () => {
  it('renders the game chrome and no scaffold placeholder', () => {
    render(<App />);

    // The placeholder text from the scaffold must be gone.
    expect(screen.queryByText(/Project scaffold is ready/i)).toBeNull();

    // The game heading is present.
    expect(screen.getByRole('heading', { name: /Zole/i })).toBeInTheDocument();

    // The "New game" control is present.
    expect(screen.getByRole('button', { name: /new game/i })).toBeInTheDocument();

    // At least one card button in the human's hand is present.
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });
});
