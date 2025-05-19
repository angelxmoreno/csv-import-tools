import type { DbConnectionConfig } from '@lib/types';
import knex, { type Knex } from 'knex';

export const connectDb = (config: DbConnectionConfig): Knex => {
    const client = (() => {
        switch (config.driver) {
            case 'mysql':
                return 'mysql2';
            case 'postgres':
                return 'pg';
            case 'sqlite':
                return 'sqlite3';
            default:
                throw new Error(`Unsupported DB driver: ${config.driver}`);
        }
    })();

    const connection =
        config.driver === 'sqlite'
            ? { filename: config.filename }
            : {
                  host: config.host,
                  port: config.port,
                  user: config.user,
                  password: config.password,
                  database: config.database,
              };

    return knex({
        client,
        connection,
        useNullAsDefault: config.driver === 'sqlite',
    });
};
