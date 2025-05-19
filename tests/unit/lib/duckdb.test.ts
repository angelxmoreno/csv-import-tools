import { describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeCsv } from '@lib/duckdb';
import { SqlType } from '@lib/types';

const testDir = join(import.meta.dir, 'mock-csv');
const csvPath = join(testDir, 'full-types.csv');

describe('analyzeCsv full type coverage', () => {
    test('detects all supported SqlTypes with correct nullability', async () => {
        mkdirSync(testDir, { recursive: true });

        writeFileSync(
            csvPath,
            'id,name,price,is_active,created_on,created_at\n' +
                '1,Alice,10.5,true,2023-01-01,2023-01-01T10:30:00\n' +
                '2,Bob,99.99,false,2023-01-02,2023-01-02T08:15:00\n' +
                '3,Charlie,42.0,true,2023-01-03,2023-01-03T09:45:00\n'
        );

        const result = await analyzeCsv(csvPath);

        const get = (name: string) => {
            const col = result.columns.find((col) => col.name === name);
            if (!col) throw new Error(`Column "${name}" not found`);
            return col;
        };

        expect(get('id').sqlType).toBe(SqlType.INT);
        expect(get('name').sqlType).toBe(SqlType.TEXT);
        expect([SqlType.FLOAT, SqlType.DOUBLE]).toContain(get('price').sqlType);
        expect(get('is_active').sqlType).toBe(SqlType.BOOLEAN);
        expect(get('created_on').sqlType).toBe(SqlType.DATE);
        expect(get('created_at').sqlType).toBe(SqlType.TIMESTAMP);

        expect(result.rowCount).toBe(3);
        expect(result.columns.length).toBe(6);
    });

    test('cleanup', () => {
        rmSync(testDir, { recursive: true, force: true });
    });
});
