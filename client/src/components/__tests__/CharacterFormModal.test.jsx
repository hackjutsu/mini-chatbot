import { render, screen, fireEvent } from '@testing-library/react';
import CharacterFormModal from '../CharacterFormModal';

const baseProps = {
  isOpen: true,
  mode: 'create',
  initialValues: { name: 'Nova', shortDescription: 'Explorer', prompt: 'Explorer', avatarUrl: '/avatars/nova.svg' },
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  isSubmitting: false,
  error: '',
};

describe('CharacterFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefills inputs and submits trimmed data', () => {
    render(<CharacterFormModal {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: '  Nova  ' } });
    fireEvent.change(screen.getByLabelText(/Short description/i), { target: { value: '  Spark  ' } });
    fireEvent.change(screen.getByLabelText(/Background/i), { target: { value: '  Explorer  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    expect(baseProps.onSubmit).toHaveBeenCalledWith({
      name: 'Nova',
      shortDescription: 'Spark',
      prompt: 'Explorer',
      avatarUrl: '/avatars/nova.svg',
    });
  });

  it('allows choosing a different avatar option', () => {
    render(<CharacterFormModal {...baseProps} />);
    const avatarInputs = screen.getAllByRole('radio');
    fireEvent.click(avatarInputs[1]);
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    expect(baseProps.onSubmit).toHaveBeenCalledWith({
      name: 'Nova',
      shortDescription: 'Explorer',
      prompt: 'Explorer',
      avatarUrl: avatarInputs[1].value,
    });
  });
});
