import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CardPointsPill } from './CardPointsPill.tsx';

describe('CardPointsPill', () => {
  it('renders the points with a pts suffix', () => {
    render(<CardPointsPill points={47} />);
    expect(screen.getByText('47 pts')).toBeInTheDocument();
  });

  it('exposes an accessible label', () => {
    render(<CardPointsPill points={0} />);
    expect(screen.getByLabelText('Card points taken 0')).toBeInTheDocument();
  });
});
