import { describe, expect, test } from 'bun:test';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { connectDb, createTable, importCsvFile } from '@lib/db';
import { type CsvColumn, type DbConnectionConfig, SqlType } from '@lib/types';

const tableName = 'test_import_table';
const csvPath = join(import.meta.dir, 'test-import.csv');

const columns: CsvColumn[] = [
    { name: 'id', sqlType: SqlType.INT, csvType: 'INT', nullable: false },
    { name: 'name', sqlType: SqlType.TEXT, csvType: 'VARCHAR', nullable: false },
    { name: 'score', sqlType: SqlType.FLOAT, csvType: 'FLOAT', nullable: false },
    { name: 'is_active', sqlType: SqlType.BOOLEAN, csvType: 'BOOLEAN', nullable: false },
    { name: 'created_at', sqlType: SqlType.TIMESTAMP, csvType: 'TIMESTAMP', nullable: false },
];

const csvContent = `id,name,score,is_active,created_at
1,Alice,89.5,1,2023-01-01T00:00:00
2,Bob,76.3,0,2023-02-01T00:00:00
`;

async function testImportCsv(config: DbConnectionConfig) {
    writeFileSync(csvPath, csvContent);

    const db = connectDb(config);
    await db.schema.dropTableIfExists(tableName);
    await createTable(db, tableName, columns);
    await importCsvFile(config, tableName, csvPath);

    const rows = await db(tableName).select('*');
    expect(rows.length).toBe(2);
    expect(rows[0].name).toBe('Alice');
    expect(rows[1].name).toBe('Bob');
    expect(typeof rows[0].score).toBe('number');
    expect(rows[0].is_active).not.toBeNull();

    await db.schema.dropTableIfExists(tableName);
    await db.destroy();
}

describe('connectDb + createTable + importCsvFile', () => {
    test('MariaDB: creates table and imports CSV via LOAD DATA LOCAL INFILE', async () => {
        const config: DbConnectionConfig = {
            name: 'docker-mariadb',
            driver: 'mysql',
            host: 'localhost',
            port: Number(Bun.env.MYSQL_PORT),
            user: 'mariadb',
            password: 'mariadb',
            database: 'mariadb',
        };

        await testImportCsv(config);
    });

    test('Postgres: creates table and imports CSV via COPY FROM STDIN', async () => {
        const config: DbConnectionConfig = {
            name: 'docker-postgres',
            driver: 'postgres',
            host: 'localhost',
            port: Number(Bun.env.POSTGRES_PORT),
            user: 'postgres',
            password: 'postgres',
            database: 'postgres',
        };

        await testImportCsv(config);
    });

    test('SQLite: skips import and logs warning', async () => {
        const config: DbConnectionConfig = {
            name: 'memory-sqlite',
            driver: 'sqlite',
            filename: ':memory:',
        };

        writeFileSync(csvPath, csvContent);

        const db = connectDb(config);
        await db.schema.dropTableIfExists(tableName);
        await createTable(db, tableName, columns);
        await importCsvFile(config, tableName, csvPath);

        const rows = await db(tableName).select('*');
        expect(rows.length).toBe(0);
        await db.destroy();
    });

    test('cleanup', () => {
        rmSync(csvPath, { force: true });
    });
});
