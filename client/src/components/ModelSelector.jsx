import { useRef, useState } from 'react';
import { useClickOutside } from '../hooks/useClickOutside.js';

const ModelSelector = ({ models, selectedModel, disabled, onSelect, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  useClickOutside(wrapperRef, () => setIsOpen(false));

  const canInteract = !disabled && (models?.length ?? 0) > 0;

  const handleSelect = (model) => {
    setIsOpen(false);
    if (model && model !== selectedModel) {
      onSelect(model);
    }
  };

  return (
    <div className="model-menu-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="pill model-pill"
        aria-haspopup="true"
        aria-expanded={isOpen}
        disabled={!canInteract || isLoading}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {selectedModel ? `Model: ${selectedModel}` : 'Choose a model'}
        <span aria-hidden="true">▾</span>
      </button>
      {isOpen ? (
        <div className="model-menu" role="menu">
          {models?.length ? (
            models.map((model) => (
              <button
                type="button"
                key={model}
                role="menuitemradio"
                aria-checked={selectedModel === model}
                className={selectedModel === model ? 'is-active' : ''}
                onClick={() => handleSelect(model)}
              >
                <span>{model}</span>
                {selectedModel === model ? <span className="menu-check">●</span> : null}
              </button>
            ))
          ) : (
            <p className="session-meta">No models available.</p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default ModelSelector;
