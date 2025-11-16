import { render, fireEvent } from '@testing-library/react';
import CharacterManager from '../CharacterManager';
import CharacterFormModal from '../CharacterFormModal';

const defaultProps = {
  isOpen: true,
  owned: [],
  onClose: vi.fn(),
  onCreate: vi.fn(),
  onEdit: vi.fn(),
  onPublish: vi.fn(),
  onUnpublish: vi.fn(),
  onDelete: vi.fn(),
};

describe('CharacterManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('closes when Escape is pressed', () => {
    render(<CharacterManager {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('defers Escape to topmost modal before manager', () => {
    const managerClose = vi.fn();
    const formCancel = vi.fn();
    const view = render(
      <>
        <CharacterManager {...defaultProps} onClose={managerClose} />
        <CharacterFormModal
          isOpen
          onCancel={formCancel}
          onSubmit={vi.fn()}
          isSubmitting={false}
          mode="create"
          initialValues={{ name: '', shortDescription: '', prompt: '', avatarUrl: '/avatars/default.svg' }}
        />
      </>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(formCancel).toHaveBeenCalledTimes(1);
    expect(managerClose).not.toHaveBeenCalled();

    view.rerender(
      <>
        <CharacterManager {...defaultProps} onClose={managerClose} />
        <CharacterFormModal
          isOpen={false}
          onCancel={formCancel}
          onSubmit={vi.fn()}
          isSubmitting={false}
          mode="create"
          initialValues={{ name: '', shortDescription: '', prompt: '', avatarUrl: '/avatars/default.svg' }}
        />
      </>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(managerClose).toHaveBeenCalledTimes(1);
  });
});
