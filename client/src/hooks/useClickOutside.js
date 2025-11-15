import { useEffect } from 'react';

export const useClickOutside = (ref, handler) => {
  useEffect(() => {
    if (!handler) return () => {};
    const handle = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [handler, ref]);
};
