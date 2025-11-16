const EventEmitter = require('events');

const mockDb = {
  getMessagesForSession: jest.fn(),
  addMessage: jest.fn(),
};

jest.mock('../../../db', () => mockDb);
jest.mock('../../helpers/sessionTitle', () => ({
  maybeAutoTitleSession: jest.fn(),
}));
jest.mock('../ollamaService', () => ({
  requestChatStream: jest.fn(),
}));
jest.mock('../../config', () => ({
  OLLAMA_MODEL: 'fallback-model',
}));
jest.mock('../characterService', () => ({
  getCharacterForUser: jest.fn(),
}));
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};
jest.mock('../../logger', () => mockLogger);

const { streamChatResponse } = require('../chatService');
const { requestChatStream } = require('../ollamaService');
const { maybeAutoTitleSession } = require('../../helpers/sessionTitle');

const createMockReqRes = () => {
  const req = new EventEmitter();
  const res = new EventEmitter();
  res.setHeader = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.write = jest.fn();
  res.end = jest.fn(() => {
    res.writableEnded = true;
  });
  res.flushHeaders = jest.fn();
  res.headersSent = false;
  res.writableEnded = false;
  res.json = jest.fn().mockReturnValue(res);
  return { req, res };
};

const createReadableStream = (chunks) => {
  let index = 0;
  const encoder = new TextEncoder();
  return {
    getReader: () => ({
      read: async () => {
        if (index < chunks.length) {
          const value = encoder.encode(chunks[index]);
          index += 1;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      },
    }),
  };
};

describe('streamChatResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getMessagesForSession.mockReturnValue([]);
    mockDb.addMessage.mockReturnValue('msg-id');
    Object.values(mockLogger).forEach((fn) => fn.mockClear());
  });

  it('streams assistant responses and persists messages', async () => {
    requestChatStream.mockResolvedValue({
      ok: true,
      body: createReadableStream([
        JSON.stringify({ message: { content: 'Hello' } }) + '\n',
        JSON.stringify({ response: ' world' }) + '\n',
      ]),
    });

    const { req, res } = createMockReqRes();
    const user = { id: 'user-1', preferredModel: 'custom-model' };
    const session = { id: 'session-1', characterId: null };

    await streamChatResponse({ req, res, user, session, content: 'Hi there' });

    expect(mockDb.addMessage).toHaveBeenCalledWith('session-1', 'assistant', 'Hello world');
    expect(res.write).toHaveBeenCalledWith(JSON.stringify({ type: 'delta', content: 'Hello' }) + '\n');
    expect(res.write).toHaveBeenCalledWith(JSON.stringify({ type: 'delta', content: ' world' }) + '\n');
    expect(res.write).toHaveBeenCalledWith(JSON.stringify({ type: 'done' }) + '\n');
    expect(res.end).toHaveBeenCalled();
    expect(maybeAutoTitleSession).toHaveBeenCalled();
    expect(requestChatStream).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'custom-model',
        messages: expect.arrayContaining([{ role: 'user', content: 'Hi there' }]),
      })
    );
  });

  it('returns 500 when upstream request fails before headers sent', async () => {
    requestChatStream.mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('boom'),
    });

    const { req, res } = createMockReqRes();
    const user = { id: 'user-1' };
    const session = { id: 'session-1', characterId: null };

    await streamChatResponse({ req, res, user, session, content: 'test' });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to contact Ollama' });
    expect(res.end).not.toHaveBeenCalled();
  });
});
