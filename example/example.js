'use strict';

const { ESXClient, RCON } = require('../src/index');

async function main() {
  // ۱) اتصال به دیتابیس ESX Legacy
  const esx = new ESXClient({
    host: '127.0.0.1',
    user: 'root',
    password: 'your_mysql_password',
    database: 'esx_database',
    port: 3306,
  });

  const identifier = 'license:0000000000000000000000000000000000000000';

  // بررسی وجود پلیر
  if (await esx.playerExists(identifier)) {
    // گرفتن اطلاعات کامل
    const player = await esx.getPlayer(identifier);
    console.log('پلیر:', player);

    // موجودی بانک و پول نقد
    console.log('موجودی بانک:', await esx.getBank(identifier));
    console.log('پول نقد:', await esx.getMoney(identifier));

    // افزودن پول به بانک
    await esx.addBank(identifier, 5000);

    // تغییر شغل
    await esx.setJob(identifier, 'police', 2);

    // هویت پلیر
    console.log('هویت:', await esx.getPlayerIdentity(identifier));
  } else {
    console.log('پلیری با این identifier پیدا نشد.');
  }

  await esx.close();

  // ۲) اجرای دستور روی سرور زنده FiveM از طریق RCON
  const rcon = new RCON({
    host: '127.0.0.1',
    port: 30120,
    password: 'your_rcon_password',
  });

  const response = await rcon.send('say "سلام از طریق Node.js"');
  console.log('پاسخ RCON:', response);
}

main().catch((err) => {
  console.error('خطا:', err);
  process.exit(1);
});
