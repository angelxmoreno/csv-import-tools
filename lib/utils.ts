import { basename } from 'node:path';

/**
 * Sanitizes a CSV file name to a valid MySQL table name.
 */
export const sanitizeTableName = (name: string): string =>
    basename(name)
        .replace(/\.[^.]+$/, '') // remove extension
        .toLowerCase()
        .replace(/[\s\-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

/**
 * Returns an ISO-formatted UTC timestamp string.
 */
export const formatTimestamp = (): string => new Date().toISOString().replace(/[:.]/g, '-');
