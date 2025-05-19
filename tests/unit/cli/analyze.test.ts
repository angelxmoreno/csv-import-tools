import { describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runAnalyze } from '@cli/analyze';
import { appConfig } from '@config';
import { loadMetadata, saveMetadata } from '@lib/io';
import { SqlType } from '@lib/types';
import { formatTimestamp } from '@lib/utils';
import { createMockMetadata } from '@test/helpers/createMockMetadata';

const csvDir = join(import.meta.dir, 'mock-analyze');
const metadataPath = join(appConfig.metadataDir, `test-${formatTimestamp()}_mock-analyze.json`);
const csvPath = join(csvDir, 'pets.csv');

const metadata = createMockMetadata({
    id: 'mock-analyze',
    sourceDir: csvDir,
    files: [
        {
            fileName: 'pets.csv',
            fullPath: csvPath,
            size: 0,
            headers: [],
            columns: [],
            rowCount: 0,
            tableName: 'pets',
            analyzed: false,
            created: false,
            imported: false,
        },
    ],
});

describe('runAnalyze', () => {
    test('analyzes headers, columns, and row count for each file in metadata', async () => {
        mkdirSync(csvDir, { recursive: true });

        writeFileSync(csvPath, 'id,name,species\n1,Alice,cat\n2,Bob,dog\n3,Charlie,bird\n');
        saveMetadata(metadataPath, metadata);

        await runAnalyze(metadataPath);

        const result = loadMetadata(metadataPath);
        const file = result.files[0];

        expect(file.analyzed).toBe(true);
        expect(file.headers).toEqual(['id', 'name', 'species']);
        expect(file.rowCount).toBe(3);
        expect(file.columns.length).toBe(3);

        const get = (name: string) => {
            const col = file.columns.find((c) => c.name === name);
            if (!col) throw new Error(`Missing column: ${name}`);
            return col;
        };

        expect(get('id').sqlType).toBe(SqlType.INT);
        expect(get('id').csvType).toMatch(/int/i);
        expect(get('name').sqlType).toBe(SqlType.TEXT);
        expect(get('species').nullable).toBe(false);
    });

    test('cleanup', () => {
        rmSync(csvDir, { recursive: true, force: true });
        rmSync(metadataPath, { force: true });
    });
});
