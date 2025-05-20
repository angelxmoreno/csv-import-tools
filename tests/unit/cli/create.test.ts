import { describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runCreate } from '@cli/create';
import { appConfig } from '@config';
import { connectDb } from '@lib/db';
import { loadMetadata, saveMetadata } from '@lib/io';
import { SqlType } from '@lib/types';
import { formatTimestamp } from '@lib/utils';
import { createMockMetadata } from '@test/helpers/createMockMetadata';

const csvDir = join(import.meta.dir, 'mock-create');
const metadataPath = join(appConfig.metadataDir, `test-${formatTimestamp()}_mock-create.json`);
const csvPath = join(csvDir, 'records.csv');

const metadata = createMockMetadata({
    id: 'mock-create',
    sourceDir: csvDir,
    connectionName: 'docker-mariadb',
    files: [
        {
            fileName: 'records.csv',
            fullPath: csvPath,
            size: 0,
            headers: ['id', 'name', 'created_at'],
            columns: [
                { name: 'id', sqlType: SqlType.INT, csvType: 'INT', nullable: false },
                { name: 'name', sqlType: SqlType.TEXT, csvType: 'VARCHAR', nullable: true },
                { name: 'created_at', sqlType: SqlType.TIMESTAMP, csvType: 'TIMESTAMP', nullable: false },
            ],
            rowCount: 3,
            tableName: 'records',
            analyzed: true,
            created: false,
            imported: false,
        },
    ],
});

describe('runCreate', () => {
    test('creates tables for all analyzed files and updates metadata', async () => {
        mkdirSync(csvDir, { recursive: true });

        writeFileSync(csvPath, 'id,name,created_at\n1,Alice,2023-01-01T00:00:00\n');
        saveMetadata(metadataPath, metadata);

        const conn = appConfig.connections.find((c) => c.name === 'docker-mariadb');
        if (!conn) throw new Error('Connection config "docker-mariadb" not found');

        const db = connectDb(conn);
        await db.schema.dropTableIfExists('records');
        await db.destroy();

        await runCreate(metadataPath);

        const updated = loadMetadata(metadataPath);
        expect(updated.files[0].created).toBe(true);

        const db2 = connectDb(conn);
        const exists = await db2.schema.hasTable('records');
        expect(exists).toBe(true);
        await db2.destroy();
    });

    test('cleanup', async () => {
        const conn = appConfig.connections.find((c) => c.name === 'docker-mariadb');
        if (!conn) throw new Error('Connection config "docker-mariadb" not found');

        const db = connectDb(conn);
        await db.schema.dropTableIfExists('records');
        await db.destroy();

        rmSync(csvDir, { recursive: true, force: true });
        rmSync(metadataPath, { force: true });
    });
});
