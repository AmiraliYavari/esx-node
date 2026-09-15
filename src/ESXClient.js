'use strict';

const Database = require('./db');
const { safeJsonParse } = require('./utils');

/**
 * کلاینت اصلی برای خواندن و ویرایش دیتای پلیرهای ESX Legacy در دیتابیس MySQL.
 *
 * ساختار جدول‌ها در ورژن‌های مختلف ESX Legacy کمی تفاوت دارد (مخصوصاً inventory که
 * در ورژن‌های جدید به ریسورس ox_inventory/esx_inventory منتقل شده). به همین دلیل
 * نام جدول‌ها و ستون‌ها قابل تنظیم است تا با اسکیمای سرور شما سازگار باشد.
 */
class ESXClient {
  /**
   * @param {object} config
   * @param {string} config.host
   * @param {string} config.user
   * @param {string} config.password
   * @param {string} config.database
   * @param {number} [config.port=3306]
   * @param {object} [config.table] نام‌گذاری سفارشی جدول/ستون‌ها در صورت نیاز
   * @param {string} [config.table.users='users']
   * @param {string} [config.table.identifier='identifier']
   */
  constructor(config = {}) {
    const { table = {}, ...dbConfig } = config;

    this.usersTable = table.users || 'users';
    this.identifierColumn = table.identifier || 'identifier';

    this.db = new Database(dbConfig);
  }

  /** اتصال به دیتابیس (اختیاری، اولین کوئری هم به‌طور خودکار اتصال برقرار می‌کند) */
  connect() {
    return this.db.connect();
  }

