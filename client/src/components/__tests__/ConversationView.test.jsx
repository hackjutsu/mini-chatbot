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
      { id: 'm1', role: 'user', content: 'Hi' },
      { id: 'm2', role: 'assistant', content: '', isStreaming: true },
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
});
