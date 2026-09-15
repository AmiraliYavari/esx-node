'use strict';

// تست ساده و بدون نیاز به سرور واقعی: فقط بررسی می‌کند سازنده‌ی کلاس خطای اعتبارسنجی را درست پرتاب می‌کند.
const assert = require('assert');
const { RCON } = require('../src/index');

function run() {
  assert.throws(() => new RCON({}), /host الزامی/);
  assert.throws(() => new RCON({ host: '127.0.0.1' }), /password الزامی/);

  const rcon = new RCON({ host: '127.0.0.1', password: 'test', port: 30120 });
  assert.strictEqual(rcon.host, '127.0.0.1');
  assert.strictEqual(rcon.port, 30120);

  console.log('rcon.test.js: OK');
}

run();
