import { describe, expect, spyOn, test } from 'bun:test';
import { error, log, warn } from '@lib/logger';

describe('logger', () => {
    test('log() prints an info message with tag', () => {
        const spy = spyOn(console, 'log');

        log('Loading complete', { tag: 'scan' });

        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toContain('[scan]');
        expect(spy.mock.calls[0][0]).toContain('Loading complete');

        spy.mockRestore();
    });

    test('warn() prints with structured data', () => {
        const spy = spyOn(console, 'log');

        warn('Possible type conflict', {
            tag: 'analyze',
            data: { column: 'price', example: ['string', 'float'] },
        });

        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.mock.calls[0][0]).toContain('[analyze]');
        expect(spy.mock.calls[1][0]).toContain('"column": "price"');

        spy.mockRestore();
    });

    test('error() prints error message with no data', () => {
        const spy = spyOn(console, 'log');

        error('Import failed');

        expect(spy).toHaveBeenCalledWith(expect.stringContaining('Import failed'));

        spy.mockRestore();
    });
});
