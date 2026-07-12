const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getClientIp,
  getClientIpKey,
  getLoginUsernameKey,
} = require('../dist/middleware/rateLimiter');

test('does not trust a client-provided X-Forwarded-For value', () => {
  const req = {
    ip: '10.0.0.8',
    headers: { 'x-forwarded-for': '203.0.113.44' },
    socket: { remoteAddress: '10.0.0.8' },
  };

  assert.equal(getClientIp(req), '10.0.0.8');
  assert.equal(getClientIpKey(req), '10.0.0.8');
});

test('uses one normalized username key regardless of the claimed client IP', () => {
  const first = {
    body: { username: '  Admin ' },
    ip: '198.51.100.10',
    headers: {},
    socket: { remoteAddress: '198.51.100.10' },
  };
  const second = {
    body: { username: 'admin' },
    ip: '203.0.113.99',
    headers: {},
    socket: { remoteAddress: '203.0.113.99' },
  };

  assert.equal(getLoginUsernameKey(first), 'admin');
  assert.equal(getLoginUsernameKey(first), getLoginUsernameKey(second));
});
