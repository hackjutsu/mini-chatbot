import { render, screen, fireEvent } from '@testing-library/react';
import SessionList from '../SessionList';

const baseSessions = [
  { id: 's1', title: 'Chat One', messageCount: 0, character: null },
  { id: 's2', title: 'Chat Two', messageCount: 5, character: { name: 'Nova' } },
];

describe('SessionList', () => {
  const defaultProps = {
    sessions: baseSessions,
    activeSessionId: 's1',
    onSelect: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows sessions and highlights active one', () => {
    render(<SessionList {...defaultProps} />);
    expect(screen.getByText('Chat One')).toBeInTheDocument();
    expect(screen.getByText('Chat Two')).toBeInTheDocument();
    expect(screen.getByText('Chat One').closest('button')).toHaveClass('session-select');
  });

  it('calls onSelect when clicking session button', () => {
    render(<SessionList {...defaultProps} />);
    fireEvent.click(screen.getByText('Chat Two'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith('s2');
  });

  it('opens action menu and triggers delete', () => {
    render(<SessionList {...defaultProps} />);
    fireEvent.click(screen.getAllByRole('button', { name: '⋯' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(defaultProps.onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 's1' }));
  });
});
