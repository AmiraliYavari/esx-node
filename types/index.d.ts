declare module 'esx-node' {
  export interface ESXClientTableConfig {
    users?: string;
    identifier?: string;
  }

  export interface ESXClientConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
    table?: ESXClientTableConfig;
  }

  export interface PlayerIdentity {
    firstname: string;
    lastname: string;
    dateofbirth: string;
    sex: string;
    height: number;
  }

  export interface PlayerJob {
    name: string;
    grade: number;
  }

  export interface Accounts {
    money?: number;
    bank?: number;
    black_money?: number;
    [key: string]: number | undefined;
  }

  export interface ESXPlayer {
    identifier: string;
    license?: string;
    accounts: Accounts;
    job?: string;
    job_grade?: number;
    group?: string;
    firstname?: string;
    lastname?: string;
    dateofbirth?: string;
    sex?: string;
    height?: number;
    metadata?: Record<string, any>;
    inventory?: any[];
    [key: string]: any;
  }

  export class ESXClient {
    constructor(config: ESXClientConfig);

    connect(): any;
    close(): Promise<void>;

    playerExists(identifier: string): Promise<boolean>;
    getPlayer(identifier: string): Promise<ESXPlayer | null>;
    getPlayerByLicense(license: string): Promise<ESXPlayer | null>;
    getPlayers(opts?: { limit?: number; offset?: number }): Promise<ESXPlayer[]>;
    searchPlayers(query: string, opts?: { limit?: number }): Promise<ESXPlayer[]>;
    getPlayerIdentity(identifier: string): Promise<PlayerIdentity | null>;

    getAccounts(identifier: string): Promise<Accounts | null>;
    getAccountBalance(identifier: string, account?: string): Promise<number | null>;
    setAccountBalance(identifier: string, account: string, amount: number): Promise<Accounts>;
    addAccountMoney(identifier: string, account: string, amount: number): Promise<Accounts>;
    removeAccountMoney(identifier: string, account: string, amount: number): Promise<Accounts>;

    getMoney(identifier: string): Promise<number | null>;
    getBank(identifier: string): Promise<number | null>;
    addMoney(identifier: string, amount: number): Promise<Accounts>;
    addBank(identifier: string, amount: number): Promise<Accounts>;
    removeMoney(identifier: string, amount: number): Promise<Accounts>;
    removeBank(identifier: string, amount: number): Promise<Accounts>;

    getJob(identifier: string): Promise<PlayerJob | null>;
    setJob(identifier: string, job: string, grade?: number): Promise<PlayerJob>;
    getGroup(identifier: string): Promise<string | null>;
    setGroup(identifier: string, group: string): Promise<string>;

    getMetadata(identifier: string): Promise<Record<string, any> | null>;
    setMetadata(identifier: string, key: string, value: any): Promise<Record<string, any>>;
    getInventory(identifier: string): Promise<any[] | null>;

    query(sql: string, params?: any[]): Promise<any>;
  }

  export interface RCONOptions {
    host: string;
    port?: number;
    password: string;
    timeout?: number;
  }

  export class RCON {
    constructor(options: RCONOptions);
    send(command: string): Promise<string>;
    close(): void;
  }
}
