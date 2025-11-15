import { useState } from 'react';

const Composer = ({ disabled, onSubmit, placeholder, busyLabel }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = value.trim();
    if (!next || disabled) return;
    onSubmit(next);
    setValue('');
  };

  const handleKeyDown = (event) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.altKey &&
      !event.ctrlKey
    ) {
      event.preventDefault();
      if (!disabled) {
        handleSubmit(event);
      }
    }
  };

  return (
    <form className="chat-form" onSubmit={handleSubmit}>
      <div className="composer-wrapper">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required
        />
        <button type="submit" className="chat-submit" disabled={disabled || !value.trim()}>
          {disabled ? busyLabel || '…' : '↑'}
        </button>
      </div>
    </form>
  );
};

export default Composer;
