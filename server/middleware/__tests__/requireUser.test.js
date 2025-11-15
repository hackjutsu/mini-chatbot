const userService = require('../../services/userService');
const { requireUserFromBody, requireUserFromQuery, requireUserFromBodyOrQuery } = require('../requireUser');

jest.mock('../../services/userService', () => ({
  getById: jest.fn(),
  getByUsername: jest.fn(),
}));

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('requireUser middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 for missing body userId', async () => {
    const middleware = requireUserFromBody();
    const req = { body: {} };
    const res = createRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'userId is required.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 when user not found', async () => {
    const middleware = requireUserFromQuery();
    const req = { query: { userId: 'missing' } };
    const res = createRes();
    const next = jest.fn();
    userService.getById.mockResolvedValue(null);

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found.' });
  });

  it('attaches user when found', async () => {
    const middleware = requireUserFromQuery();
    const req = { query: { userId: 'user-1' } };
    const res = createRes();
    const next = jest.fn();
    const user = { id: 'user-1' };
    userService.getById.mockResolvedValue(user);

    await middleware(req, res, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });

  it('checks query when body is empty', async () => {
    const middleware = requireUserFromBodyOrQuery();
    const req = { body: {}, query: { userId: 'user-2' } };
    const res = createRes();
    const next = jest.fn();
    userService.getById.mockResolvedValue({ id: 'user-2' });

    await middleware(req, res, next);

    expect(userService.getById).toHaveBeenCalledWith('user-2');
    expect(next).toHaveBeenCalled();
  });
});
