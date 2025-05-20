import { describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runImport } from '@cli/import';
import { appConfig } from '@config';
import { connectDb, createTable } from '@lib/db';
import { loadMetadata, saveMetadata } from '@lib/io';
import { SqlType } from '@lib/types';
import { formatTimestamp } from '@lib/utils';
import { createMockMetadata } from '@test/helpers/createMockMetadata';

const csvDir = join(import.meta.dir, 'mock-import');
const metadataPath = join(appConfig.metadataDir, `test-${formatTimestamp()}_mock-import.json`);
const csvPath = join(csvDir, 'data.csv');
const tableName = 'data';

const metadata = createMockMetadata({
    id: 'mock-import',
    sourceDir: csvDir,
    connectionName: 'docker-mariadb',
    files: [
        {
            fileName: 'data.csv',
            fullPath: csvPath,
            size: 0,
            headers: ['id', 'name'],
            columns: [
                { name: 'id', sqlType: SqlType.INT, csvType: 'INT', nullable: false },
                { name: 'name', sqlType: SqlType.TEXT, csvType: 'VARCHAR', nullable: false },
            ],
            rowCount: 2,
            tableName,
            analyzed: true,
            created: true,
            imported: false,
        },
    ],
});

describe('runImport', () => {
    test('imports rows into the database from CSV', async () => {
        mkdirSync(csvDir, { recursive: true });
        writeFileSync(csvPath, 'id,name\n1,Alice\n2,Bob\n');
        saveMetadata(metadataPath, metadata);

        const connection = appConfig.connections.find((c) => c.name === 'docker-mariadb');
        if (!connection) throw new Error('Missing mariadb connection in config');

        const db = connectDb(connection);
        await db.schema.dropTableIfExists(tableName);
        await createTable(db, tableName, metadata.files[0].columns);
        await db.destroy();

        await runImport(metadataPath);

        const result = loadMetadata(metadataPath);
        const file = result.files[0];

        expect(file.imported).toBe(true);
    });

    test('cleanup', () => {
        rmSync(csvPath, { force: true });
        rmSync(csvDir, { recursive: true, force: true });
        rmSync(metadataPath, { force: true });
    });
});
