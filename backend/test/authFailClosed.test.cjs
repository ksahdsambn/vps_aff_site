const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = '0123456789abcdef0123456789abcdef';

const { prisma } = require('../dist/utils/db');
const { auth } = require('../dist/middleware/auth');

function signedToken() {
  return jwt.sign(
    { adminId: 1, username: 'admin', jti: 'test-jti' },
    process.env.JWT_SECRET,
    { expiresIn: 300, algorithm: 'HS256' },
  );
}

function responseSpy() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('rejects authentication when the revocation check is unavailable', async () => {
  prisma.$queryRaw = async () => { throw new Error('database unavailable'); };
  const res = responseSpy();
  let nextCalled = false;

  await auth(
    { headers: { authorization: `Bearer ${signedToken()}` } },
    res,
    () => { nextCalled = true; },
  );

  assert.equal(res.statusCode, 503);
  assert.equal(nextCalled, false);
});

test('rejects authentication when the admin account lookup is unavailable', async () => {
  prisma.$queryRaw = async () => [];
  prisma.admin.findUnique = async () => { throw new Error('database unavailable'); };
  const res = responseSpy();
  let nextCalled = false;

  await auth(
    { headers: { authorization: `Bearer ${signedToken()}` } },
    res,
    () => { nextCalled = true; },
  );

  assert.equal(res.statusCode, 503);
  assert.equal(nextCalled, false);
});
