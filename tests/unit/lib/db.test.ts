import { describe, expect, test } from 'bun:test';
import { connectDb, createTable } from '@lib/db';
import type { CsvColumn, DbConnectionConfig } from '@lib/types';
import { SqlType } from '@lib/types';

const tableName = 'test_table';

const columns: CsvColumn[] = [
    { name: 'id', type: SqlType.INT },
    { name: 'name', type: SqlType.TEXT },
    { name: 'score', type: SqlType.FLOAT },
    { name: 'is_active', type: SqlType.BOOLEAN },
    { name: 'created_at', type: SqlType.TIMESTAMP },
];

describe('connectDb + createTable (Docker containers)', () => {
    test('MariaDB: connects and creates a table', async () => {
        const config: DbConnectionConfig = {
            name: 'docker-mariadb',
            driver: 'mysql',
            host: 'localhost',
            port: Number(Bun.env.MYSQL_PORT),
            user: 'mariadb',
            password: 'mariadb',
            database: 'mariadb',
        };

        const db = connectDb(config);
        await db.schema.dropTableIfExists(tableName);
        await createTable(db, tableName, columns);
        const exists = await db.schema.hasTable(tableName);
        expect(exists).toBe(true);
        await db.destroy();
    });

    test('Postgres: connects and creates a table', async () => {
        const config: DbConnectionConfig = {
            name: 'docker-postgres',
            driver: 'postgres',
            host: 'localhost',
            port: Number(Bun.env.POSTGRES_PORT),
            user: 'postgres',
            password: 'postgres',
            database: 'postgres',
        };

        const db = connectDb(config);
        await db.schema.dropTableIfExists(tableName);
        await createTable(db, tableName, columns);
        const exists = await db.schema.hasTable(tableName);
        expect(exists).toBe(true);
        await db.destroy();
    });

    test('SQLite: connects and creates a table', async () => {
        const config: DbConnectionConfig = {
            name: 'memory-sqlite',
            driver: 'sqlite',
            filename: ':memory:',
        };

        const db = connectDb(config);
        await db.schema.dropTableIfExists(tableName);
        await createTable(db, tableName, columns);
        const exists = await db.schema.hasTable(tableName);
        expect(exists).toBe(true);
        await db.destroy();
    });
});
