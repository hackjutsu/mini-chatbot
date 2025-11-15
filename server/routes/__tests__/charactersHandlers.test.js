const mockCharacterService = {
  listForUser: jest.fn(),
  createForUser: jest.fn(),
  updateForUser: jest.fn(),
  removeForUser: jest.fn(),
  getOwnedCharacter: jest.fn(),
};

jest.mock('../../services/characterService', () => mockCharacterService);

const characterRouter = require('../characters');

const findHandler = (method, path) => {
  const layer = characterRouter.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }
  return layer.route.stack[layer.route.stack.length - 1].handle;
};

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.end = jest.fn(() => res);
  return res;
};

describe('characters router handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns characters list for GET /', () => {
    const handler = findHandler('get', '/');
    const req = { user: { id: 'user-1' } };
    const res = createRes();
    const characters = [{ id: 'char-1', name: 'Nova' }];
    mockCharacterService.listForUser.mockReturnValue(characters);

    handler(req, res);

    expect(res.json).toHaveBeenCalledWith({ characters });
  });

  it('creates character for POST /', () => {
    const handler = findHandler('post', '/');
    const req = {
      user: { id: 'user-1' },
      body: { name: 'New', prompt: 'Prompt', avatarUrl: null },
    };
    const res = createRes();
    const payload = { id: 'char-2', name: 'New' };
    mockCharacterService.createForUser.mockReturnValue(payload);

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ character: payload });
  });

  it('returns 404 when deleting missing character', () => {
    const handler = findHandler('delete', '/:characterId');
    const req = { user: { id: 'user-1' }, params: { characterId: 'missing' } };
    const res = createRes();
    mockCharacterService.getOwnedCharacter.mockReturnValue(null);

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Character not found.' });
  });
});
