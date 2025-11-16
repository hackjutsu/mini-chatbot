import { useEscapeKey } from '../hooks/useEscapeKey.js';

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
      <div className="character-summary__meta-row">
        <p className="character-summary__meta">{character.shortDescription || 'No description yet.'}</p>
      </div>
    </div>
  );
};

const CharacterManager = ({ isOpen, owned = [], onClose, onCreate, onEdit, onPublish, onUnpublish, onDelete }) => {
  useEscapeKey(() => onClose?.(), isOpen);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop character-manager" role="dialog" aria-modal="true">
      <div className="modal-panel character-manager__panel">
        <div className="character-manager__header">
          <div>
            <h2>Character manager</h2>
            <p>Manage your characters you own. Publish them when they’re ready.</p>
          </div>
          <button type="button" className="modal-close-btn" aria-label="Close character manager" onClick={onClose}>
            ×
          </button>
        </div>

        <section className="character-manager__section">
          {owned.length ? (
            <div className="character-manager__list">
              {owned.map((character) => (
                <div key={character.id} className="character-manager__list-item">
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
                    <button type="button" className="is-danger" onClick={() => onDelete(character)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="character-manager__empty">No characters yet. Create one to get started.</p>
            )}
        </section>
        <div className="character-manager__footer">
          <div className="character-manager__footer-actions">
            <button type="button" className="primary" onClick={onCreate}>
              Create character
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterManager;
