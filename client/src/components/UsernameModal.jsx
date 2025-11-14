import { useEffect, useState } from 'react';

const UsernameModal = ({ isOpen, onSubmit, isBusy, error, patternHint }) => {
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUsername('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(username.trim());
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-panel">
        <h2>Pick a username</h2>
        <p>We use this to keep your chats, characters, and model preferences together.</p>
        <form onSubmit={handleSubmit} className="modal-form">
          <label htmlFor="username-field">Username</label>
          <input
            id="username-field"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="e.g. astro_dev"
            disabled={isBusy}
            autoComplete="off"
            minLength={3}
            maxLength={32}
            required
          />
          {patternHint ? <p className="field-hint">{patternHint}</p> : null}
          {error ? <p className="field-error">{error}</p> : null}
          <button type="submit" className="primary" disabled={isBusy || !username.trim()}>
            {isBusy ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsernameModal;
