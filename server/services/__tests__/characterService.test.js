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
  getCharactersPinnedByUser: jest.fn(),
  getPinnedCharacterForUser: jest.fn(),
  pinCharacterForUser: jest.fn(),
  unpinCharacterForUser: jest.fn(),
  isCharacterPinnedByUser: jest.fn(),
  publishCharacter: jest.fn(),
  unpublishCharacter: jest.fn(),
  getCharacterById: jest.fn(),
};

jest.mock('../../../db', () => mockDb);

const characterService = require('../characterService');

describe('characterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listOwned', () => {
    it('returns formatted characters for a user', () => {
      mockDb.getCharactersForUser.mockReturnValue([
        {
          id: 'c1',
          ownerUserId: 'owner',
          name: 'Nova',
          prompt: 'Be bright',
          avatarUrl: '/nova.svg',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ]);

      const result = characterService.listOwned('u1');

      expect(mockDb.getCharactersForUser).toHaveBeenCalledWith('u1');
      expect(result).toEqual([
        {
          id: 'c1',
          ownerUserId: 'owner',
          name: 'Nova',
          prompt: 'Be bright',
          avatarUrl: '/nova.svg',
          shortDescription: null,
          status: null,
          version: null,
          lastPublishedAt: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          pinnedAt: null,
        },
      ]);
    });
  });

  describe('listPinned', () => {
    it('returns pinned characters ordered by pin time', () => {
      mockDb.getCharactersPinnedByUser.mockReturnValue([
        {
          id: 'c2',
          ownerUserId: 'another',
          name: 'Chef',
          prompt: 'Cook things',
          pinnedAt: '2024-02-02',
        },
      ]);

      const result = characterService.listPinned('user-1');

      expect(mockDb.getCharactersPinnedByUser).toHaveBeenCalledWith('user-1');
      expect(result[0]).toMatchObject({
        id: 'c2',
        pinnedAt: '2024-02-02',
      });
    });
  });

  describe('listPublished', () => {
    it('returns published characters', () => {
      mockDb.getPublishedCharacters.mockReturnValue([{ id: 'c3', ownerUserId: 'owner' }]);

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
        name: 'Chef',
        prompt: 'Cook things',
        avatarUrl: null,
        createdAt: '2024-02-02',
        updatedAt: '2024-02-02',
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
        name: 'Updated',
        prompt: 'New prompt',
        avatarUrl: '/new.svg',
        createdAt: '2024-01-01',
        updatedAt: '2024-03-01',
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
      mockDb.publishCharacter.mockReturnValue({ id: 'c1', ownerUserId: 'u1', status: 'published' });
      const result = characterService.publishForUser('c1', 'u1');
      expect(mockDb.publishCharacter).toHaveBeenCalledWith('c1', 'u1');
      expect(result).toMatchObject({ id: 'c1', status: 'published' });
    });

    it('unpublishes a character for the owner', () => {
      mockDb.unpublishCharacter.mockReturnValue({ id: 'c1', ownerUserId: 'u1', status: 'draft' });
      const result = characterService.unpublishForUser('c1', 'u1');
      expect(mockDb.unpublishCharacter).toHaveBeenCalledWith('c1', 'u1');
      expect(result).toMatchObject({ id: 'c1', status: 'draft' });
    });
  });

  describe('getCharacterForUser', () => {
    it('returns owned characters', () => {
      mockDb.getCharacterOwnedByUser.mockReturnValue({ id: 'c1', ownerUserId: 'u1' });

      const result = characterService.getCharacterForUser('c1', 'u1');

      expect(mockDb.getCharacterOwnedByUser).toHaveBeenCalledWith('c1', 'u1');
      expect(result).toMatchObject({ id: 'c1' });
    });

    it('returns pinned published characters', () => {
      mockDb.getCharacterOwnedByUser.mockReturnValue(null);
      mockDb.getCharacterById.mockReturnValue({ id: 'c2', ownerUserId: 'another', status: CHARACTER_STATUS.PUBLISHED });
      mockDb.isCharacterPinnedByUser.mockReturnValue(true);
      mockDb.getPinnedCharacterForUser.mockReturnValue({
        id: 'c2',
        ownerUserId: 'another',
        status: CHARACTER_STATUS.PUBLISHED,
        pinnedAt: '2024-02-02',
      });

      const result = characterService.getCharacterForUser('c2', 'user-1');

      expect(result).toMatchObject({ id: 'c2', pinnedAt: '2024-02-02' });
    });

    it('returns null when character not published or pinned', () => {
      mockDb.getCharacterOwnedByUser.mockReturnValue(null);
      mockDb.getCharacterById.mockReturnValue({ id: 'c3', ownerUserId: 'another', status: CHARACTER_STATUS.DRAFT });

      const result = characterService.getCharacterForUser('c3', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('pinForUser', () => {
    it('pins a published character', () => {
      mockDb.getCharacterById.mockReturnValue({ id: 'c2', ownerUserId: 'owner', status: CHARACTER_STATUS.PUBLISHED });
      mockDb.getPinnedCharacterForUser.mockReturnValue({
        id: 'c2',
        ownerUserId: 'owner',
        status: CHARACTER_STATUS.PUBLISHED,
        pinnedAt: '2024-02-02',
      });

      const result = characterService.pinForUser('c2', 'user-1');

      expect(mockDb.pinCharacterForUser).toHaveBeenCalledWith('user-1', 'c2');
      expect(result).toMatchObject({ id: 'c2' });
    });

    it('throws when character not published for non-owner', () => {
      mockDb.getCharacterById.mockReturnValue({ id: 'c4', ownerUserId: 'owner', status: CHARACTER_STATUS.DRAFT });

      expect(() => characterService.pinForUser('c4', 'user-2')).toThrow('Character is not published.');
    });
  });

  describe('unpinForUser', () => {
    it('removes pin when present', () => {
      mockDb.isCharacterPinnedByUser.mockReturnValue(true);

      const result = characterService.unpinForUser('c5', 'user-1');

      expect(mockDb.unpinCharacterForUser).toHaveBeenCalledWith('user-1', 'c5');
      expect(result).toBe(true);
    });

    it('throws when pin missing', () => {
      mockDb.isCharacterPinnedByUser.mockReturnValue(false);

      expect(() => characterService.unpinForUser('c5', 'user-1')).toThrow('Character is not pinned.');
    });
  });
});
