import { render, screen, fireEvent } from '@testing-library/react';
import UsernameModal from '../UsernameModal';

describe('UsernameModal', () => {
  it('submits trimmed username and resets when reopened', () => {
    const handleSubmit = vi.fn();
    const { rerender } = render(
      <UsernameModal isOpen onSubmit={handleSubmit} isBusy={false} patternHint="hint" />
    );

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: '  astro_dev  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    expect(handleSubmit).toHaveBeenCalledWith('astro_dev');

    rerender(<UsernameModal isOpen={false} onSubmit={handleSubmit} isBusy={false} />);
    rerender(<UsernameModal isOpen onSubmit={handleSubmit} isBusy={false} />);
    expect(screen.getByLabelText(/Username/i)).toHaveValue('');
  });

  it('disables submit button when busy or empty', () => {
    const { rerender } = render(<UsernameModal isOpen onSubmit={() => {}} isBusy error="oops" />);
    expect(screen.getByRole('button', { name: /Saving/i })).toBeDisabled();
    expect(screen.getByText('oops')).toBeInTheDocument();

    rerender(<UsernameModal isOpen onSubmit={() => {}} isBusy={false} />);
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });
});
