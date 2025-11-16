import { useEffect, useMemo, useRef, useState } from 'react';
import { renderMarkdown } from '../utils/markdown.js';
import MessageActionBar from './MessageActionBar.jsx';
import ShareMessageModal from './ShareMessageModal.jsx';

const formatTimestamp = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const CharacterBanner = ({ character }) => {
  if (!character) return null;
  const summary = character.shortDescription?.trim() || null;
  return (
    <div className="character-banner">
      {character.avatarUrl ? (
        <img src={character.avatarUrl} alt={character.name} />
      ) : (
        <div className="character-avatar">{character.name.slice(0, 1).toUpperCase()}</div>
      )}
      <div>
        <strong>{character.name}</strong>
        {summary ? <p className="character-meta">{summary}</p> : null}
      </div>
    </div>
  );
};

const AssistantLabel = ({ character }) => {
  const label = character?.name || 'Assistant';
  if (!character) {
    return (
      <div className="message-label">
        <span className="message-avatar">A</span>
        <small>{label}</small>
      </div>
    );
  }
  return (
    <div className="message-label">
      {character.avatarUrl ? (
        <img src={character.avatarUrl} alt={label} className="message-avatar" />
      ) : (
        <span className="message-avatar">{label.slice(0, 1).toUpperCase()}</span>
      )}
      <small>{label}</small>
    </div>
  );
};

const MessageBubble = ({ message, conversationCharacter, onShare }) => {
  const isAssistant = message.role === 'assistant';
  const hasContent = Boolean(message.content);
  const showActions = isAssistant && hasContent && !message.isStreaming;
  const showIndicator = Boolean(message.isStreaming);
  const indicatorClasses = `thinking-indicator${hasContent ? ' message-think-indicator' : ''}`;
  const timestampLabel = isAssistant ? formatTimestamp(message.createdAt) : null;
  const showMetaRow = showActions || timestampLabel;

  return (
    <div className={`message ${message.role}${message.isStreaming ? ' is-thinking' : ''}`}>
      {isAssistant ? <AssistantLabel character={conversationCharacter} /> : null}
      <div className="message-body">
        {isAssistant ? (
          hasContent ? (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
          ) : null
        ) : (
          message.content
        )}
        {showIndicator ? (
          <div className={indicatorClasses} aria-label="Generating response">
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : null}
        {showMetaRow ? (
          <div className="message-meta-row">
            {showActions ? <MessageActionBar message={message} onShare={onShare} /> : null}
            {timestampLabel ? <div className="message-timestamp">{timestampLabel}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ConversationView = ({
  conversation,
  messages,
  isLoading,
  introMessage,
  errorMessage,
}) => {
  const scrollRef = useRef(null);
  const [shareState, setShareState] = useState({ isOpen: false, message: null });
  const safeMessages = useMemo(() => messages || [], [messages]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [safeMessages]);

  const openShareModal = (message) => {
    if (!message?.content) return;
    setShareState({ isOpen: true, message });
  };

  const closeShareModal = () => {
    setShareState({ isOpen: false, message: null });
  };

  const sectionProps = {
    className: 'conversation',
    ref: scrollRef,
  };

  let sectionContent = null;

  if (!conversation) {
    sectionContent = (
      <div className="message assistant">
        <AssistantLabel character={conversation?.character || null} />
        <div className="message-body">{introMessage}</div>
      </div>
    );
  } else if (errorMessage) {
    sectionContent = (
      <>
        <CharacterBanner character={conversation.character} />
        <p className="session-meta">{errorMessage}</p>
      </>
    );
  } else if (isLoading || !messages) {
    sectionContent = (
      <>
        <CharacterBanner character={conversation.character} />
        <p className="session-meta">Loading conversation…</p>
      </>
    );
  } else {
    sectionContent = (
      <>
        <CharacterBanner character={conversation.character} />
        {safeMessages.length ? (
          safeMessages.map((message, index) => (
            <MessageBubble
              message={message}
              key={`${message.id ?? 'msg'}-${index}`}
              conversationCharacter={conversation.character}
              onShare={openShareModal}
            />
          ))
        ) : (
          <div className="message assistant">
            <AssistantLabel character={conversation.character} />
            <div className="message-body">{introMessage}</div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <section {...sectionProps}>{sectionContent}</section>
      <ShareMessageModal
        isOpen={shareState.isOpen}
        message={shareState.message}
        conversation={conversation}
        onClose={closeShareModal}
      />
    </>
  );
};

export default ConversationView;
