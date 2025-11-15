const mockDb = {
  getSessionOwnedByUser: jest.fn(),
};

jest.mock('../../../db', () => mockDb);

const { requireSessionForUser } = require('../requireSession');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('requireSessionForUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('returns 400 when sessionId missing', () => {
    const middleware = requireSessionForUser(() => null);
    const req = { user: { id: 'user-1' } };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'sessionId is required.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 when req.user missing', () => {
    const middleware = requireSessionForUser(() => 'session-1');
    const req = {};
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unable to load session context.' });
  });

  it('returns 404 when session not found', () => {
    const middleware = requireSessionForUser(() => 'missing');
    const req = { user: { id: 'user-1' } };
    const res = createMockRes();
    const next = jest.fn();
    mockDb.getSessionOwnedByUser.mockReturnValue(null);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Session not found.' });
  });

  it('attaches session and calls next when found', () => {
    const middleware = requireSessionForUser(() => 'session-1');
    const req = { user: { id: 'user-1' } };
    const res = createMockRes();
    const next = jest.fn();
    const session = { id: 'session-1', title: 'Chat' };
    mockDb.getSessionOwnedByUser.mockReturnValue(session);

    middleware(req, res, next);

    expect(req.session).toEqual(session);
    expect(next).toHaveBeenCalled();
  });
});