  /** بستن اتصال دیتابیس */
  close() {
    return this.db.close();
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  _normalizeUser(row) {
    if (!row) return null;
    return {
      ...row,
      accounts: safeJsonParse(row.accounts, {}),
      metadata: 'metadata' in row ? safeJsonParse(row.metadata, {}) : undefined,
      inventory: 'inventory' in row ? safeJsonParse(row.inventory, []) : undefined,
    };
  }

  async _getRawUser(identifier) {
    const rows = await this.db.query(
      `SELECT * FROM \`${this.usersTable}\` WHERE \`${this.identifierColumn}\` = ? LIMIT 1`,
      [identifier]
    );
    return rows[0] || null;
  }

  // ---------------------------------------------------------------------
  // Players
  // ---------------------------------------------------------------------

  /** آیا پلیر با این identifier در دیتابیس وجود دارد */
  async playerExists(identifier) {
    const row = await this._getRawUser(identifier);
    return !!row;
  }

  /** گرفتن اطلاعات کامل یک پلیر بر اساس identifier */
  async getPlayer(identifier) {
    const row = await this._getRawUser(identifier);
    return this._normalizeUser(row);
  }

  /** گرفتن اطلاعات کامل یک پلیر بر اساس license (با یا بدون پیشوند license:) */
  async getPlayerByLicense(license) {
    const normalized = license.startsWith('license:') ? license : `license:${license}`;
    const rows = await this.db.query(
      `SELECT * FROM \`${this.usersTable}\` WHERE \`license\` = ? LIMIT 1`,
      [normalized]
    );
    return this._normalizeUser(rows[0]);
  }

  /** گرفتن لیست تمام پلیرها (احتیاط: روی دیتابیس بزرگ ممکن است سنگین باشد) */
  async getPlayers({ limit = 100, offset = 0 } = {}) {
    const rows = await this.db.query(
      `SELECT * FROM \`${this.usersTable}\` LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows.map((row) => this._normalizeUser(row));
  }

  /** جستجوی پلیر بر اساس نام یا نام‌خانوادگی */
  async searchPlayers(query, { limit = 25 } = {}) {
    const like = `%${query}%`;
    const rows = await this.db.query(
      `SELECT * FROM \`${this.usersTable}\`
       WHERE \`firstname\` LIKE ? OR \`lastname\` LIKE ? OR \`${this.identifierColumn}\` LIKE ?
       LIMIT ?`,
      [like, like, like, limit]
    );
    return rows.map((row) => this._normalizeUser(row));
  }

  /** هویت پلیر (نام، نام‌خانوادگی، تاریخ تولد، جنسیت، قد) */
  async getPlayerIdentity(identifier) {
    const row = await this._getRawUser(identifier);
    if (!row) return null;
    const { firstname, lastname, dateofbirth, sex, height } = row;
    return { firstname, lastname, dateofbirth, sex, height };
  }

  // ---------------------------------------------------------------------
  // Money / Accounts (money, bank, black_money, ...)
  // ---------------------------------------------------------------------

  /** گرفتن تمام حساب‌های مالی پلیر (money, bank, black_money, ...) */
  async getAccounts(identifier) {
    const row = await this._getRawUser(identifier);
    if (!row) return null;
    return safeJsonParse(row.accounts, {});
  }

  /** گرفتن موجودی یک حساب خاص، پیش‌فرض bank */
  async getAccountBalance(identifier, account = 'bank') {
    const accounts = await this.getAccounts(identifier);
    if (!accounts) return null;
    return accounts[account] ?? 0;
  }

  async _writeAccounts(identifier, accounts) {
    await this.db.query(
      `UPDATE \`${this.usersTable}\` SET \`accounts\` = ? WHERE \`${this.identifierColumn}\` = ?`,
      [JSON.stringify(accounts), identifier]
    );
    return accounts;
  }

  /** ست‌کردن مستقیم مقدار یک حساب */
  async setAccountBalance(identifier, account, amount) {
    const accounts = (await this.getAccounts(identifier)) || {};
    accounts[account] = Math.max(0, Math.floor(amount));
    return this._writeAccounts(identifier, accounts);
  }

  /** افزودن پول به یک حساب */
  async addAccountMoney(identifier, account, amount) {
    const accounts = (await this.getAccounts(identifier)) || {};
    accounts[account] = Math.max(0, Math.floor((accounts[account] || 0) + amount));
    return this._writeAccounts(identifier, accounts);
  }

  /** کسر پول از یک حساب (تا صفر، منفی نمی‌شود) */
  async removeAccountMoney(identifier, account, amount) {
    const accounts = (await this.getAccounts(identifier)) || {};
    accounts[account] = Math.max(0, Math.floor((accounts[account] || 0) - amount));
    return this._writeAccounts(identifier, accounts);
  }

  // میان‌برهای رایج
  getMoney = (identifier) => this.getAccountBalance(identifier, 'money');
  getBank = (identifier) => this.getAccountBalance(identifier, 'bank');
  addMoney = (identifier, amount) => this.addAccountMoney(identifier, 'money', amount);
  addBank = (identifier, amount) => this.addAccountMoney(identifier, 'bank', amount);
  removeMoney = (identifier, amount) => this.removeAccountMoney(identifier, 'money', amount);
  removeBank = (identifier, amount) => this.removeAccountMoney(identifier, 'bank', amount);

  // ---------------------------------------------------------------------
  // Job / Group
  // ---------------------------------------------------------------------

  /** گرفتن شغل و گرید فعلی پلیر */
  async getJob(identifier) {
    const row = await this._getRawUser(identifier);
    if (!row) return null;
    return { name: row.job, grade: row.job_grade };
  }

  /** تغییر شغل پلیر (فقط در دیتابیس؛ برای اعمال زنده روی پلیر آنلاین از RCON استفاده کنید) */
  async setJob(identifier, job, grade = 0) {
    await this.db.query(
      `UPDATE \`${this.usersTable}\` SET \`job\` = ?, \`job_grade\` = ? WHERE \`${this.identifierColumn}\` = ?`,
      [job, grade, identifier]
    );
    return { name: job, grade };
  }

  /** گرفتن گروه دسترسی پلیر (user, admin, mod, ...) */
  async getGroup(identifier) {
    const row = await this._getRawUser(identifier);
    return row ? row.group : null;
  }

  /** تغییر گروه دسترسی پلیر */
  async setGroup(identifier, group) {
    await this.db.query(
      `UPDATE \`${this.usersTable}\` SET \`group\` = ? WHERE \`${this.identifierColumn}\` = ?`,
      [group, identifier]
    );
    return group;
  }

  // ---------------------------------------------------------------------
  // Metadata / Inventory (فقط در صورتی که این ستون‌ها در جدول users شما وجود داشته باشند)
  // ---------------------------------------------------------------------

  /** گرفتن metadata پلیر (ستون JSON اضافه‌شده در ورژن‌های جدیدتر ESX) */
  async getMetadata(identifier) {
    const row = await this._getRawUser(identifier);
    if (!row || !('metadata' in row)) return null;
    return safeJsonParse(row.metadata, {});
  }

  /** نوشتن یک مقدار خاص در metadata پلیر */
  async setMetadata(identifier, key, value) {
    const metadata = (await this.getMetadata(identifier)) || {};
    metadata[key] = value;
    await this.db.query(
      `UPDATE \`${this.usersTable}\` SET \`metadata\` = ? WHERE \`${this.identifierColumn}\` = ?`,
      [JSON.stringify(metadata), identifier]
    );
    return metadata;
  }

  /**
   * گرفتن اینونتوری پلیر. توجه: این فقط برای ورژن‌های قدیمی‌تر ESX Legacy که
   * اینونتوری را در همان جدول users نگه می‌دارند کار می‌کند. اگر از ox_inventory
   * یا esx_inventory جداگانه استفاده می‌کنید باید از جدول آن ریسورس بخوانید.
   */
  async getInventory(identifier) {
    const row = await this._getRawUser(identifier);
    if (!row || !('inventory' in row)) return null;
    return safeJsonParse(row.inventory, []);
  }

  // ---------------------------------------------------------------------
  // Raw escape hatch
  // ---------------------------------------------------------------------

  /** اجرای مستقیم یک کوئری دلخواه در صورت نیاز به کاری خارج از این API */
  async query(sql, params = []) {
    return this.db.query(sql, params);
  }
}

module.exports = ESXClient;
