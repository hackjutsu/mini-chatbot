import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Composer from '../Composer';

describe('Composer', () => {
  it('submits trimmed message and clears input', () => {
    const handleSubmit = vi.fn();
    render(<Composer disabled={false} onSubmit={handleSubmit} placeholder="Say something" />);

    const textarea = screen.getByPlaceholderText('Say something');
    fireEvent.change(textarea, { target: { value: '  Hello world  ' } });
    fireEvent.submit(textarea.closest('form'));

    expect(handleSubmit).toHaveBeenCalledWith('Hello world');
    expect(textarea).toHaveValue('');
  });

  it('handles Enter submission and respects disabled state', async () => {
    const handleSubmit = vi.fn();
    render(<Composer disabled={false} onSubmit={handleSubmit} placeholder="Message" />);

    const textarea = screen.getByPlaceholderText('Message');
    await userEvent.type(textarea, 'Ping{enter}');
    expect(handleSubmit).toHaveBeenCalledWith('Ping');

    handleSubmit.mockClear();
    const { rerender } = render(
      <Composer disabled={false} onSubmit={handleSubmit} placeholder="Message" />
    );
    rerender(<Composer disabled onSubmit={handleSubmit} placeholder="Message" busyLabel="Sending…" />);
    const disabledButton = screen.getByRole('button', { name: 'Sending…' });
    expect(disabledButton).toBeDisabled();
  });
});
