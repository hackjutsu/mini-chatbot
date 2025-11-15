import { useEffect, useMemo } from 'react';

const ShareIcon = ({ children }) => (
  <div className="share-option-icon" aria-hidden="true">
    {children}
  </div>
);

const defaultShareTargets = [
  {
    id: 'x',
    label: 'X',
    type: 'link',
    baseUrl: 'https://twitter.com/intent/tweet?',
    icon: (
      <svg width="20" height="20" viewBox="0 0 512 512">
        <path
          d="M389.6 48H470l-175 199.5L512 464H355.6L231.1 318.6 88.6 464H8.4l187.3-213.5L0 48h162.4l109.9 132.2L389.6 48zm-57.5 374.6h45.7L183.3 90.1h-49L332.1 422.6z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    type: 'link',
    baseUrl: 'https://www.linkedin.com/sharing/share-offsite/?',
    icon: (
      <svg width="20" height="20" viewBox="0 0 448 512">
        <path
          d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.72 0 54.05a53.79 53.79 0 1 1 107.58 0c0 29.67-24.09 54.05-53.79 54.05zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: 'reddit',
    label: 'Reddit',
    type: 'link',
    baseUrl: 'https://www.reddit.com/submit?',
    icon: (
      <svg width="20" height="20" viewBox="0 0 512 512">
        <path
          d="M440.6 203.5c-15.1 0-28.9 5.9-39.4 15.4-39-27.6-90.5-45.4-147.5-47.5l30.1-134.2 93.2 20.9c0 21.5 17.5 39 39 39 21.6 0 39.1-17.5 39.1-39.1s-17.5-39-39.1-39c-15.1 0-28.1 8.9-34.4 21.8l-104.3-23.4c-4.9-1.2-9.9 2.1-11.1 7l-33.4 148c-59.4 1.6-113.4 19.5-154.1 47.5-10-9.8-23.7-15.9-38.8-15.9C32 203.5 7.6 227.9 7.6 258.2c0 30.2 24.4 54.6 54.7 54.6 5.7 0 11.2-.9 16.3-2.4 0 1 0 2.1-.1 3.1 0 84.7 94.9 153.5 212 153.5 117 0 212-68.7 212-153.5 0-1.1 0-2.1-.1-3.2 4.9 1.3 10.1 2.1 15.4 2.1 30.3 0 54.7-24.4 54.7-54.6 0-30.3-24.4-54.7-54.7-54.7zM178.1 328.4c-21.6 0-39.1-17.5-39.1-39.1s17.5-39.1 39.1-39.1 39.1 17.5 39.1 39.1-17.5 39.1-39.1 39.1zm155.6 84.1c-26.7 26.7-97.9 26.7-124.5 0-4-4-4-10.5 0-14.5s10.5-4 14.5 0c17.6 17.6 78 17.6 95.6 0 4-4 10.5-4 14.5 0 3.9 4 3.9 10.5-.1 14.5zm4.3-84.1c-21.6 0-39.1-17.5-39.1-39.1s17.5-39.1 39.1-39.1 39.1 17.5 39.1 39.1-17.5 39.1-39.1 39.1z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

const ShareMessageModal = ({ isOpen, message, conversation, onClose }) => {
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

  const handleShareTarget = (target) => {
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
          <h2>Share message</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close share dialog">
            ×
          </button>
        </header>
        <div className="share-preview">
          <p>{shareText}</p>
        </div>
        <div className="share-options">
          {defaultShareTargets.map((target) => (
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
