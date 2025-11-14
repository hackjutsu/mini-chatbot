import { useEffect, useMemo, useRef, useState } from 'react';
import ConversationView from './components/ConversationView.jsx';
import SessionList from './components/SessionList.jsx';
import Composer from './components/Composer.jsx';
import UserMenu from './components/UserMenu.jsx';
import ModelSelector from './components/ModelSelector.jsx';
import CharacterPicker from './components/CharacterPicker.jsx';
import CharacterFormModal from './components/CharacterFormModal.jsx';
import UsernameModal from './components/UsernameModal.jsx';
import {
  createCharacter,
  createSession,
  createUser,
  deleteCharacter,
  deleteSession,
  fetchCharacters,
  fetchMessages,
  fetchModels,
  fetchSessions,
  lookupUser,
  renameSession,
  streamChat,
  updateCharacter,
  updateUserModel,
} from './api/client.js';

const STORAGE_KEYS = {
  user: 'miniChatbot:user',
  activeSession: 'miniChatbot:activeSession',
  activeCharacter: 'miniChatbot:activeCharacter',
};
const DEFAULT_TITLE = 'New chat';
const INTRO_MESSAGE = '👋 Hey! Ask me anything to get started.';
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

const readStoredProfile = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.user));
    if (stored?.userId && stored?.username) {
      return stored;
    }
  } catch (error) {
    console.warn('Unable to read stored profile:', error);
  }
  return null;
};

const readStoredValue = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const formatSession = (session) => ({
  id: session.id,
  title: session.title || DEFAULT_TITLE,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
  messageCount: session.messageCount ?? 0,
  characterId: session.characterId || session.character?.id || null,
  character: session.character || null,
});

const sortSessions = (list) =>
  [...list].sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });

const deriveTitleFromMessage = (content = '') => {
  const trimmed = content.replace(/\s+/g, ' ').trim();
  if (!trimmed) return null;
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
};

