import type { CsvColumn, DbConnectionConfig } from '@lib/types';
import knex, { type Knex } from 'knex';

export const createTable = async (db: Knex, tableName: string, columns: CsvColumn[]): Promise<void> => {
    const exists = await db.schema.hasTable(tableName);
    if (exists) {
        throw new Error(`Table '${tableName}' already exists`);
    }

    await db.schema.createTable(tableName, (table) => {
        for (const col of columns) {
            switch (col.type) {
                case 'INT':
                    table.integer(col.name);
                    break;
                case 'FLOAT':
                    table.float(col.name);
                    break;
                case 'TEXT':
                    table.text(col.name);
                    break;
                case 'BOOLEAN':
                    table.boolean(col.name);
                    break;
                case 'DATE':
                    table.date(col.name);
                    break;
                case 'TIMESTAMP':
                    table.timestamp(col.name);
                    break;
                default:
                    table.specificType(col.name, col.type); // fallback
            }
        }
    });
};

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
