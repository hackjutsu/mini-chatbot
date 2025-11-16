import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import CharacterPicker from '../CharacterPicker';

const owned = [
  {
    id: 'owned-1',
    name: 'Nova',
    prompt: 'Explorer',
    avatarUrl: '/avatars/nova.svg',
    status: 'draft',
    ownerUserId: 'me',
    ownerUsername: 'me',
  },
];

const marketplace = [
  {
    id: 'market-1',
    name: 'Chef',
    prompt: 'Cook things',
    avatarUrl: '/avatars/lumi.svg',
    status: 'published',
    ownerUserId: 'other',
    ownerUsername: 'Chef Creator',
  },
];

const defaultProps = {
  isOpen: true,
  owned,
  marketplace,
  selectedCharacterId: null,
  onSelect: vi.fn(),
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  isSubmitting: false,
  currentUserId: 'me',
  currentUsername: 'me',
};

describe('CharacterPicker', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('allows selecting a character and confirming', () => {
    render(<CharacterPicker {...defaultProps} />);

    const ownedButton = screen.getAllByRole('button', { name: /Nova/ })[0];
    fireEvent.click(ownedButton);
    expect(defaultProps.onSelect).toHaveBeenCalledWith('owned-1');

    fireEvent.click(screen.getByRole('button', { name: /Start chat/i }));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('closes when pressing escape', () => {
    render(<CharacterPicker {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

});
