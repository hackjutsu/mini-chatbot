import { useEffect, useMemo, useRef } from 'react';
import { renderMarkdown } from '../utils/markdown.js';

const CharacterBanner = ({ character }) => {
  if (!character) return null;
  return (
    <div className="character-banner">
      {character.avatarUrl ? (
        <img src={character.avatarUrl} alt={character.name} />
      ) : (
        <div className="character-avatar">{character.name.slice(0, 1).toUpperCase()}</div>
      )}
      <div>
        <strong>{character.name}</strong>
        <p className="character-meta">{character.prompt}</p>
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

const MessageBubble = ({ message, conversationCharacter }) => {
  const isAssistant = message.role === 'assistant';
  return (
    <div className={`message ${message.role}${message.isStreaming ? ' is-thinking' : ''}`}>
      {isAssistant ? <AssistantLabel character={conversationCharacter} /> : null}
      <div className="message-body">
        {isAssistant ? (
          message.content ? (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
          ) : (
            <div className="thinking-indicator" aria-label="Generating response">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )
        ) : (
          message.content
        )}
        {message.isStreaming && message.content ? (
          <div className="thinking-indicator" aria-label="Generating response">
            <span></span>
            <span></span>
            <span></span>
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
  const safeMessages = useMemo(() => messages || [], [messages]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [safeMessages]);

  if (!conversation) {
    return (
      <section className="conversation" ref={scrollRef}>
        <div className="message assistant">
          <AssistantLabel character={conversation?.character || null} />
          <div className="message-body">{introMessage}</div>
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="conversation" ref={scrollRef}>
        <CharacterBanner character={conversation.character} />
        <p className="session-meta">{errorMessage}</p>
      </section>
    );
  }

  if (isLoading || !messages) {
    return (
      <section className="conversation" ref={scrollRef}>
        <CharacterBanner character={conversation.character} />
        <p className="session-meta">Loading conversation…</p>
      </section>
    );
  }

  return (
    <section className="conversation" ref={scrollRef}>
      <CharacterBanner character={conversation.character} />
      {safeMessages.length ? (
        safeMessages.map((message, index) => (
          <MessageBubble
            message={message}
            key={`${message.id ?? 'msg'}-${index}`}
            conversationCharacter={conversation.character}
          />
        ))
      ) : (
        <div className="message assistant">
          <AssistantLabel character={conversation.character} />
          <div className="message-body">{introMessage}</div>
        </div>
      )}
    </section>
  );
};

export default ConversationView;
