import { useEffect, useState } from 'react';

const formatMessageCount = (count = 0) => {
  if (!count) return 'Empty';
  return `${count} message${count === 1 ? '' : 's'}`;
};

const SessionList = ({
  sessions,
  activeSessionId,
  onSelect,
  onRename,
  onDelete,
  isLoading,
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const handle = (event) => {
      if (event.target.closest('[data-session-menu]')) {
        return;
      }
      setOpenMenuId(null);
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, []);

  if (isLoading) {
    return <p className="session-meta">Loading chats…</p>;
  }

  if (!sessions.length) {
    return <p className="session-meta">No chats yet. Start a new one.</p>;
  }

  return (
    <ul className="session-list">
      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        const hasCharacter = Boolean(session.character);
        const isMenuOpen = openMenuId === session.id;
        const itemClasses = ['session-item'];
        if (isActive) itemClasses.push('is-active');
        if (isMenuOpen) itemClasses.push('session-item--menu-open');
        return (
          <li key={session.id} className={itemClasses.join(' ')}>
            <button
              type="button"
              className="session-select"
              onClick={() => onSelect(session.id)}
            >
              <span className="session-title">{session.title}</span>
              <span className="session-meta">{formatMessageCount(session.messageCount)}</span>
              {hasCharacter ? (
                <span className="session-character-chip">
                  {session.character?.avatarUrl ? (
                    <img
                      src={session.character.avatarUrl}
                      alt={session.character.name}
                      className="session-character-chip-avatar"
                    />
                  ) : (
                    <span className="session-character-chip-avatar">
                      {session.character?.name?.slice(0, 1)?.toUpperCase() || '•'}
                    </span>
                  )}
                  <span className="session-character-chip-label">
                    {session.character?.name || 'No character'}
                  </span>
                </span>
              ) : null}
            </button>
            <div className="session-actions" data-session-menu>
              <button
                type="button"
                className="session-action-btn"
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
                onClick={() =>
                  setOpenMenuId((current) => (current === session.id ? null : session.id))
                }
              >
                ⋯
              </button>
              {isMenuOpen ? (
                <div className="session-menu" role="menu">
                  <button
                    type="button"
                    className="session-menu-item"
                    onClick={() => {
                      setOpenMenuId(null);
                      onRename(session);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="session-menu-item is-danger"
                    onClick={() => {
                      setOpenMenuId(null);
                      onDelete(session);
                    }}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default SessionList;
