import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BiddingControls } from './BiddingControls.tsx';

describe('BiddingControls', () => {
  it('renders only the legal bids', () => {
    render(<BiddingControls legalBids={['pickup', 'pass']} onBid={() => {}} />);
    expect(screen.getByRole('button', { name: 'Pick up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pass' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Zole' })).not.toBeInTheDocument();
  });

  it('calls onBid with the corresponding action', async () => {
    const onBid = vi.fn();
    render(<BiddingControls legalBids={['pickup', 'zole', 'pass']} onBid={onBid} />);
    await userEvent.click(screen.getByRole('button', { name: 'Zole' }));
    expect(onBid).toHaveBeenCalledWith('zole');
  });
});
