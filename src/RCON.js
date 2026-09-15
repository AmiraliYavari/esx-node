'use strict';

const dgram = require('dgram');

/**
 * پیاده‌سازی پروتکل RCON سرور FiveM (مبتنی بر پروتکل Quake3 روی UDP).
 * برای اجرای دستورات کنسول روی سرور زنده FiveM استفاده می‌شود
 * (مثلاً برای اجرای export یا trigger event به یک ریسورس لوآ که کارهای ESX را انجام دهد).
 *
 * توجه: باید در server.cfg سرور مقدار زیر تنظیم شده باشد:
 *   rcon_password "your_password"
 */
class RCON {
  /**
   * @param {object} options
   * @param {string} options.host آدرس سرور FiveM
   * @param {number} [options.port=30120] پورت سرور FiveM
   * @param {string} options.password رمز rcon_password تنظیم‌شده در server.cfg
   * @param {number} [options.timeout=4000] زمان انتظار پاسخ به میلی‌ثانیه
   */
  constructor(options = {}) {
    if (!options.host) throw new Error('RCON: پارامتر host الزامی است');
    if (!options.password) throw new Error('RCON: پارامتر password الزامی است');

    this.host = options.host;
    this.port = options.port || 30120;
    this.password = options.password;
    this.timeout = options.timeout || 4000;
  }

  /**
   * ارسال یک دستور کنسول به سرور FiveM
   * @param {string} command مثال: 'say hello' یا 'esx:setjob "license:xxxx" police 0'
   * @returns {Promise<string>} خروجی متنی که سرور برمی‌گرداند
   */
  send(command) {
    return new Promise((resolve, reject) => {
      const socket = dgram.createSocket('udp4');
      let settled = false;

      const finish = (err, result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          socket.close();
        } catch (_) {
          /* noop */
        }
        if (err) reject(err);
        else resolve(result);
      };

      const timer = setTimeout(() => {
        // خیلی از دستورات (مثل say) پاسخی برنمی‌گردانند؛ این حالت را خطا حساب نمی‌کنیم
        finish(null, '');
      }, this.timeout);

      const payload = Buffer.concat([
        Buffer.from([0xff, 0xff, 0xff, 0xff]),
        Buffer.from(`rcon "${this.password}" ${command}\n`, 'utf8'),
      ]);

      socket.once('error', (err) => finish(err));

      socket.once('message', (msg) => {
        // پاسخ سرور با 4 بایت 0xFF و رشته "print\n" شروع می‌شود
        let text = msg.toString('utf8');
        text = text.replace(/^\xff\xff\xff\xffprint\n?/, '');
        finish(null, text.trim());
      });

      socket.send(payload, this.port, this.host, (err) => {
        if (err) finish(err);
      });
    });
  }

  /**
   * بستن دستی (در این پیاده‌سازی هر send سوکت خودش را می‌بندد، این متد صرفاً برای سازگاری API است)
   */
  close() {
    /* هر فراخوانی send سوکت مخصوص به خودش را باز و بسته می‌کند */
  }
}

module.exports = RCON;
