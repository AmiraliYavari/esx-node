# esx-node

Node.js library for interacting with **FiveM ESX Legacy** from outside the game server — perfect for Discord bots, admin dashboards, and automation scripts.

It gives you two things:

- **`ESXClient`** — direct access to the ESX MySQL database: read and update player money, bank, job, identity, permission group, and metadata.
- **`RCON`** — send console commands to a live FiveM server (e.g. `say`, or trigger a Lua resource that reacts to the command).

> **Schema note:** the `users` table layout varies slightly between ESX Legacy versions (inventory in particular has moved to separate resources like `ox_inventory` in newer versions). Check your server's schema against the fields this library uses (`accounts`, `job`, `job_grade`, `group`, `metadata`) before using it in production. Table and column names are configurable — see below.

## Install

```bash
npm install esx-node
```

## Quick start

```js
const { ESXClient, RCON } = require('esx-node');

const esx = new ESXClient({
  host: '127.0.0.1',
  user: 'root',
  password: 'your_db_password',
  database: 'esx_database',
  port: 3306, // optional, defaults to 3306
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

## Custom table/column names

```js
const esx = new ESXClient({
  host: '127.0.0.1',
  user: 'root',
  password: '...',
  database: 'esx_database',
  table: {
    users: 'users',        // users table name
    identifier: 'identifier', // unique identifier column
  },
});
```

## `ESXClient` methods

### Players

| Method | Description |
|---|---|
| `playerExists(identifier)` | Check if a player exists |
| `getPlayer(identifier)` | Full player record (`accounts`/`metadata`/`inventory` parsed from JSON) |
| `getPlayerByLicense(license)` | Look up by license |
| `getPlayers({ limit, offset })` | Paginated player list |
| `searchPlayers(query, { limit })` | Search by name/lastname/identifier |
| `getPlayerIdentity(identifier)` | Firstname, lastname, date of birth, sex, height |

### Money & accounts

| Method | Description |
|---|---|
| `getAccounts(identifier)` | Full `accounts` object (`money`, `bank`, `black_money`, ...) |
| `getAccountBalance(identifier, account='bank')` | Balance of a specific account |
| `setAccountBalance(identifier, account, amount)` | Set a balance directly |
| `addAccountMoney(identifier, account, amount)` | Add funds |
| `removeAccountMoney(identifier, account, amount)` | Remove funds (floors at 0) |
| `getMoney/getBank/addMoney/addBank/removeMoney/removeBank` | Shortcuts for `money` and `bank` accounts |

### Job & permission group

| Method | Description |
|---|---|
| `getJob(identifier)` | `{ name, grade }` |
| `setJob(identifier, job, grade=0)` | Change job |
| `getGroup(identifier)` | Permission group (user/admin/mod/...) |
| `setGroup(identifier, group)` | Change permission group |

### Metadata / inventory (depends on your schema)

| Method | Description |
|---|---|
| `getMetadata(identifier)` | Read the `metadata` JSON column |
| `setMetadata(identifier, key, value)` | Write a single key into `metadata` |
| `getInventory(identifier)` | Only works on older schemas that keep inventory on the `users` table |

### Raw access

| Method | Description |
|---|---|
| `query(sql, params)` | Run any custom query (prepared statement) |

## `RCON`

Send a command to a live FiveM server (e.g. `say`, or trigger a Lua resource that does ESX-specific work via `TriggerEvent`):

```js
const { RCON } = require('esx-node');

const rcon = new RCON({
  host: '127.0.0.1',
  port: 30120,           // FiveM server port
  password: 'your_rcon_password', // must match rcon_password in server.cfg
  timeout: 4000,          // optional, ms
});

const response = await rcon.send('say "Hello from Node.js"');
console.log(response);
```

> For RCON to work, `rcon_password "..."` must be set in your `server.cfg` and the port must be reachable through your firewall.

## Why does this connect directly to the database?

FiveM has no official external API for reading/writing ESX data. The only ways to talk to it from outside the server are the shared MySQL database (for persistent data) and RCON (for affecting a running server immediately). This library wraps both in a clean, `async/await` API.

## License

Apache License 2.0