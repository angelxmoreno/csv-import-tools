import { createReadStream } from 'node:fs';
import { error } from '@lib/logger';
import type { CsvColumn, DbConnectionConfig, SqlType } from '@lib/types';
import { isSqlType } from '@lib/types';
import knex, { type Knex } from 'knex';
import mysql from 'mysql2';
import pg from 'pg';
import { from as copyFrom } from 'pg-copy-streams';

// ---- Unified CSV Import Interface ----

export const importCsvFile = async (config: DbConnectionConfig, tableName: string, csvPath: string): Promise<void> => {
    switch (config.driver) {
        case 'mysql':
            return importMysql(config, tableName, csvPath);
        case 'postgres':
            return importPostgres(config, tableName, csvPath);
        case 'sqlite':
            return importSqlite(config, tableName);
        default:
            throw new Error(`Unsupported DB driver: ${config.driver}`);
    }
};

// ---- MySQL Loader using LOCAL INFILE ----
export const importMysql = async (config: DbConnectionConfig, tableName: string, csvPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            multipleStatements: true,
            supportBigNumbers: true,
            infileStreamFactory: (path) => createReadStream(path),
        } satisfies mysql.ConnectionOptions);

        const query = `
      LOAD DATA LOCAL INFILE ?
      INTO TABLE \`${tableName}\`
      FIELDS TERMINATED BY ',' ENCLOSED BY '"'
      LINES TERMINATED BY '\n'
      IGNORE 1 ROWS
    `;

        connection.query(query, [csvPath], (err) => {
            connection.end();
            if (err) return reject(err);
            resolve();
        });
    });
};

// ---- PostgreSQL Loader using COPY FROM STDIN ----

const importPostgres = async (config: DbConnectionConfig, tableName: string, csvPath: string): Promise<void> => {
    const client = new pg.Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
    });

    await client.connect();

    const stream = client.query(copyFrom(`COPY "${tableName}" FROM STDIN WITH CSV HEADER`));
    const fileStream = createReadStream(csvPath);

    await new Promise<void>((resolve, reject) => {
        fileStream.pipe(stream).on('finish', resolve).on('error', reject);
    });

    await client.end();
};

// ---- SQLite fallback ----

const importSqlite = async (_config: DbConnectionConfig, tableName: string): Promise<void> => {
    error(`[import] ⚠️ Import for SQLite (${tableName}) is not supported yet.`);
};

// ---- DB Connector ----

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

// ---- Table Creator ----

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
            }

            if (col.nullable) {
                builder.nullable();
            } else {
                builder.notNullable();
            }
        }
    });
};
