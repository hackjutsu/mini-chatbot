import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Composer from '../Composer';

describe('Composer', () => {
  it('submits trimmed message and clears input', async () => {
    const handleSubmit = vi.fn();
    render(<Composer disabled={false} onSubmit={handleSubmit} placeholder="Say something" />);

    const textarea = screen.getByPlaceholderText('Say something');
    await userEvent.type(textarea, 'Hello world');
    fireEvent.submit(textarea.closest('form'));

    expect(handleSubmit).toHaveBeenCalledWith('Hello world');
    expect(textarea).toHaveValue('');
  });

  it('shows busy label when disabled', () => {
    render(<Composer disabled onSubmit={() => {}} placeholder="Say" busyLabel="Sending…" />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Sending…');
  });
});
