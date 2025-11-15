const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3 11.5L3.8 8.2L9.9 2.1C10.3 1.7 10.9 1.7 11.3 2.1L13.9 4.7C14.3 5.1 14.3 5.7 13.9 6.1L7.8 12.2L4.5 13L3 11.5Z"
      stroke="#475467"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.5 4.5H12.5M6 4.5V3.5C6 3.22386 6.22386 3 6.5 3H9.5C9.77614 3 10 3.22386 10 3.5V4.5M5 4.5V12.5C5 12.7761 5.22386 13 5.5 13H10.5C10.7761 13 11 12.7761 11 12.5V4.5"
      stroke="#475467"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M6.5 6.5V11" stroke="#475467" strokeWidth="1" strokeLinecap="round" />
    <path d="M9.5 6.5V11" stroke="#475467" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

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
            <img src="/avatars/default.svg" alt="Default assistant" className="character-avatar" />
            <div>
              <strong>Default assistant</strong>
              <p className="character-meta">The default AI assistant.</p>
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
                <img src="/avatars/default.svg" alt="Default assistant" className="character-avatar" />
              )}
              <div className="character-details">
                <strong>{character.name}</strong>
                <p className="character-meta character-meta--clamped">{character.prompt}</p>
              </div>
              <div className="character-row-actions">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Edit character"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(character);
                  }}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Delete character"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(character);
                  }}
                >
                  <DeleteIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <footer className="character-picker__footer">
          <button type="button" className="new-chat-btn" onClick={onCreate}>
            Create character
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
