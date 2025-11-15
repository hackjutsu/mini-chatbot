import { render, screen, fireEvent } from '@testing-library/react';
import CharacterPicker from '../CharacterPicker';

const characters = [
  { id: 'char-1', name: 'Nova', prompt: 'Explorer', avatarUrl: '/avatars/nova.svg' },
];

const defaultProps = {
  isOpen: true,
  characters,
  selectedCharacterId: null,
  onSelect: vi.fn(),
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  onCreate: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
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

  it('invokes edit and delete buttons without triggering parent selection', () => {
    render(<CharacterPicker {...defaultProps} />);

    fireEvent.click(screen.getByLabelText(/Edit character/i));
    expect(defaultProps.onEdit).toHaveBeenCalledWith(characters[0]);

    fireEvent.click(screen.getByLabelText(/Delete character/i));
    expect(defaultProps.onDelete).toHaveBeenCalledWith(characters[0]);
  });
});
