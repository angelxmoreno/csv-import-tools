import { describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeCsv } from '@lib/duckdb';

const testDir = join(import.meta.dir, 'mock-csv');
const csvPath = join(testDir, 'simple.csv');

describe('analyzeCsv', () => {
    test('correctly analyzes headers, types, and row count', async () => {
        mkdirSync(testDir, { recursive: true });

        writeFileSync(csvPath, 'id,name,age\n1,Alice,30\n2,Bob,25\n3,Charlie,40\n');

        const result = await analyzeCsv(csvPath);

        expect(result.headers).toEqual(['id', 'name', 'age']);
        expect(result.types.length).toBe(3);
        expect(result.rowCount).toBe(3);
    });

    test('cleanup', () => {
        rmSync(testDir, { recursive: true, force: true });
    });
});
