const mockCharacterService = {
  listOwned: jest.fn(),
  listPublished: jest.fn(),
  createForUser: jest.fn(),
  updateForUser: jest.fn(),
  removeForUser: jest.fn(),
  publishForUser: jest.fn(),
  unpublishForUser: jest.fn(),
};

jest.mock('../../services/characterService', () => mockCharacterService);

jest.mock('../../middleware/requireUser', () => {
  const pass = () => (req, res, next) => next();
  return {
    requireUserFromQuery: pass,
    requireUserFromBody: pass,
    requireUserFromBodyOrQuery: pass,
  };
});

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

  it('returns owned lists for GET /', () => {
    const handler = findHandler('get', '/');
    const req = { user: { id: 'user-1' } };
    const res = createRes();
    mockCharacterService.listOwned.mockReturnValue([{ id: 'owned' }]);

    handler(req, res);

    expect(res.json).toHaveBeenCalledWith({ owned: [{ id: 'owned' }] });
  });

  it('returns published characters for GET /published', () => {
    const handler = findHandler('get', '/published');
    const req = { user: { id: 'user-1' } };
    const res = createRes();
    mockCharacterService.listPublished.mockReturnValue([{ id: 'pub' }]);

    handler(req, res);

    expect(res.json).toHaveBeenCalledWith({ characters: [{ id: 'pub' }] });
  });

  it('creates character for POST /', () => {
    const handler = findHandler('post', '/');
    const req = {
      user: { id: 'user-1' },
      body: { name: 'New', prompt: 'Prompt', avatarUrl: null, shortDescription: 'desc' },
    };
    const res = createRes();
    const payload = { id: 'char-2', name: 'New' };
    mockCharacterService.createForUser.mockReturnValue(payload);

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ character: payload });
  });

  it('updates character for PATCH /:characterId', () => {
    const handler = findHandler('patch', '/:characterId');
    const req = {
      user: { id: 'user-1' },
      params: { characterId: 'char-1' },
      body: { name: 'Nova', prompt: 'Prompt', avatarUrl: null },
    };
    const res = createRes();
    mockCharacterService.updateForUser.mockReturnValue({ id: 'char-1', name: 'Nova' });

    handler(req, res);

    expect(mockCharacterService.updateForUser).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ character: { id: 'char-1', name: 'Nova' } });
  });

  it('publishes a character for POST /:characterId/publish', () => {
    const handler = findHandler('post', '/:characterId/publish');
    const req = { user: { id: 'user-1' }, params: { characterId: 'char-1' } };
    const res = createRes();
    mockCharacterService.publishForUser.mockReturnValue({ id: 'char-1', status: 'published' });

    handler(req, res);

    expect(res.json).toHaveBeenCalledWith({ character: { id: 'char-1', status: 'published' } });
  });

  it('returns 404 when deleting missing character', () => {
    const handler = findHandler('delete', '/:characterId');
    const req = { user: { id: 'user-1' }, params: { characterId: 'missing' } };
    const res = createRes();
    mockCharacterService.removeForUser.mockReturnValue(false);

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Character not found.' });
  });
});
