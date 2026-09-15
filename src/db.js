'use strict';

const mysql = require('mysql2/promise');

/**
 * لایه‌ی نازک روی mysql2 برای مدیریت pool اتصال به دیتابیس ESX Legacy
 */
class Database {
  /**
   * @param {import('mysql2').PoolOptions} config
   */
  constructor(config) {
    this._config = config;
    this._pool = null;
  }

  /**
   * ساخت pool اتصال (در صورتی که از قبل ساخته نشده باشد)
   */
  connect() {
    if (!this._pool) {
      this._pool = mysql.createPool({
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ...this._config,
      });
    }
    return this._pool;
  }

  /**
   * اجرای یک کوئری با پارامترهای امن (prepared statement)
   * @param {string} sql
   * @param {any[]} params
   */
  async query(sql, params = []) {
    if (!this._pool) this.connect();
    const [rows] = await this._pool.execute(sql, params);
    return rows;
  }

  /**
   * بستن اتصال به دیتابیس
   */
  async close() {
    if (this._pool) {
      await this._pool.end();
      this._pool = null;
    }
  }
}

module.exports = Database;