const App = () => {
  const [user, setUser] = useState(readStoredProfile);
  const [sessions, setSessions] = useState([]);
  const [messagesBySession, setMessagesBySession] = useState({});
  const [activeSessionId, setActiveSessionId] = useState(() => readStoredValue(STORAGE_KEYS.activeSession));
  const [characters, setCharacters] = useState([]);
  const [activeCharacterId, setActiveCharacterId] = useState(() => readStoredValue(STORAGE_KEYS.activeCharacter));
  const [modelState, setModelState] = useState({ available: [], selected: null, isLoading: false });
  const [status, setStatus] = useState('Ready');
  const [globalError, setGlobalError] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState({});
  const [conversationErrors, setConversationErrors] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelection, setPickerSelection] = useState(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [streamingSessionId, setStreamingSessionId] = useState(null);
  const [characterFormState, setCharacterFormState] = useState({
    isOpen: false,
    mode: 'create',
    initial: null,
    isSubmitting: false,
    error: '',
  });
  const [usernameState, setUsernameState] = useState({
    isOpen: !user,
    isSubmitting: false,
    error: '',
  });
  const defaultCharacterRef = useRef(activeCharacterId);

  useEffect(() => {
    defaultCharacterRef.current = activeCharacterId;
  }, [activeCharacterId]);

  useEffect(() => {
    if (!user) {
      setUsernameState({ isOpen: true, isSubmitting: false, error: '' });
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) {
      window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.user);
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeSessionId) {
      window.localStorage.setItem(STORAGE_KEYS.activeSession, activeSessionId);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.activeSession);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeCharacterId) {
      window.localStorage.setItem(STORAGE_KEYS.activeCharacter, activeCharacterId);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.activeCharacter);
    }
  }, [activeCharacterId]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      setStatus('Loading…');
      setGlobalError('');
      try {
        const [characterData, modelData, sessionData] = await Promise.all([
          fetchCharacters(user.userId),
          fetchModels(user.userId),
          fetchSessions(user.userId),
        ]);
        if (cancelled) return;

        setCharacters(characterData.characters || []);
        setModelState({
          available: modelData.models || [],
          selected: modelData.selectedModel || null,
          isLoading: false,
        });

        let normalizedSessions = (sessionData.sessions || []).map((session) => formatSession(session));
        if (!normalizedSessions.length) {
          const created = await createSession(user.userId, {
            characterId: defaultCharacterRef.current || null,
            title: DEFAULT_TITLE,
          });
          normalizedSessions = [formatSession(created.session)];
          setMessagesBySession((prev) => ({ ...prev, [created.session.id]: [] }));
        }
        const sorted = sortSessions(normalizedSessions);
        setSessions(sorted);
        const fallback =
          activeSessionId && sorted.some((session) => session.id === activeSessionId)
            ? activeSessionId
            : sorted[0]?.id || null;
        setActiveSessionId(fallback);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to bootstrap UI:', error);
          setGlobalError(error.message || 'Failed to load your chats.');
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
          setStatus('Ready');
        }
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const activeConversation = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );
  const activeMessages = activeSessionId ? messagesBySession[activeSessionId] : null;
  const isConversationLoading = Boolean(
    activeSessionId && loadingConversations[activeSessionId]
  );
  const conversationError = activeSessionId ? conversationErrors[activeSessionId] : '';

  useEffect(() => {
    if (!user || !activeSessionId) return;
    if (Array.isArray(activeMessages)) return;
    let cancelled = false;
    const loadMessagesForConversation = async () => {
      setLoadingConversations((prev) => ({ ...prev, [activeSessionId]: true }));
      setConversationErrors((prev) => ({ ...prev, [activeSessionId]: '' }));
      try {
        const data = await fetchMessages(user.userId, activeSessionId);
        if (cancelled) return;
        setMessagesBySession((prev) => ({ ...prev, [activeSessionId]: data.messages || [] }));
        setSessions((prev) =>
          prev.map((session) => {
            if (session.id !== activeSessionId) return session;
            return {
              ...session,
              messageCount: data.messages?.length ?? session.messageCount,
              updatedAt: data.session?.updatedAt || session.updatedAt,
              characterId: data.session?.characterId || null,
              character: data.session?.character || null,
            };
          })
        );
      } catch (error) {
        if (!cancelled) {
          console.error('Unable to load conversation:', error);
          setConversationErrors((prev) => ({
            ...prev,
            [activeSessionId]: error.message || 'Failed to load conversation.',
          }));
        }
      } finally {
        if (!cancelled) {
          setLoadingConversations((prev) => ({ ...prev, [activeSessionId]: false }));
        }
      }
    };

    loadMessagesForConversation();
    return () => {
      cancelled = true;
    };
  }, [user, activeSessionId, activeMessages]);

  const isStreaming = Boolean(streamingSessionId);

  const handleUsernameSubmit = async (rawInput) => {
    const value = rawInput.trim();
    if (!USERNAME_PATTERN.test(value)) {
      setUsernameState((prev) => ({ ...prev, error: 'Use 3-32 characters (letters, numbers, _ or -).' }));
      return;
    }
    setUsernameState({ isOpen: true, isSubmitting: true, error: '' });
    try {
      const existing = await lookupUser(value);
      if (existing.ok) {
        setUser({
          userId: existing.data.id,
          username: existing.data.username,
          preferredModel: existing.data.preferredModel || null,
        });
        setUsernameState({ isOpen: false, isSubmitting: false, error: '' });
        return;
      }
      if (existing.status !== 404) {
        throw new Error(existing.data?.error || 'Unable to check username.');
      }
      const created = await createUser(value);
      setUser({
        userId: created.id,
        username: created.username,
        preferredModel: created.preferredModel || null,
      });
      setUsernameState({ isOpen: false, isSubmitting: false, error: '' });
    } catch (error) {
      console.error('Username selection failed:', error);
      setUsernameState((prev) => ({
        ...prev,
        error: error.message || 'Unable to set username.',
        isSubmitting: false,
      }));
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSessions([]);
    setMessagesBySession({});
    setActiveSessionId(null);
    setCharacters([]);
    setActiveCharacterId(null);
    setModelState({ available: [], selected: null, isLoading: false });
    setGlobalError('');
    setPickerOpen(false);
  };

  const handleSelectSession = (sessionId) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
  };

  const handleRenameSession = async (session) => {
    if (!user) return;
    setGlobalError('');
    const nextTitle = window.prompt('Rename chat', session.title || DEFAULT_TITLE);
    if (nextTitle === null) return;
    const finalTitle = nextTitle.trim() || DEFAULT_TITLE;
    if (finalTitle === session.title) return;
    setSessions((prev) =>
      prev.map((entry) => (entry.id === session.id ? { ...entry, title: finalTitle } : entry))
    );
    try {
      await renameSession(user.userId, session.id, finalTitle);
    } catch (error) {
      console.error('Unable to rename session:', error);
      setGlobalError(error.message || 'Failed to rename chat.');
    }
  };

  const handleDeleteSession = async (session) => {
    if (!user) return;
    setGlobalError('');
    const confirmed = window.confirm(
      `Delete "${session.title || DEFAULT_TITLE}"? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await deleteSession(user.userId, session.id);
      setMessagesBySession((prev) => {
        const map = { ...prev };
        delete map[session.id];
        return map;
      });
      setConversationErrors((prev) => {
        if (!prev[session.id]) return prev;
        const map = { ...prev };
        delete map[session.id];
        return map;
      });
      setLoadingConversations((prev) => {
        if (!prev[session.id]) return prev;
        const map = { ...prev };
        delete map[session.id];
        return map;
      });
      const remaining = sessions.filter((entry) => entry.id !== session.id);
      if (!remaining.length) {
        const replacement = await createSession(user.userId, {
          characterId: activeCharacterId || null,
          title: DEFAULT_TITLE,
        });
        const formatted = formatSession(replacement.session);
        setSessions([formatted]);
        setMessagesBySession({ [formatted.id]: [] });
        setActiveSessionId(formatted.id);
        return;
      }
      const sorted = sortSessions(remaining);
      setSessions(sorted);
      if (session.id === activeSessionId) {
        setActiveSessionId(sorted[0].id);
      }
    } catch (error) {
      console.error('Unable to delete session:', error);
      setGlobalError(error.message || 'Failed to delete chat.');
    }
  };

  const handleModelSelect = async (model) => {
    if (!user || !model || model === modelState.selected) return;
    setGlobalError('');
    setModelState((prev) => ({ ...prev, isLoading: true }));
    try {
      await updateUserModel(user.userId, model);
      setModelState((prev) => ({ ...prev, selected: model, isLoading: false }));
      setUser((prev) => (prev ? { ...prev, preferredModel: model } : prev));
    } catch (error) {
      console.error('Unable to update model:', error);
      setModelState((prev) => ({ ...prev, isLoading: false }));
      setGlobalError(error.message || 'Failed to update model.');
    }
  };

  const openCharacterPicker = () => {
    setPickerSelection(activeCharacterId || null);
    setPickerOpen(true);
  };

  const closeCharacterPicker = () => {
    setPickerOpen(false);
  };

  const handleStartConversation = async () => {
    if (!user) return;
    setGlobalError('');
    setIsStartingChat(true);
    try {
      const created = await createSession(user.userId, {
        characterId: pickerSelection || null,
        title: DEFAULT_TITLE,
      });
      const formatted = formatSession(created.session);
      setSessions((prev) => sortSessions([formatted, ...prev]));
      setMessagesBySession((prev) => ({ ...prev, [formatted.id]: [] }));
      setActiveSessionId(formatted.id);
      setActiveCharacterId(pickerSelection || null);
      closeCharacterPicker();
    } catch (error) {
      console.error('Unable to start chat:', error);
      setGlobalError(error.message || 'Failed to start a new chat.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const openCharacterForm = (mode, character = null) => {
    setCharacterFormState({
      isOpen: true,
      mode,
      initial: character,
      error: '',
      isSubmitting: false,
    });
  };

  const closeCharacterForm = () => {
    setCharacterFormState((prev) => ({ ...prev, isOpen: false, error: '', isSubmitting: false }));
  };

  const handleCharacterSubmit = async (values) => {
    if (!user) return;
    setGlobalError('');
    setCharacterFormState((prev) => ({ ...prev, isSubmitting: true, error: '' }));
    try {
      if (characterFormState.mode === 'edit' && characterFormState.initial?.id) {
        const updated = await updateCharacter(user.userId, characterFormState.initial.id, values);
        setCharacters((prev) =>
          prev.map((entry) => (entry.id === updated.character.id ? updated.character : entry))
        );
        setSessions((prev) =>
          prev.map((session) =>
            session.characterId === updated.character.id
              ? { ...session, character: updated.character }
              : session
          )
        );
      } else {
        const created = await createCharacter(user.userId, values);
        setCharacters((prev) => [created.character, ...prev]);
        setActiveCharacterId(created.character.id);
        setPickerSelection(created.character.id);
      }
      closeCharacterForm();
    } catch (error) {
      console.error('Unable to persist character:', error);
      setCharacterFormState((prev) => ({ ...prev, error: error.message || 'Failed to save character.', isSubmitting: false }));
    }
  };

  const handleEditCharacter = (character) => {
    openCharacterForm('edit', character);
  };

  const handleDeleteCharacter = async (character) => {
    if (!user) return;
    setGlobalError('');
    const confirmed = window.confirm(
      `Delete "${character.name}"? Sessions using this character will switch to default.`
    );
    if (!confirmed) return;
    try {
      await deleteCharacter(user.userId, character.id);
      setCharacters((prev) => prev.filter((entry) => entry.id !== character.id));
      setSessions((prev) =>
        prev.map((session) =>
          session.characterId === character.id
            ? { ...session, characterId: null, character: null }
            : session
        )
      );
      setActiveCharacterId((prev) => (prev === character.id ? null : prev));
      setPickerSelection((prev) => (prev === character.id ? null : prev));
    } catch (error) {
      console.error('Unable to delete character:', error);
      setGlobalError(error.message || 'Failed to delete character.');
    }
  };

  const ensureMessagesLoaded = async (sessionId) => {
    if (!user) return [];
    const existing = messagesBySession[sessionId];
    if (Array.isArray(existing)) {
      return existing;
    }
    try {
      const data = await fetchMessages(user.userId, sessionId);
      setMessagesBySession((prev) => ({ ...prev, [sessionId]: data.messages || [] }));
      return data.messages || [];
    } catch (error) {
      console.error('Unable to load messages before sending:', error);
      throw error;
    }
  };

  const handleSendMessage = async (text) => {
    if (!user || !activeConversation) return;
    setGlobalError('');
    const sessionId = activeConversation.id;
    await ensureMessagesLoaded(sessionId);
    const now = new Date().toISOString();
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: now,
    };
    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: now,
      isStreaming: true,
    };

    setMessagesBySession((prev) => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] || []), userMessage, assistantMessage],
    }));

    const shouldAutoTitle = !activeConversation.title || activeConversation.title === DEFAULT_TITLE;
    let pendingTitle = activeConversation.title;
    if (shouldAutoTitle) {
      const derived = deriveTitleFromMessage(text);
      if (derived) {
        pendingTitle = derived;
        setSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId ? { ...session, title: derived, updatedAt: now } : session
          )
        );
        renameSession(user.userId, sessionId, derived).catch((error) =>
          console.warn('Unable to persist auto title:', error)
        );
      }
    }

    setSessions((prev) =>
      sortSessions(
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                updatedAt: now,
                messageCount: (session.messageCount || 0) + 2,
                title: pendingTitle || session.title,
              }
            : session
        )
      )
    );

    setStatus('Thinking…');
    setStreamingSessionId(sessionId);

    try {
      let aggregate = '';
      await streamChat({
        userId: user.userId,
        sessionId,
        content: text,
        onDelta: (delta, full) => {
          aggregate = full;
          setMessagesBySession((prev) => {
            const current = prev[sessionId] || [];
            if (!current.length) return prev;
            const updated = [...current];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: full,
              isStreaming: true,
            };
            return { ...prev, [sessionId]: updated };
          });
        },
      });
      setMessagesBySession((prev) => {
        const current = prev[sessionId] || [];
        if (!current.length) return prev;
        const updated = [...current];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: aggregate,
          isStreaming: false,
        };
        return { ...prev, [sessionId]: updated };
      });
    } catch (error) {
      console.error('Chat request failed:', error);
      setMessagesBySession((prev) => {
        const current = prev[sessionId] || [];
        if (!current.length) return prev;
        const updated = [...current];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: error.message || 'Something went wrong.',
          isStreaming: false,
        };
        return { ...prev, [sessionId]: updated };
      });
      setGlobalError(error.message || 'Model failed to respond.');
    } finally {
      setStreamingSessionId(null);
      setStatus('Ready');
    }
  };

  const activeStatusClass = status === 'Thinking…' ? 'status-pill is-thinking' : 'status-pill';

  return (
    <div className="app-layout">
      <aside className="session-panel">
        <div className="panel-header">
          <div>
            <h1>Mini Chatbot</h1>
            <p>Your on-device chat sandbox.</p>
          </div>
          <UserMenu user={user} onLogout={handleLogout} />
        </div>
        <button type="button" className="new-chat-btn" onClick={openCharacterPicker} disabled={!user}>
          + New chat
        </button>
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={handleSelectSession}
          onRename={handleRenameSession}
          onDelete={handleDeleteSession}
          isLoading={isBootstrapping}
        />
      </aside>
      <main className="chat-panel">
        <header className="chat-header">
          <ModelSelector
            models={modelState.available}
            selectedModel={modelState.selected}
            disabled={!user}
            onSelect={handleModelSelect}
            isLoading={modelState.isLoading}
          />
          <span className={activeStatusClass}>{status}</span>
        </header>
        {globalError ? <div className="alert">{globalError}</div> : null}
        <ConversationView
          conversation={activeConversation}
          messages={activeMessages}
          isLoading={isConversationLoading}
          introMessage={INTRO_MESSAGE}
          errorMessage={conversationError}
        />
        <Composer
          disabled={!user || !activeConversation || isStreaming}
          onSubmit={handleSendMessage}
          placeholder="Type your message… Press Enter to send, Shift+Enter for new lines"
          busyLabel={isStreaming ? 'Sending…' : 'Send'}
        />
      </main>
      <CharacterPicker
        isOpen={pickerOpen}
        characters={characters}
        selectedCharacterId={pickerSelection}
        onSelect={setPickerSelection}
        onClose={closeCharacterPicker}
        onConfirm={handleStartConversation}
        onCreate={() => openCharacterForm('create')}
        onEdit={handleEditCharacter}
        onDelete={handleDeleteCharacter}
        isSubmitting={isStartingChat}
      />
      <CharacterFormModal
        isOpen={characterFormState.isOpen}
        mode={characterFormState.mode}
        initialValues={characterFormState.initial}
        onSubmit={handleCharacterSubmit}
        onCancel={closeCharacterForm}
        isSubmitting={characterFormState.isSubmitting}
        error={characterFormState.error}
      />
      <UsernameModal
        isOpen={usernameState.isOpen}
        onSubmit={handleUsernameSubmit}
        isBusy={usernameState.isSubmitting}
        error={usernameState.error}
        patternHint="Letters, numbers, underscores, and hyphens only."
      />
    </div>
  );
};

export default App;
