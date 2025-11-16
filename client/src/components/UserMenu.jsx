import { useEffect, useRef, useState } from 'react';
import { useClickOutside } from '../hooks/useClickOutside.js';

const UserMenu = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  useClickOutside(menuRef, () => setIsOpen(false));
  useEffect(() => {
    setIsOpen(false);
  }, [user?.id, user?.username]);

  if (!user) {
    return null;
  }

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button
        type="button"
        className="pill user-pill"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>@{user.username}</span>
        <span className="pill-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {isOpen ? (
        <div className="user-menu" role="menu">
          <button type="button" onClick={() => onLogout()} role="menuitem">
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default UserMenu;
