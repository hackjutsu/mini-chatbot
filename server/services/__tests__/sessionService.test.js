const mockDb = {
  DEFAULT_SESSION_TITLE: 'New chat',
  createSession: jest.fn(),
  getSessionsForUser: jest.fn(),
  getCharactersForUser: jest.fn(),
  getCharactersPinnedByUser: jest.fn(),
  getMessagesForSession: jest.fn(),
  updateSessionTitle: jest.fn(),
  removeSession: jest.fn(),
  getSessionOwnedByUser: jest.fn(),
};

jest.mock('../../../db', () => mockDb);
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
jest.mock('../../logger', () => mockLogger);

const mockCharacterService = {
  getCharacterForUser: jest.fn(),
};

jest.mock('../characterService', () => mockCharacterService);

const sessionService = require('../sessionService');

describe('sessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(mockLogger).forEach((fn) => fn.mockClear());
  });

  describe('listForUser', () => {
    it('returns formatted sessions with character info', () => {
      mockDb.getCharactersForUser.mockReturnValue([
        {
          id: 'char-1',
          name: 'Nova',
          prompt: 'Shine',
          avatarUrl: '/nova.svg',
          createdAt: '2024-01-01 10:00:00',
          updatedAt: '2024-01-01 11:00:00',
        },
      ]);
      mockDb.getCharactersPinnedByUser.mockReturnValue([]);
      mockDb.getSessionsForUser.mockReturnValue([
        {
          id: 'sess-1',
          userId: 'user-1',
          title: '',
          characterId: 'char-1',
          createdAt: '2024-02-01 09:00:00',
          updatedAt: '2024-02-01 10:00:00',
          messageCount: 3,
        },
      ]);
      mockCharacterService.getCharacterForUser.mockReturnValue({
        id: 'char-1',
        name: 'Nova',
        prompt: 'Shine',
      });

      const result = sessionService.listForUser('user-1');

      expect(result).toEqual([
        {
          id: 'sess-1',
          title: 'New chat',
          createdAt: '2024-02-01T09:00:00.000Z',
          updatedAt: '2024-02-01T10:00:00.000Z',
          messageCount: 3,
          characterId: 'char-1',
          character: expect.objectContaining({
            id: 'char-1',
            name: 'Nova',
            prompt: 'Shine',
          }),
        },
      ]);
    });
  });

  describe('createForUser', () => {
    it('throws when character is missing', () => {
      mockCharacterService.getCharacterForUser.mockReturnValue(null);

      expect(() =>
        sessionService.createForUser('user-1', { title: 'Greetings', characterId: 'missing' })
      ).toThrow(expect.objectContaining({ code: sessionService.CHARACTER_NOT_FOUND }));
    });

    it('creates session and returns formatted payload', () => {
      mockCharacterService.getCharacterForUser.mockReturnValue({
        id: 'char-1',
        name: 'Nova',
        prompt: 'Shine',
        avatarUrl: '/nova.svg',
        createdAt: '2024-01-01 10:00:00',
        updatedAt: '2024-01-01 11:00:00',
      });
      mockDb.createSession.mockReturnValue({
        id: 'sess-1',
        title: 'Greetings',
        characterId: 'char-1',
        createdAt: '2024-02-01 09:10:00',
        updatedAt: '2024-02-01 09:15:00',
      });

      const result = sessionService.createForUser('user-1', { title: 'Greetings', characterId: 'char-1' });

      expect(mockDb.createSession).toHaveBeenCalledWith('user-1', 'Greetings', 'char-1');
      expect(result).toEqual({
        id: 'sess-1',
        title: 'Greetings',
        createdAt: '2024-02-01T09:10:00.000Z',
        updatedAt: '2024-02-01T09:15:00.000Z',
        messageCount: 0,
        characterId: 'char-1',
        character: expect.objectContaining({ id: 'char-1', name: 'Nova' }),
      });
    });

    it('creates session without character', () => {
      mockDb.createSession.mockReturnValue({
        id: 'sess-2',
        title: '',
        characterId: null,
        createdAt: '2024-03-01 05:00:00',
        updatedAt: '2024-03-01 05:00:00',
      });

      const result = sessionService.createForUser('user-1', { title: '', characterId: null });

      expect(result.character).toBeNull();
      expect(result.characterId).toBeNull();
    });
  });

  describe('getTranscriptForSession', () => {
    it('returns session DTO with messages', () => {
      mockCharacterService.getCharacterForUser.mockReturnValue({
        id: 'char-1',
        name: 'Nova',
        prompt: 'Shine',
      });
      mockDb.getMessagesForSession.mockReturnValue([
        { id: 'm1', role: 'user', content: 'Hello', createdAt: '2024-04-01 08:00:00' },
        { id: 'm2', role: 'assistant', content: 'Hi!', createdAt: '2024-04-01 08:01:00' },
      ]);

      const payload = sessionService.getTranscriptForSession(
        {
          id: 'sess-1',
          title: '',
          characterId: 'char-1',
          createdAt: '2024-02-01',
          updatedAt: '2024-02-01',
        },
        'user-1'
      );

      expect(payload.session.character).toMatchObject({ id: 'char-1' });
      expect(payload.messages).toHaveLength(2);
      expect(payload.messages[0].createdAt).toBe('2024-04-01T08:00:00.000Z');
      expect(payload.messages[1].createdAt).toBe('2024-04-01T08:01:00.000Z');
    });
  });

  describe('renameSession', () => {
    it('returns null when update fails', () => {
      mockDb.updateSessionTitle.mockReturnValue(false);

      const result = sessionService.renameSession('sess-1', 'user-1', 'New');
      expect(result).toBeNull();
    });

    it('returns formatted session when update succeeds', () => {
      mockDb.updateSessionTitle.mockReturnValue(true);
      mockDb.getSessionOwnedByUser.mockReturnValue({
        id: 'sess-1',
        title: 'Updated',
        characterId: null,
        createdAt: '2024-02-01 10:00:00',
        updatedAt: '2024-02-02 12:00:00',
      });
      mockCharacterService.getCharacterForUser.mockReturnValue(null);

      const result = sessionService.renameSession('sess-1', 'user-1', 'Updated');

      expect(mockDb.getSessionOwnedByUser).toHaveBeenCalledWith('sess-1', 'user-1');
      expect(result).toMatchObject({
        id: 'sess-1',
        title: 'Updated',
      });
    });
  });

  describe('deleteSessionForUser', () => {
    it('returns the delete flag', () => {
      mockDb.removeSession.mockReturnValue(true);
      expect(sessionService.deleteSessionForUser('sess-1', 'user-1')).toBe(true);
    });
  });
});
