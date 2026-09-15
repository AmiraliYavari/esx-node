'use strict';

const assert = require('assert');
const { safeJsonParse } = require('../src/utils');
const { ESXClient } = require('../src/index');

function run() {
  // safeJsonParse
  assert.deepStrictEqual(safeJsonParse('{"bank":100}'), { bank: 100 });
  assert.deepStrictEqual(safeJsonParse(null, {}), {});
  assert.deepStrictEqual(safeJsonParse({ bank: 5 }), { bank: 5 });
  assert.deepStrictEqual(safeJsonParse('not-json', { fallback: true }), { fallback: true });

  // ساخت instance بدون اتصال واقعی به دیتابیس (فقط بررسی ساختار کلاس)
  const client = new ESXClient({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'esx_test',
  });

  assert.strictEqual(client.usersTable, 'users');
  assert.strictEqual(client.identifierColumn, 'identifier');
  assert.strictEqual(typeof client.getPlayer, 'function');
  assert.strictEqual(typeof client.addMoney, 'function');

  console.log('esxclient.test.js: OK');
}

run();
