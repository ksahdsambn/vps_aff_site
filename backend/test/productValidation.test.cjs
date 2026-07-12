const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseStrictPositiveId,
  validateOptionalText,
  validateProductNumber,
} = require('../dist/utils/productValidation');

test('accepts only complete positive decimal IDs', () => {
  assert.equal(parseStrictPositiveId('42'), 42);
  assert.equal(parseStrictPositiveId('42junk'), null);
  assert.equal(parseStrictPositiveId('0'), null);
  assert.equal(parseStrictPositiveId('01'), null);
});

test('rejects fractional CPU and excessive money precision', () => {
  assert.deepEqual(validateProductNumber(1.5, 'cpu', { min: 0, integer: true }), {
    error: 'Field cpu must be an integer',
  });
  assert.deepEqual(validateProductNumber(12.345, 'price', { min: 0, inclusive: true, decimalPlaces: 2 }), {
    error: 'Field price must have at most 2 decimal places',
  });
});

test('normalizes empty optional text to null and rejects overlong input', () => {
  assert.deepEqual(validateOptionalText('   ', 'remark', 500), { value: null });
  assert.deepEqual(validateOptionalText('x'.repeat(501), 'remark', 500), {
    error: 'Field remark must be at most 500 characters',
  });
});
