const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ADMIN_SESSION_COOKIE,
  getAdminSessionToken,
  hasAdminSessionCookie,
} = require('../dist/utils/sessionCookie');

test('prefers an explicit Bearer token for API clients', () => {
  const req = {
    headers: {
      authorization: 'Bearer api-token',
      cookie: `${ADMIN_SESSION_COOKIE}=cookie-token`,
    },
  };
  assert.equal(getAdminSessionToken(req), 'api-token');
});

test('reads only the named admin session cookie', () => {
  const req = {
    headers: { cookie: `other=value; ${ADMIN_SESSION_COOKIE}=cookie-token` },
  };
  assert.equal(getAdminSessionToken(req), 'cookie-token');
  assert.equal(hasAdminSessionCookie(req), true);
});
