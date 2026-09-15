# esx-node

> GitHub: https://github.com/AmiraliYavari/esx-node

کتابخانه‌ی Node.js برای کار با فریم‌ورک **FiveM ESX Legacy** از بیرون سرور FiveM — مناسب برای ساخت:

- ربات دیسکورد (چک موجودی بانک، شغل، جابجایی پول و ...)
- پنل وب مدیریت سرور (وب‌سایت، داشبورد ادمین)
- اسکریپت‌های اتوماسیون و گزارش‌گیری

دو بخش اصلی دارد:

1. **`ESXClient`** — اتصال مستقیم به دیتابیس MySQL سرور ESX برای خواندن/ویرایش اطلاعات پلیرها (پول، بانک، شغل، هویت، گروه، متادیتا).
2. **`RCON`** — اجرای دستورات کنسول روی سرور زنده‌ی FiveM (برای مواردی که باید روی پلیر آنلاین بلافاصله اثر بگذارد، مثل `say`، اجرای export یا trigger event از طریق یک ریسورس لوآ کمکی).

> ⚠️ **نکته‌ی مهم درباره‌ی اسکیما:** ساختار جدول `users` بین ورژن‌های مختلف ESX Legacy کمی فرق می‌کند (مخصوصاً inventory که در نسخه‌های جدید به ریسورس‌های جدا مثل `ox_inventory` منتقل شده است). قبل از استفاده در پروداکشن، اسکیمای دیتابیس خودتان را با فیلدهایی که این کتابخانه استفاده می‌کند (`accounts`, `job`, `job_grade`, `group`, `metadata`, ...) مقایسه کنید. نام جدول و ستون identifier هم قابل تنظیم است (به بخش پیکربندی نگاه کنید).

## نصب

```bash
npm install esx-node
```

## شروع سریع

```js
const { ESXClient, RCON } = require('esx-node');

const esx = new ESXClient({
  host: '127.0.0.1',
  user: 'root',
  password: 'مقدار_رمز_دیتابیس',
  database: 'esx_database',
  port: 3306, // اختیاری، پیش‌فرض 3306
});

(async () => {
  const identifier = 'license:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  const player = await esx.getPlayer(identifier);
  console.log(player);

  await esx.addBank(identifier, 5000);
  await esx.setJob(identifier, 'police', 2);

  await esx.close();
})();
```

## پیکربندی نام جدول/ستون (در صورت تفاوت اسکیما)

```js
const esx = new ESXClient({
  host: '127.0.0.1',
  user: 'root',
  password: '...',
  database: 'esx_database',
  table: {
    users: 'users',        // نام جدول کاربران
    identifier: 'identifier', // نام ستون شناسه یکتا
  },
});
```

## متدهای `ESXClient`

### پلیرها

| متد | توضیح |
|---|---|
| `playerExists(identifier)` | بررسی وجود پلیر |
| `getPlayer(identifier)` | گرفتن رکورد کامل پلیر (accounts/metadata/inventory به‌صورت JSON پارس‌شده) |
| `getPlayerByLicense(license)` | جستجو بر اساس license |
| `getPlayers({ limit, offset })` | گرفتن لیست پلیرها با صفحه‌بندی |
| `searchPlayers(query, { limit })` | جستجو بر اساس نام/نام‌خانوادگی/identifier |
| `getPlayerIdentity(identifier)` | نام، نام‌خانوادگی، تاریخ تولد، جنسیت، قد |

### پول و حساب‌ها

| متد | توضیح |
|---|---|
| `getAccounts(identifier)` | کل آبجکت accounts (`money`, `bank`, `black_money`, ...) |
| `getAccountBalance(identifier, account='bank')` | موجودی یک حساب خاص |
| `setAccountBalance(identifier, account, amount)` | ست‌کردن مستقیم موجودی |
| `addAccountMoney(identifier, account, amount)` | افزودن پول |
| `removeAccountMoney(identifier, account, amount)` | کسر پول (تا صفر) |
| `getMoney/getBank/addMoney/addBank/removeMoney/removeBank` | میان‌برهای رایج برای حساب‌های `money` و `bank` |

### شغل و گروه دسترسی

| متد | توضیح |
|---|---|
| `getJob(identifier)` | `{ name, grade }` |
| `setJob(identifier, job, grade=0)` | تغییر شغل |
| `getGroup(identifier)` | گروه دسترسی (user/admin/mod/...) |
| `setGroup(identifier, group)` | تغییر گروه دسترسی |

### متادیتا / اینونتوری (بسته به اسکیمای سرور شما)

| متد | توضیح |
|---|---|
| `getMetadata(identifier)` | خواندن ستون JSON مربوط به metadata |
| `setMetadata(identifier, key, value)` | نوشتن یک کلید داخل metadata |
| `getInventory(identifier)` | فقط برای اسکیمای قدیمی‌تر که inventory داخل جدول users است |

### دسترسی خام

| متد | توضیح |
|---|---|
| `query(sql, params)` | اجرای هر کوئری دلخواه (prepared statement) |

## `RCON`

برای اجرای دستور روی سرور زنده‌ی FiveM (مثلاً `say`، یا trigger کردن یک ریسورس لوآ که در `server.cfg` تنظیم شده و از via `TriggerEvent` کارهای ESX را انجام می‌دهد):

```js
const { RCON } = require('esx-node');

const rcon = new RCON({
  host: '127.0.0.1',
  port: 30120,          // پورت سرور FiveM
  password: 'rcon_password_شما', // همان مقدار rcon_password در server.cfg
  timeout: 4000,         // اختیاری، میلی‌ثانیه
});

const response = await rcon.send('say "سلام از Node.js"');
console.log(response);
```

> برای اینکه RCON کار کند باید در `server.cfg` سرور مقدار `rcon_password "..."` تنظیم شده و پورت مربوطه در فایروال باز باشد.

## چرا این کتابخانه به دیتابیس مستقیم وصل می‌شود؟

FiveM هیچ API بیرونی رسمی برای خواندن/نوشتن دیتای ESX ندارد؛ تنها راه‌های ارتباط از بیرون سرور، دیتابیس MySQL مشترک (برای دیتای persistent) و RCON (برای اثرگذاری آنی روی سرور در حال اجرا) هستند. این کتابخانه دقیقاً همین دو راه را در قالب یک API تمیز و async/await در اختیار شما می‌گذارد.

## لایسنس

MIT
