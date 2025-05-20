import type { CsvColumn, DbConnectionConfig, SqlType } from '@lib/types';
import { isSqlType } from '@lib/types';
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

export const createTable = async (db: Knex, tableName: string, columns: CsvColumn[]): Promise<void> => {
    const exists = await db.schema.hasTable(tableName);
    if (exists) {
        throw new Error(`Table '${tableName}' already exists`);
    }

    await db.schema.createTable(tableName, (table) => {
        for (const col of columns) {
            const sqlType = col.sqlType as SqlType;

            if (!isSqlType(sqlType)) {
                throw new Error(`Unknown data type: '${col.sqlType}'`);
            }

            let builder: Knex.ColumnBuilder;

            switch (sqlType) {
                case 'INT':
                    builder = table.integer(col.name);
                    break;
                case 'BIGINT':
                    builder = table.bigInteger(col.name);
                    break;
                case 'FLOAT':
                    builder = table.float(col.name);
                    break;
                case 'DOUBLE':
                    builder = table.double(col.name);
                    break;
                case 'TEXT':
                    builder = table.text(col.name);
                    break;
                case 'BOOLEAN':
                    builder = table.boolean(col.name);
                    break;
                case 'DATE':
                    builder = table.date(col.name);
                    break;
                case 'TIMESTAMP':
                    builder = table.timestamp(col.name);
                    break;
                default:
                    builder = table.specificType(col.name, sqlType);
                    break;
            }

            // Apply nullability
            if (col.nullable) {
                builder.nullable();
            } else {
                builder.notNullable();
            }
        }
    });
};
