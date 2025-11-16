import { render, screen } from '@testing-library/react';
import ConversationView from '../ConversationView';

const baseConversation = {
  id: 'sess-1',
  character: { name: 'Nova', prompt: 'Explorer', avatarUrl: null },
};

describe('ConversationView', () => {
  it('renders intro when no conversation available', () => {
    render(<ConversationView conversation={null} messages={[]} introMessage="Welcome!" />);
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
  });

  it('shows loading state when flagged', () => {
    render(
      <ConversationView
        conversation={baseConversation}
        messages={null}
        isLoading
        introMessage=""
      />
    );
    expect(screen.getByText(/Loading conversation/i)).toBeInTheDocument();
  });

  it('renders messages and streaming indicator', () => {
    const messages = [
      { id: 'm1', role: 'user', content: 'Hi', createdAt: '2024-01-01T10:00:00.000Z' },
      { id: 'm2', role: 'assistant', content: '', isStreaming: true, createdAt: '2024-01-01T10:01:00.000Z' },
    ];
    render(
      <ConversationView
        conversation={baseConversation}
        messages={messages}
        introMessage="Hello"
      />
    );

    expect(screen.getByText('Hi')).toBeInTheDocument();
    expect(screen.getByLabelText(/Generating response/i)).toBeInTheDocument();
  });

  it('shows error banner when errorMessage present', () => {
    render(
      <ConversationView
        conversation={baseConversation}
        messages={[]}
        errorMessage="Failed to load"
      />
    );
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders timestamps for assistant messages when createdAt exists', () => {
    const createdAt = '2024-01-01T10:30:00.000Z';
    const formatted = new Date(createdAt).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    render(
      <ConversationView
        conversation={baseConversation}
        messages={[{ id: 'm1', role: 'assistant', content: 'Timestamp test', createdAt }]}
        introMessage=""
      />
    );
    expect(screen.getByText(formatted)).toBeInTheDocument();
  });

  it('does not render timestamps for user messages', () => {
    const createdAt = '2024-01-01T11:00:00.000Z';
    const formatted = new Date(createdAt).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    render(
      <ConversationView
        conversation={baseConversation}
        messages={[{ id: 'm1', role: 'user', content: 'Hello', createdAt }]}
        introMessage=""
      />
    );
    expect(screen.queryByText(formatted)).toBeNull();
  });
});
