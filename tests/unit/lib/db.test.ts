import { describe, expect, test } from 'bun:test';
import { connectDb } from '@lib/db';
import type { DbConnectionConfig } from '@lib/types';

describe('connectDb (Docker containers)', () => {
    test('connects to MariaDB via Docker', async () => {
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
        const [rows] = await db.raw('SELECT 1 + 1 AS result');
        expect(rows[0].result).toBe(2);
        await db.destroy();
    });

    test('connects to Postgres via Docker', async () => {
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
        const result = await db.raw('SELECT 1 + 1 AS result');
        expect(result.rows[0].result).toBe(2);
        await db.destroy();
    });

    test('connects to SQLite in memory', async () => {
        const config: DbConnectionConfig = {
            name: 'memory-sqlite',
            driver: 'sqlite',
            filename: ':memory:',
        };

        const db = connectDb(config);
        const result = await db.raw('SELECT 1 + 1 AS result');
        expect(result[0].result).toBe(2);
        await db.destroy();
    });
});
