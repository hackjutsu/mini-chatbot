const StatusBadge = ({ character }) => {
  if (!character?.status || character.status === 'draft') {
    return <span className="character-meta-badge">Draft</span>;
  }
  return <span className="character-meta-badge character-meta-badge--published">Published</span>;
};

const CharacterPicker = ({
  isOpen,
  characters = [],
  pinnedCharacters = [],
  ownedCharacters = [],
  selectedCharacterId,
  onSelect,
  onClose,
  onConfirm,
  onManage,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  const pinnedIds = new Set(pinnedCharacters.map((entry) => entry.id));
  const ownedIds = new Set(ownedCharacters.map((entry) => entry.id));

  const decorated = characters.map((character) => ({
    ...character,
    isPinned: pinnedIds.has(character.id),
    isOwned: ownedIds.has(character.id),
  }));
  const pinnedList = decorated.filter((character) => character.isPinned);
  const ownedList = decorated.filter((character) => !character.isPinned && character.isOwned);

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
            <h2>Pick someone to chat with</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close character picker"
          >
            ×
          </button>
        </header>
        <div className="character-picker__groups">
          <div className="character-picker__group">
            <h3>Default</h3>
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
            </ul>
          </div>

          <div className="character-picker__group">
            <h3>Pinned 3rd-party characters</h3>
            {pinnedList.length ? (
              <ul className="character-list">
                {pinnedList.map((character) => (
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
                      <img src="/avatars/default.svg" alt={character.name} className="character-avatar" />
                    )}
                    <div className="character-details">
                      <strong>{character.name}</strong>
                      <p className="character-meta character-meta--clamped">
                        {character.shortDescription || character.prompt}
                      </p>
                    </div>
                    <StatusBadge character={character} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="character-meta">Pin characters to make them appear here.</p>
            )}
          </div>

          <div className="character-picker__group">
            <h3>My characters</h3>
            {ownedList.length ? (
              <ul className="character-list">
                {ownedList.map((character) => (
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
                      <img src="/avatars/default.svg" alt={character.name} className="character-avatar" />
                    )}
                    <div className="character-details">
                      <strong>{character.name}</strong>
                      <p className="character-meta character-meta--clamped">
                        {character.shortDescription || character.prompt}
                      </p>
                    </div>
                    <StatusBadge character={character} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="character-meta">Draft characters that you own will appear here.</p>
            )}
          </div>
        </div>
        <footer className="character-picker__footer">
          <button type="button" className="character-picker__secondary" onClick={onManage}>
            Open character manager
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
