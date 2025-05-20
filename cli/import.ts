import { appConfig } from '@config';
import { connectDb, importCsvFile } from '@lib/db';
import { loadMetadata, requireConnectionName, saveMetadata } from '@lib/io';
import { error, log } from '@lib/logger';
import { selectMetadataFile } from '@lib/prompts';
import type { Command } from 'commander';

/**
 * Testable handler for the import logic.
 */
export const runImport = async (filePath: string): Promise<void> => {
    const metadata = loadMetadata(filePath);
    const connectionName = requireConnectionName(metadata);
    const connection = appConfig.connections.find((c) => c.name === connectionName);

    if (!connection) {
        throw new Error(`No connection config found for "${connectionName}"`);
    }

    const db = connectDb(connection);

    for (const file of metadata.files) {
        if (file.imported) continue;
        if (!file.created) {
            throw new Error(`File "${file.fileName}" has not been created in DB yet`);
        }

        log(`[import] 📥 Importing: ${file.fileName}`);
        await importCsvFile(connection, file.tableName, file.fullPath);
        file.imported = true;
        log(`[import] ✅ Imported: ${file.fileName}`);
    }

    await db.destroy();
    saveMetadata(filePath, metadata);
    log(`[import] 📝 Updated metadata: ${filePath}`);
};

/**
 * Register the CLI command with Commander
 */
export const registerImportCommand = (program: Command) => {
    program
        .command('import')
        .description('Import created CSVs into the database')
        .action(async () => {
            try {
                const filePath = await selectMetadataFile('import', appConfig.metadataDir);
                await runImport(filePath);
            } catch (err) {
                error(`[import] ❌ ${String(err)}`);
                process.exit(1);
            }
        });
};
