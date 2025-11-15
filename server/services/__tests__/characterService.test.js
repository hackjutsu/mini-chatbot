const mockDb = {
  createCharacter: jest.fn(),
  getCharacterOwnedByUser: jest.fn(),
  updateCharacter: jest.fn(),
  removeCharacter: jest.fn(),
  getCharactersForUser: jest.fn(),
};

jest.mock('../../../db', () => mockDb);

const characterService = require('../characterService');

describe('characterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listForUser', () => {
    it('returns formatted characters for a user', () => {
      mockDb.getCharactersForUser.mockReturnValue([
        {
          id: 'c1',
          name: 'Nova',
          prompt: 'Be bright',
          avatarUrl: '/nova.svg',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ]);

      const result = characterService.listForUser('u1');

      expect(mockDb.getCharactersForUser).toHaveBeenCalledWith('u1');
      expect(result).toEqual([
        {
          id: 'c1',
          name: 'Nova',
          prompt: 'Be bright',
          avatarUrl: '/nova.svg',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ]);
    });
  });

  describe('createForUser', () => {
    it('returns formatted character after creation', () => {
      mockDb.createCharacter.mockReturnValue({
        id: 'c2',
        name: 'Chef',
        prompt: 'Cook things',
        avatarUrl: null,
        createdAt: '2024-02-02',
        updatedAt: '2024-02-02',
      });

      const result = characterService.createForUser('u1', { name: 'Chef', prompt: 'Cook things' });

      expect(mockDb.createCharacter).toHaveBeenCalledWith('u1', {
        name: 'Chef',
        prompt: 'Cook things',
        avatarUrl: undefined,
      });
      expect(result).toEqual({
        id: 'c2',
        name: 'Chef',
        prompt: 'Cook things',
        avatarUrl: null,
        createdAt: '2024-02-02',
        updatedAt: '2024-02-02',
      });
    });
  });

  describe('updateForUser', () => {
    it('returns formatted character when update succeeds', () => {
      mockDb.updateCharacter.mockReturnValue({
        id: 'c1',
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
      expect(result).toEqual({
        id: 'c1',
        name: 'Updated',
        prompt: 'New prompt',
        avatarUrl: '/new.svg',
        createdAt: '2024-01-01',
        updatedAt: '2024-03-01',
      });
    });

    it('returns null when update fails', () => {
      mockDb.updateCharacter.mockReturnValue(null);

      const result = characterService.updateForUser('c1', 'u1', {
        name: 'Updated',
        prompt: 'New prompt',
      });

      expect(result).toBeNull();
    });
  });

  describe('removeForUser', () => {
    it('returns underlying remove flag', () => {
      mockDb.removeCharacter.mockReturnValue(true);

      const result = characterService.removeForUser('c1', 'u1');

      expect(mockDb.removeCharacter).toHaveBeenCalledWith('c1', 'u1');
      expect(result).toBe(true);
    });
  });

  describe('getOwnedCharacter', () => {
    it('returns formatted character when found', () => {
      mockDb.getCharacterOwnedByUser.mockReturnValue({
        id: 'c1',
        name: 'Found',
        prompt: 'Hello',
        avatarUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });

      const result = characterService.getOwnedCharacter('c1', 'u1');

      expect(result).toEqual({
        id: 'c1',
        name: 'Found',
        prompt: 'Hello',
        avatarUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });
    });

    it('returns null when not found', () => {
      mockDb.getCharacterOwnedByUser.mockReturnValue(null);

      const result = characterService.getOwnedCharacter('missing', 'u1');
      expect(result).toBeNull();
    });
  });
});
