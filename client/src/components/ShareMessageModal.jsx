import { useEffect, useMemo, useState } from 'react';

const ShareIcon = ({ children }) => (
  <div className="share-option-icon" aria-hidden="true">
    {children}
  </div>
);

const defaultShareTargets = [
  {
    id: 'copy',
    label: 'Copy link',
    type: 'copy',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24">
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
    ),
  },
  {
    id: 'x',
    label: 'Share to X',
    type: 'link',
    baseUrl: 'https://twitter.com/intent/tweet?',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          d="M4 4l16 16m0-16L4 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'Share to LinkedIn',
    type: 'link',
    baseUrl: 'https://www.linkedin.com/sharing/share-offsite/?',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          d="M6 9v9M6 6.01l.01-.011M10 9v9m0-7c0-1.1.9-2 2-2s2 .9 2 2v7m4 0v-7a4 4 0 0 0-7.82-1.09"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'reddit',
    label: 'Share to Reddit',
    type: 'link',
    baseUrl: 'https://www.reddit.com/submit?',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          d="M20 12c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="9" cy="12" r="1.25" fill="currentColor" />
        <circle cx="15" cy="12" r="1.25" fill="currentColor" />
        <path d="M9 16c1.2.9 4.8.9 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const ShareMessageModal = ({ isOpen, message, conversation, onClose }) => {
  const [linkLabel, setLinkLabel] = useState('Copy link');
  const shareText = message?.content || '';

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    if (conversation?.id) {
      url.searchParams.set('sessionId', conversation.id);
    }
    if (message?.id) {
      url.searchParams.set('messageId', message.id);
    }
    return url.toString();
  }, [conversation, message]);

  useEffect(() => {
    if (!isOpen) {
      setLinkLabel('Copy link');
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return () => {};
    const handleKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !message) {
    return null;
  }

  const openShareUrl = (base, params) => {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  const handleShareTarget = async (target) => {
    if (target.type === 'copy') {
      try {
        if (typeof navigator === 'undefined' || !navigator?.clipboard?.writeText) {
          throw new Error('Clipboard API unavailable');
        }
        await navigator.clipboard.writeText(shareUrl);
        setLinkLabel('Copied!');
      } catch (error) {
        console.warn('Failed to copy share link', error);
        setLinkLabel('Try again');
      }
      return;
    }

    if (target.type === 'link') {
      if (!shareUrl && !shareText) return;
      const encodedText = shareText.length > 160 ? `${shareText.slice(0, 157)}…` : shareText;
      if (target.id === 'x') {
        openShareUrl(target.baseUrl, {
          text: `${encodedText}\n${shareUrl}`,
        });
      } else if (target.id === 'linkedin') {
        openShareUrl(target.baseUrl, {
          url: shareUrl,
          summary: encodedText,
        });
      } else if (target.id === 'reddit') {
        openShareUrl(target.baseUrl, {
          url: shareUrl,
          title: encodedText || 'Check out this chat message',
        });
      }
    }
  };

  return (
    <div className="share-modal-overlay" role="dialog" aria-modal="true" aria-label="Share message">
      <div className="share-modal">
        <header className="share-modal-header">
          <div>
            <p className="share-label">Message action buttons</p>
            <h2>Share message</h2>
          </div>
          <button type="button" className="share-close-btn" onClick={onClose} aria-label="Close share dialog">
            ×
          </button>
        </header>
        <div className="share-preview">
          <p>{shareText}</p>
        </div>
        <div className="share-link">
          <code>{shareUrl}</code>
          <button type="button" onClick={() => handleShareTarget(defaultShareTargets[0])}>
            {linkLabel}
          </button>
        </div>
        <div className="share-options">
          {defaultShareTargets.slice(1).map((target) => (
            <button
              key={target.id}
              type="button"
              className="share-option"
              onClick={() => handleShareTarget(target)}
            >
              <ShareIcon>{target.icon}</ShareIcon>
              <span>{target.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShareMessageModal;
