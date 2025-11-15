const mockDb = {
  getUserById: jest.fn(),
};

jest.mock('../../../db', () => mockDb);

const {
  requireUserFromBody,
  requireUserFromQuery,
  requireUserFromBodyOrQuery,
} = require('../requireUser');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('requireUser middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when userId missing in body', () => {
    const middleware = requireUserFromBody();
    const req = { body: {} };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'userId is required.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 when user not found', () => {
    const middleware = requireUserFromBody();
    const req = { body: { userId: 'missing' } };
    const res = createMockRes();
    const next = jest.fn();
    mockDb.getUserById.mockReturnValue(null);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches user and calls next for query middleware', () => {
    const middleware = requireUserFromQuery();
    const req = { query: { userId: 'user-1' } };
    const res = createMockRes();
    const next = jest.fn();
    const user = { id: 'user-1', username: 'test' };
    mockDb.getUserById.mockReturnValue(user);

    middleware(req, res, next);

    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalled();
  });

  it('checks body or query when using combined middleware', () => {
    const middleware = requireUserFromBodyOrQuery();
    const req = { body: {}, query: { userId: 'user-2' } };
    const res = createMockRes();
    const next = jest.fn();
    const user = { id: 'user-2' };
    mockDb.getUserById.mockReturnValue(user);

    middleware(req, res, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });
});
