import { useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey.js';

const StatusBadge = ({ status }) => {
  if (status !== 'draft') return null;
  return <span className="character-status character-status--draft">Draft</span>;
};

const CharacterCard = ({ character, ownerLabel, isSelected, onSelect }) => {
  const avatar = character.avatarUrl || '/avatars/default.svg';
  const selectionValue = character.id ?? null;
  const summary = character.shortDescription?.trim();
  const description = summary || 'No description yet.';

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
        <p className="character-summary__meta">{description}</p>
      </div>
      <div className="character-summary__footer">
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
  const [sectionsOpen, setSectionsOpen] = useState({ marketplace: true, owned: true });
  useEscapeKey(() => onClose?.(), isOpen);

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

  const toggleSection = (key) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const SectionToggle = ({ id, title, isOpen: sectionOpen, onToggle }) => (
    <button
      type="button"
      className="character-picker__section-toggle"
      aria-expanded={sectionOpen}
      aria-controls={id}
      onClick={onToggle}
    >
      <span>{title}</span>
      <span className="character-picker__caret" aria-hidden="true">
        {sectionOpen ? '▾' : '▸'}
      </span>
    </button>
  );

  return (
    <div className="character-picker is-open" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="character-picker__panel">
        <header className="character-picker__header">
          <div>
            <h2>Choose a character</h2>
            <p> Pick a character from the marketplace, or from your library.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close character picker">
            ×
          </button>
        </header>

        <div className="character-picker__groups">

          <section
            className={`character-picker__section character-picker__section--marketplace${sectionsOpen.marketplace ? '' : ' character-picker__section--collapsed'}`}
          >
            <div className="character-picker__section-header">
              <SectionToggle
                id="character-picker-marketplace"
                title="Marketplace"
                isOpen={sectionsOpen.marketplace}
                onToggle={() => toggleSection('marketplace')}
              />
            </div>
            <div
              className={`character-picker__section-body${sectionsOpen.marketplace ? '' : ' is-collapsed'}`}
              id="character-picker-marketplace"
              aria-hidden={!sectionsOpen.marketplace}
            >
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
            </div>
          </section>

          <section
            className={`character-picker__section${sectionsOpen.owned ? '' : ' character-picker__section--collapsed'}`}
          >
            <div className="character-picker__section-header">
              <SectionToggle
                id="character-picker-owned"
                title="My characters"
                isOpen={sectionsOpen.owned}
                onToggle={() => toggleSection('owned')}
              />
            </div>
            <div
              className={`character-picker__section-body${sectionsOpen.owned ? '' : ' is-collapsed'}`}
              id="character-picker-owned"
              aria-hidden={!sectionsOpen.owned}
            >
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
            </div>
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
