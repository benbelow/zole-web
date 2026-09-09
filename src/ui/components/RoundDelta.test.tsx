import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoundDelta } from './RoundDelta.tsx';

describe('RoundDelta', () => {
  it('prefixes positive deltas with a plus and uses pos styling', () => {
    const { container } = render(<RoundDelta delta={4} />);
    const el = container.querySelector('.round-delta');
    expect(el).toHaveTextContent('+4');
    expect(el).toHaveClass('round-delta--pos');
  });

  it('renders negative deltas with their sign and neg styling', () => {
    const { container } = render(<RoundDelta delta={-6} />);
    const el = container.querySelector('.round-delta');
    expect(el).toHaveTextContent('-6');
    expect(el).toHaveClass('round-delta--neg');
  });

  it('renders zero without a sign and uses zero styling', () => {
    const { container } = render(<RoundDelta delta={0} />);
    const el = container.querySelector('.round-delta');
    expect(el).toHaveTextContent('0');
    expect(el).toHaveClass('round-delta--zero');
  });

  it('exposes an accessible status label', () => {
    const { getByRole } = render(<RoundDelta delta={3} />);
    expect(getByRole('status')).toHaveAttribute('aria-label', 'Round score +3');
  });
});
