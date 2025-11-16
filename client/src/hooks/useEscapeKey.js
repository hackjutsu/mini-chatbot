import { useEffect, useRef } from 'react';

const escapeStack = [];
let isBound = false;

const bindListener = () => {
  if (isBound || typeof window === 'undefined') return;
  window.addEventListener('keydown', handleKeyDown);
  isBound = true;
};

const unbindListener = () => {
  if (!isBound || typeof window === 'undefined') return;
  window.removeEventListener('keydown', handleKeyDown);
  isBound = false;
};

const handleKeyDown = (event) => {
  if (event.key !== 'Escape' || !escapeStack.length) return;
  for (let index = escapeStack.length - 1; index >= 0; index -= 1) {
    const handler = escapeStack[index];
    if (typeof handler === 'function') {
      const handled = handler(event);
      if (handled !== false) {
        break;
      }
    }
  }
};

const addHandler = (handler) => {
  escapeStack.push(handler);
  bindListener();
  return () => {
    const idx = escapeStack.indexOf(handler);
    if (idx > -1) {
      escapeStack.splice(idx, 1);
    }
    if (!escapeStack.length) {
      unbindListener();
    }
  };
};

export const useEscapeKey = (handler, isActive = true) => {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!isActive || typeof handlerRef.current !== 'function') {
      return undefined;
    }

    const entry = (event) => handlerRef.current?.(event);
    return addHandler(entry);
  }, [isActive]);
};
