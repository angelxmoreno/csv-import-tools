import { appConfig } from '@config';
import { analyzeCsv } from '@lib/duckdb';
import { loadMetadata, saveMetadata } from '@lib/io';
import { error, log } from '@lib/logger';
import { selectMetadataFile } from '@lib/prompts';
import type { Command } from 'commander';

/**
 * Testable function that performs analysis on all unanalyzed CSVs in a metadata file.
 * @param filePath Full path to the metadata file
 */
export const runAnalyze = async (filePath: string): Promise<void> => {
    const metadata = loadMetadata(filePath);

    for (const file of metadata.files) {
        if (file.analyzed) continue;

        log(`[analyze] 📊 ${file.fileName}`);
        const result = await analyzeCsv(file.fullPath);

        file.headers = result.headers;
        file.columns = result.columns;
        file.rowCount = result.rowCount;
        file.analyzed = true;

        log(`[analyze] ✅ ${file.fileName}: ${result.rowCount} rows`);
    }

    saveMetadata(filePath, metadata);
    log(`[analyze] 📝 Updated metadata: ${filePath}`);
};

/**
 * Commander wrapper to register the analyze CLI command.
 */
export const registerAnalyzeCommand = (program: Command) => {
    program
        .command('analyze')
        .description('Analyze scanned CSVs with DuckDB')
        .action(async () => {
            try {
                const filePath = await selectMetadataFile('analyze', appConfig.metadataDir);
                await runAnalyze(filePath);
            } catch (err) {
                error(`[analyze] ❌ ${String(err)}`);
                process.exit(1);
            }
        });
};
