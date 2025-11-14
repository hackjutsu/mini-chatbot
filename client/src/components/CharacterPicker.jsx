const CharacterPicker = ({
  isOpen,
  characters,
  selectedCharacterId,
  onSelect,
  onClose,
  onConfirm,
  onCreate,
  onEdit,
  onDelete,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  const handleSelect = (value) => {
    onSelect(value === 'none' ? null : value);
  };

  const handleBackdropClick = (event) => {
    if (event.target.classList.contains('character-picker')) {
      onClose();
    }
  };

  return (
    <div
      className="character-picker is-open"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="character-picker__panel">
        <header className="character-picker__header">
          <div>
            <h2>Choose a character</h2>
            <p>Start with a persona or keep the default assistant voice.</p>
          </div>
          <button
            type="button"
            className="character-picker__close"
            onClick={onClose}
            aria-label="Close character picker"
          >
            ×
          </button>
        </header>
        <ul className="character-list">
          <li className="character-row" onClick={() => handleSelect('none')}>
            <input
              type="radio"
              name="character"
              checked={!selectedCharacterId}
              onChange={() => handleSelect('none')}
            />
            <div className="character-avatar">—</div>
            <div>
              <strong>Default assistant</strong>
              <p className="character-meta">Keep the base system prompt.</p>
            </div>
          </li>
          {characters.map((character) => (
            <li key={character.id} className="character-row" onClick={() => handleSelect(character.id)}>
              <input
                type="radio"
                name="character"
                checked={selectedCharacterId === character.id}
                onChange={() => handleSelect(character.id)}
              />
              {character.avatarUrl ? (
                <img src={character.avatarUrl} alt={character.name} className="character-avatar" />
              ) : (
                <div className="character-avatar">
                  {character.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <strong>{character.name}</strong>
                <p className="character-meta">{character.prompt}</p>
              </div>
              <div className="character-row-actions">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(character);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(character);
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        <footer className="character-picker__footer">
          <button type="button" className="new-chat-btn" onClick={onCreate}>
            + Create character
          </button>
          <button
            type="button"
            className="character-picker__primary"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Starting…' : 'Start chat'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CharacterPicker;
