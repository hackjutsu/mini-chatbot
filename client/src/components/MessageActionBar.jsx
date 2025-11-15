import { useEffect, useRef, useState } from 'react';

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M8 8V4.5A1.5 1.5 0 0 1 9.5 3h9A1.5 1.5 0 0 1 20 4.5v9A1.5 1.5 0 0 1 18.5 15H15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="4"
      y="8"
      width="11"
      height="13"
      rx="1.5"
      ry="1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M12 4l5 5h-3v6h-4V9H7l5-5z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 18h12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M5 13l4 4L19 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MessageActionBar = ({ message, onShare }) => {
  const [copyLabel, setCopyLabel] = useState('Copy');
  const resetTimerRef = useRef(null);
  const content = message?.content || '';
  const canInteract = Boolean(content);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const updateCopyLabel = (label, duration = 2000) => {
    setCopyLabel(label);
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    if (label !== 'Copy') {
      resetTimerRef.current = setTimeout(() => {
        setCopyLabel('Copy');
      }, duration);
    }
  };

  const handleCopy = async () => {
    if (!canInteract) return;
    try {
      if (typeof navigator === 'undefined' || !navigator?.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(content);
      updateCopyLabel('Copied', 2000);
    } catch (error) {
      console.warn('Unable to copy message', error);
      updateCopyLabel('Try again');
    }
  };

  const handleShare = () => {
    if (!canInteract || !onShare) return;
    onShare(message);
  };

  const isSuccess = copyLabel === 'Copied';
  const copyClassName = `message-action-btn${copyLabel !== 'Copy' ? ' is-feedback' : ''}`;

  return (
    <div className="message-action-bar" role="toolbar" aria-label="Message actions">
      <button
        type="button"
        className={copyClassName}
        onClick={handleCopy}
        disabled={!canInteract}
        aria-label={copyLabel}
        title={copyLabel}
      >
        <span className={`message-icon-stack${isSuccess ? ' is-success' : ''}`} aria-hidden="true">
          <span className={`message-icon-layer${!isSuccess ? ' is-visible' : ''}`}>
            <CopyIcon />
          </span>
          <span className={`message-icon-layer${isSuccess ? ' is-visible' : ''}`}>
            <CheckIcon />
          </span>
        </span>
        <span className="sr-only">{copyLabel}</span>
      </button>
      <button
        type="button"
        className="message-action-btn"
        onClick={handleShare}
        disabled={!canInteract}
        aria-label="Share message"
        title="Share message"
      >
        <ShareIcon />
        <span className="sr-only">Share message</span>
      </button>
    </div>
  );
};

export default MessageActionBar;
