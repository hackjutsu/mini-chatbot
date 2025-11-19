const CHARACTER_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

const mockDb = {
  CHARACTER_STATUS,
  createCharacter: jest.fn(),
  getCharacterOwnedByUser: jest.fn(),
  updateCharacter: jest.fn(),
  removeCharacter: jest.fn(),
  getCharactersForUser: jest.fn(),
  getPublishedCharacters: jest.fn(),
  publishCharacter: jest.fn(),
  unpublishCharacter: jest.fn(),
  getCharacterById: jest.fn(),
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  wrap: jest.fn((key, ttl, loader) => loader()),
};
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock('../../../db', () => mockDb);
jest.mock('../../cache', () => mockCache);
jest.mock('../../cache/keys', () => ({
  publishedCharacterKey: (id) => `character:published:${id}`,
}));
jest.mock('../../logger', () => mockLogger);

const characterService = require('../characterService');

describe('characterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCache.get.mockClear();
    mockCache.set.mockClear();
    mockCache.delete.mockClear();
    mockCache.wrap.mockClear();
    mockCache.get.mockReturnValue(null);
    mockCache.wrap.mockImplementation((key, ttl, loader) => loader());
    Object.values(mockLogger).forEach((fn) => fn.mockClear());
  });

  describe('listOwned', () => {
    it('returns formatted characters for a user', () => {
      mockDb.getCharactersForUser.mockReturnValue([
        {
          id: 'c1',
          ownerUserId: 'owner',
          ownerUsername: 'Owner',
          name: 'Nova',
          prompt: 'Be bright',
          avatarUrl: '/nova.svg',
          createdAt: '2024-01-01 10:00:00',
          updatedAt: '2024-01-01 11:00:00',
        },
      ]);

      const result = characterService.listOwned('u1');

      expect(mockDb.getCharactersForUser).toHaveBeenCalledWith('u1');
      expect(result).toEqual([
        {
          id: 'c1',
          ownerUserId: 'owner',
          ownerUsername: 'Owner',
          name: 'Nova',
          prompt: 'Be bright',
          avatarUrl: '/nova.svg',
          shortDescription: null,
          status: null,
          version: null,
          lastPublishedAt: null,
          createdAt: '2024-01-01T10:00:00.000Z',
          updatedAt: '2024-01-01T11:00:00.000Z',
        },
      ]);
    });
  });

  describe('listPublished', () => {
    it('returns published characters', () => {
      mockDb.getPublishedCharacters.mockReturnValue([{ id: 'c3', ownerUserId: 'owner', ownerUsername: 'Owner' }]);

      const result = characterService.listPublished();

      expect(mockDb.getPublishedCharacters).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('createForUser', () => {
    it('returns formatted character after creation', () => {
      mockDb.createCharacter.mockReturnValue({
        id: 'c2',
        ownerUserId: 'u1',
        ownerUsername: 'me',
        name: 'Chef',
        prompt: 'Cook things',
        avatarUrl: null,
        createdAt: '2024-02-02 05:00:00',
        updatedAt: '2024-02-02 05:05:00',
      });

      const result = characterService.createForUser('u1', { name: 'Chef', prompt: 'Cook things' });

      expect(mockDb.createCharacter).toHaveBeenCalledWith('u1', { name: 'Chef', prompt: 'Cook things' });
      expect(result).toMatchObject({ id: 'c2', name: 'Chef' });
    });
  });

  describe('updateForUser', () => {
    it('returns formatted character when update succeeds', () => {
      mockDb.updateCharacter.mockReturnValue({
        id: 'c1',
        ownerUserId: 'u1',
        ownerUsername: 'me',
        name: 'Updated',
        prompt: 'New prompt',
        avatarUrl: '/new.svg',
        createdAt: '2024-01-01 10:00:00',
        updatedAt: '2024-03-01 09:00:00',
      });

      const result = characterService.updateForUser('c1', 'u1', {
        name: 'Updated',
        prompt: 'New prompt',
        avatarUrl: '/new.svg',
      });

      expect(mockDb.updateCharacter).toHaveBeenCalledWith('c1', 'u1', {
        name: 'Updated',
        prompt: 'New prompt',
        avatarUrl: '/new.svg',
      });
      expect(result).toMatchObject({ id: 'c1', name: 'Updated' });
    });
  });

  describe('publish/unpublish', () => {
    it('publishes a character for the owner', () => {
      mockDb.publishCharacter.mockReturnValue({ id: 'c1', ownerUserId: 'u1', ownerUsername: 'me', status: 'published' });
      const result = characterService.publishForUser('c1', 'u1');
      expect(mockDb.publishCharacter).toHaveBeenCalledWith('c1', 'u1');
      expect(result).toMatchObject({ id: 'c1', status: 'published' });
      expect(mockCache.set).toHaveBeenCalledWith('character:published:c1', expect.objectContaining({ id: 'c1' }), expect.any(Number));
    });

    it('unpublishes a character for the owner', () => {
      mockDb.unpublishCharacter.mockReturnValue({ id: 'c1', ownerUserId: 'u1', ownerUsername: 'me', status: 'draft' });
      const result = characterService.unpublishForUser('c1', 'u1');
      expect(mockDb.unpublishCharacter).toHaveBeenCalledWith('c1', 'u1');
      expect(result).toMatchObject({ id: 'c1', status: 'draft' });
      expect(mockCache.delete).toHaveBeenCalledWith('character:published:c1');
    });
  });

  describe('getCharacterForUser', () => {
    it('returns owned characters', () => {
      mockDb.getCharacterOwnedByUser.mockReturnValue({ id: 'c1', ownerUserId: 'u1', ownerUsername: 'me' });

      const result = characterService.getCharacterForUser('c1', 'u1');

      expect(mockDb.getCharacterOwnedByUser).toHaveBeenCalledWith('c1', 'u1');
      expect(result).toMatchObject({ id: 'c1' });
    });

    it('returns published characters', () => {
      mockDb.getCharacterOwnedByUser.mockReturnValue(null);
      mockDb.getCharacterById.mockReturnValue({
        id: 'c2',
        ownerUserId: 'another',
        ownerUsername: 'Another',
        status: CHARACTER_STATUS.PUBLISHED,
      });

      const result = characterService.getCharacterForUser('c2', 'user-1');

      expect(result).toMatchObject({ id: 'c2' });
      expect(mockCache.get).toHaveBeenCalledWith('character:published:c2');
      expect(mockCache.wrap).toHaveBeenCalledWith('character:published:c2', expect.any(Number), expect.any(Function));
    });

    it('returns null when character is not published', () => {
      mockDb.getCharacterOwnedByUser.mockReturnValue(null);
      mockDb.getCharacterById.mockReturnValue({ id: 'c3', ownerUserId: 'another', ownerUsername: 'Another', status: CHARACTER_STATUS.DRAFT });

      const result = characterService.getCharacterForUser('c3', 'user-1');

      expect(result).toBeNull();
    });
  });

  it('invalidates cache when removing a character', () => {
    mockDb.removeCharacter.mockReturnValue(true);
    characterService.removeForUser('c42', 'u1');
    expect(mockCache.delete).toHaveBeenCalledWith('character:published:c42');
  });

  it('caches update when character remains published', () => {
    mockDb.updateCharacter.mockReturnValue({
      id: 'c99',
      ownerUserId: 'u1',
      ownerUsername: 'me',
      name: 'Nova',
      prompt: 'Bright',
      status: CHARACTER_STATUS.PUBLISHED,
    });
    characterService.updateForUser('c99', 'u1', { name: 'Nova', prompt: 'Bright' });
    expect(mockCache.set).toHaveBeenCalledWith('character:published:c99', expect.objectContaining({ id: 'c99' }), expect.any(Number));
  });

  it('invalidates cache when update returns draft', () => {
    mockDb.updateCharacter.mockReturnValue({
      id: 'c100',
      ownerUserId: 'u1',
      ownerUsername: 'me',
      name: 'Nova',
      prompt: 'Bright',
      status: CHARACTER_STATUS.DRAFT,
    });
    characterService.updateForUser('c100', 'u1', { name: 'Nova', prompt: 'Bright' });
    expect(mockCache.delete).toHaveBeenCalledWith('character:published:c100');
  });

});
  it('returns cached character when available', () => {
    mockCache.get.mockReturnValue({ id: 'cached', status: CHARACTER_STATUS.PUBLISHED });
    mockDb.getCharacterOwnedByUser.mockReturnValue(null);
    const result = characterService.getCharacterForUser('cached', 'user-1');
    expect(result).toEqual({ id: 'cached', status: CHARACTER_STATUS.PUBLISHED });
    expect(mockDb.getCharacterOwnedByUser).not.toHaveBeenCalled();
    expect(mockCache.wrap).not.toHaveBeenCalled();
  });
