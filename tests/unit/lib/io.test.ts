import { describe, expect, test } from 'bun:test';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadMetadata, saveMetadata } from '@lib/io';
import { type MetadataFile, SqlType } from '@lib/types';

const tempFile = join(import.meta.dir, 'test-metadata.json');

const sample: MetadataFile = {
    id: '20240517_test',
    scannedAt: '2025-05-17T12:00:00Z',
    sourceDir: '/path/to/csvs',
    files: [
        {
            fileName: 'sample.csv',
            fullPath: '/path/to/csvs/sample.csv',
            size: 1024,
            headers: ['id', 'name'],
            columns: [
                { name: 'id', type: SqlType.INT },
                { name: 'name', type: SqlType.TEXT },
            ],
            rowCount: 100,
            tableName: 'sample',
            analyzed: true,
            created: true,
            imported: false,
        },
    ],
};

describe('lib/io', () => {
    test('saveMetadata writes a JSON file', () => {
        saveMetadata(tempFile, sample);
        const raw = Bun.file(tempFile).text();
        expect(raw).resolves.toMatch(/"fileName": "sample.csv"/);
    });

    test('loadMetadata reads and parses a JSON file', async () => {
        writeFileSync(tempFile, JSON.stringify(sample, null, 2));
        const loaded = loadMetadata(tempFile);
        expect(loaded.id).toBe(sample.id);
        expect(loaded.files[0].tableName).toBe('sample');
    });

    test('saveMetadata + loadMetadata roundtrip', () => {
        saveMetadata(tempFile, sample);
        const reloaded = loadMetadata(tempFile);
        expect(reloaded).toEqual(sample);
    });

    test('cleanup', () => {
        rmSync(tempFile, { force: true });
        expect(Bun.file(tempFile).exists()).resolves.toBe(false);
    });
});
