const StatusBadge = ({ status }) => {
  if (status !== 'draft') return null;
  return <span className="character-status character-status--draft">Draft</span>;
};

const CharacterCard = ({ character, ownerLabel, isSelected, onSelect }) => {
  const avatar = character.avatarUrl || '/avatars/default.svg';
  const selectionValue = character.id ?? null;

  return (
    <div
      className={`character-manager__list-item picker-card ${isSelected ? 'is-selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onSelect(selectionValue)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(selectionValue);
        }
      }}
    >
      <div className="character-summary__top">
        <img src={avatar} alt={character.name} className="character-summary__avatar" />
        <div className="character-summary__heading-wrapper">
          <div className="character-summary__heading">
            <strong>{character.name}</strong>
          </div>
          <StatusBadge status={character.status} />
        </div>
      </div>
      <div className="character-summary__meta-row">
        <p className="character-summary__meta">{character.shortDescription || character.prompt}</p>
        <span className="character-summary__owner">By {ownerLabel}</span>
      </div>
    </div>
  );
};

const CharacterPicker = ({
  isOpen,
  owned = [],
  marketplace = [],
  selectedCharacterId,
  onSelect,
  onClose,
  onConfirm,
  isSubmitting,
  currentUserId,
  currentUsername,
}) => {
  if (!isOpen) return null;

  const getOwnerLabel = (character) => {
    if (character.ownerUserId && character.ownerUserId === currentUserId) {
      return currentUsername || 'You';
    }
    if (character.ownerUsername) {
      return character.ownerUsername;
    }
    return 'Mini Chatbot';
  };

  const handleBackdropClick = (event) => {
    if (event.target.classList.contains('character-picker')) {
      onClose();
    }
  };

  return (
    <div className="character-picker is-open" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="character-picker__panel">
        <header className="character-picker__header">
          <div>
            <h2>Choose a character</h2>
            <p>Start with one of your characters or pick from the marketplace.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close character picker">
            ×
          </button>
        </header>

        <div className="character-picker__groups">

          <section className="character-picker__section">
            <div className="character-picker__section-header">
              <div>
                <h3>Marketplace</h3>
              </div>
            </div>
            <div className="character-picker__grid">
              {[
                {
                  id: null,
                  name: 'Default assistant',
                  shortDescription: 'The default AI assistant.',
                  avatarUrl: '/avatars/default.svg',
                  status: null,
                  ownerUserId: null,
                  ownerUsername: 'Mini Chatbot',
                },
                ...marketplace,
              ].map((character) => (
                <CharacterCard
                  key={character.id || 'default-assistant'}
                  character={character}
                  ownerLabel={getOwnerLabel(character)}
                  isSelected={selectedCharacterId === character.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </section>

          <section className="character-picker__section">
            <div className="character-picker__section-header">
              <div>
                <h3>My characters</h3>
              </div>
            </div>
            {owned.length ? (
              <div className="character-picker__grid">
                {owned.map((character) => (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    ownerLabel="You"
                    isSelected={selectedCharacterId === character.id}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            ) : (
              <p className="character-meta">No characters yet. Create one in the manager.</p>
            )}
          </section>


        </div>

        <footer className="character-picker__footer">
          <button type="button" className="character-picker__primary" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Starting…' : 'Start chat'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CharacterPicker;
