const StatusBadge = ({ status }) => {
  if (status !== 'draft') return null;
  return <span className="character-status character-status--draft">Draft</span>;
};

const CharacterSummary = ({ character }) => {
  const avatar = character.avatarUrl || '/avatars/default.svg';
  return (
    <div className="character-summary">
      <div className="character-summary__top">
        <img src={avatar} alt={character.name} className="character-summary__avatar" />
        <div className="character-summary__heading-wrapper">
          <div className="character-summary__heading">
            <strong>{character.name}</strong>
          </div>
          <StatusBadge status={character.status} />
        </div>
      </div>
      <p className="character-summary__meta">{character.shortDescription || 'No description yet.'}</p>
    </div>
  );
};

const CharacterManager = ({
  isOpen,
  owned = [],
  pinned = [],
  published = [],
  onClose,
  onCreate,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
  onPin,
  onUnpin,
}) => {
  if (!isOpen) return null;

  const pinnedIds = new Set(pinned.map((entry) => entry.id));
  const ownedIds = new Set(owned.map((entry) => entry.id));

  return (
    <div className="modal-backdrop character-manager" role="dialog" aria-modal="true">
      <div className="modal-panel character-manager__panel">
        <div className="modal-header">
          <h2>Character manager</h2>
          <button type="button" className="modal-close-btn" aria-label="Close character manager" onClick={onClose}>
            ×
          </button>
        </div>

        <section className="character-manager__section">
          <header className="character-manager__section-header">
            <div>
              <h3>My characters</h3>
              <p>Draft and published personas you own.</p>
            </div>
            <button type="button" className="primary" onClick={onCreate}>
              Create character
            </button>
          </header>
          {owned.length ? (
            <ul className="character-manager__list">
              {owned.map((character) => (
                <li key={character.id} className="character-manager__list-item">
                  <CharacterSummary character={character} />
                  <div className="character-manager__actions">
                    <button type="button" onClick={() => onEdit(character)}>
                      Edit
                    </button>
                    {character.status === 'published' ? (
                      <button type="button" onClick={() => onUnpublish(character)}>
                        Unpublish
                      </button>
                    ) : (
                      <button type="button" onClick={() => onPublish(character)}>
                        Publish
                      </button>
                    )}
                    <button type="button" onClick={() => onDelete(character)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="character-manager__empty">No characters yet. Create one to get started.</p>
          )}
        </section>

        <section className="character-manager__section">
          <header className="character-manager__section-header">
            <div>
              <h3>Pinned characters</h3>
              <p>Personas available in your picker.</p>
            </div>
          </header>
          {pinned.length ? (
            <ul className="character-manager__list">
              {pinned.map((character) => (
                <li key={character.id} className="character-manager__list-item">
                  <CharacterSummary character={character} />
                  <div className="character-manager__actions">
                    <button type="button" onClick={() => onUnpin(character)}>
                      Unpin
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="character-manager__empty">Pin characters to use them across chats.</p>
          )}
        </section>

        <section className="character-manager__section">
          <header className="character-manager__section-header">
            <div>
              <h3>Published library</h3>
              <p>Pin a published persona to add it to your picker.</p>
            </div>
          </header>
          {published.length ? (
            <ul className="character-manager__list">
              {published.map((character) => (
                <li key={character.id} className="character-manager__list-item">
                  <CharacterSummary character={character} />
                  <div className="character-manager__actions">
                    {pinnedIds.has(character.id) || ownedIds.has(character.id) ? (
                      <span className="character-manager__note">Already in your list</span>
                    ) : (
                      <button type="button" onClick={() => onPin(character)}>
                        Pin to picker
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="character-manager__empty">No published characters yet.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default CharacterManager;
