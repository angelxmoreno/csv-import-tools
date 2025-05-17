import { describe, expect, test } from 'bun:test';
import { formatTimestamp, sanitizeTableName } from '@lib/utils';

describe('sanitizeTableName', () => {
    test('removes file extension and converts to lowercase', () => {
        expect(sanitizeTableName('SalesData.CSV')).toBe('salesdata');
    });

    test('replaces spaces and dashes with underscores', () => {
        expect(sanitizeTableName('Quarter-1 Sales Data.csv')).toBe('quarter_1_sales_data');
    });

    test('removes special characters', () => {
        expect(sanitizeTableName('Re@lly$%We!rd-File.csv')).toBe('rellywerd_file');
    });
});

describe('formatTimestamp', () => {
    test('returns an ISO-like string with no colons or dots', () => {
        const ts = formatTimestamp();
        expect(ts).toMatch(/T.*Z/);
        expect(ts).not.toContain(':');
        expect(ts).not.toContain('.');
    });
});
