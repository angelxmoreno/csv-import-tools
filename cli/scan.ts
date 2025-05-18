import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { generateMetadataFilePath, saveMetadata } from '@lib/io';
import { error, log } from '@lib/logger';
import type { MetadataFile } from '@lib/types';
import { sanitizeTableName } from '@lib/utils';
import type { Command } from 'commander';

export const runScan = async (inputDir: string): Promise<void> => {
    const absPath = resolve(inputDir);

    try {
        const stats = statSync(absPath);
        if (!stats.isDirectory()) throw new Error(`Path is not a directory: ${absPath}`);
    } catch (err) {
        throw new Error(`Invalid path: ${absPath}\n${String(err)}`);
    }

    log(`Scanning directory: ${absPath}`);

    const files = readdirSync(absPath)
        .filter((f) => f.toLowerCase().endsWith('.csv'))
        .map((f) => {
            const fullPath = join(absPath, f);
            const stat = statSync(fullPath);
            return {
                fileName: f,
                fullPath,
                size: stat.size,
                headers: [],
                columns: [],
                rowCount: 0,
                tableName: sanitizeTableName(f),
                analyzed: false,
                created: false,
                imported: false,
            };
        });

    const { id, path } = generateMetadataFilePath(absPath);
    const metadata: MetadataFile = {
        id,
        scannedAt: new Date().toISOString(),
        sourceDir: absPath,
        files,
    };
    saveMetadata(path, metadata);
    log(`[scan] ✅ Saved ${files.length} CSVs to ${path}`);
};

export const registerScanCommand = (program: Command) => {
    program
        .command('scan <dir>')
        .description('Scan a directory of CSV files and create metadata')
        .action(async (dir: string) => {
            try {
                await runScan(dir);
            } catch (err) {
                error(String(err));
                process.exit(1);
            }
        });
};
