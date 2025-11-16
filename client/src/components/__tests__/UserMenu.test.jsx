import { render, screen, fireEvent } from '@testing-library/react';
import UserMenu from '../UserMenu';

const defaultUser = { id: 'user-1', username: 'astro' };

describe('UserMenu', () => {
  it('closes the menu when user changes', () => {
    const { rerender } = render(<UserMenu user={defaultUser} onLogout={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /@astro/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    rerender(<UserMenu user={{ id: 'user-2', username: 'nova' }} onLogout={vi.fn()} />);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
