import { render, screen, fireEvent } from '@testing-library/react';
import ModelSelector from '../ModelSelector';

describe('ModelSelector', () => {
  it('opens menu and calls onSelect when picking a new model', () => {
    const handleSelect = vi.fn();
    render(
      <ModelSelector
        models={['model-a', 'model-b']}
        selectedModel="model-a"
        onSelect={handleSelect}
        isLoading={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /model: model-a/i }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'model-b' }));

    expect(handleSelect).toHaveBeenCalledWith('model-b');
  });

  it('disables trigger while loading', () => {
    render(
      <ModelSelector
        models={['model-a']}
        selectedModel="model-a"
        onSelect={() => {}}
        isLoading
      />
    );

    expect(screen.getByRole('button', { name: /model/i })).toBeDisabled();
  });
});
