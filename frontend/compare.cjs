const fs = require('fs');

const zh = require('./src/locales/zh.json');
const en = require('./src/locales/en.json');

function compareKeys(obj1, obj2, path = '') {
  const keys1 = Object.keys(obj1).sort();
  const keys2 = Object.keys(obj2).sort();

  if (keys1.length !== keys2.length) {
    console.error(`Keys length mismatch at ${path}`);
    console.error('In 1 but not 2:', keys1.filter(k => !keys2.includes(k)));
    console.error('In 2 but not 1:', keys2.filter(k => !keys1.includes(k)));
    process.exit(1);
  }

  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i]) {
      console.error(`Key mismatch at ${path}: ${keys1[i]} vs ${keys2[i]}`);
      process.exit(1);
    }

    if (typeof obj1[keys1[i]] === 'object' && typeof obj2[keys2[i]] === 'object') {
      compareKeys(obj1[keys1[i]], obj2[keys2[i]], `${path}.${keys1[i]}`);
    }
  }
}

compareKeys(zh, en);
console.log('Keys match exactly!');
