const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldSeedSampleProducts } = require('../dist/utils/seedData');

test('runtime seed defaults to no sample products', () => {
  assert.equal(shouldSeedSampleProducts(), false);
  assert.equal(shouldSeedSampleProducts({}), false);
});

test('sample products require an explicit opt-in', () => {
  assert.equal(shouldSeedSampleProducts({ includeSampleProducts: true }), true);
});
