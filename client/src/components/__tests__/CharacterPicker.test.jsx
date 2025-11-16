import { render, screen, fireEvent } from '@testing-library/react';
import CharacterPicker from '../CharacterPicker';

const characters = [
  { id: 'char-1', name: 'Nova', prompt: 'Explorer', avatarUrl: '/avatars/nova.svg', status: 'published' },
];

const defaultProps = {
  isOpen: true,
  characters,
  pinnedCharacters: characters,
  ownedCharacters: [],
  selectedCharacterId: null,
  onSelect: vi.fn(),
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  onManage: vi.fn(),
  isSubmitting: false,
};

describe('CharacterPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows selecting a character and confirming', () => {
    render(<CharacterPicker {...defaultProps} />);

    fireEvent.click(screen.getByText('Nova'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith('char-1');

    fireEvent.click(screen.getByRole('button', { name: /Start chat/i }));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('surfaces manager CTA', () => {
    render(<CharacterPicker {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Open character manager/i }));
    expect(defaultProps.onManage).toHaveBeenCalled();
  });
});
