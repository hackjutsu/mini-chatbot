const mockSessionService = {
  listForUser: jest.fn(),
  createForUser: jest.fn(),
  getTranscriptForSession: jest.fn(),
  renameSession: jest.fn(),
  deleteSessionForUser: jest.fn(),
  CHARACTER_NOT_FOUND: 'CHARACTER_NOT_FOUND',
};

jest.mock('../../services/sessionService', () => mockSessionService);

const sessionRouter = require('../sessions');

const findRouteHandler = (method, path) => {
  const layer = sessionRouter.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }
  // last handler is actual controller (after middleware)
  return layer.route.stack[layer.route.stack.length - 1].handle;
};

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.end = jest.fn(() => res);
  return res;
};

describe('sessions router handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('responds with sessions for GET /', () => {
    const handler = findRouteHandler('get', '/');
    const req = { user: { id: 'user-1' } };
    const res = createRes();
    const sessions = [{ id: 'sess-1', title: 'Test' }];
    mockSessionService.listForUser.mockReturnValue(sessions);

    handler(req, res);

    expect(res.json).toHaveBeenCalledWith({ sessions });
    expect(mockSessionService.listForUser).toHaveBeenCalledWith('user-1');
  });

  it('creates session for POST / and returns service payload', () => {
    const handler = findRouteHandler('post', '/');
    const req = { user: { id: 'user-1' }, body: { title: 'New session' } };
    const res = createRes();
    const payload = { id: 'sess-2', title: 'New session', character: null };
    mockSessionService.createForUser.mockReturnValue(payload);

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ session: payload });
  });

  it('maps CHARACTER_NOT_FOUND to 400 error on POST /', () => {
    const handler = findRouteHandler('post', '/');
    const req = { user: { id: 'user-1' }, body: { title: 'oops', characterId: 'missing' } };
    const res = createRes();
    const error = new Error('Missing');
    error.code = mockSessionService.CHARACTER_NOT_FOUND;
    mockSessionService.createForUser.mockImplementation(() => {
      throw error;
    });

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Character not found for user.' });
  });
});
