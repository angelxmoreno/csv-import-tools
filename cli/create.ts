import { appConfig } from '@config';
import { connectDb, createTable } from '@lib/db';
import { loadMetadata, requireConnectionName, saveMetadata } from '@lib/io';
import { error, log } from '@lib/logger';
import { selectConnection, selectMetadataFile } from '@lib/prompts';
import type { Command } from 'commander';

/**
 * Runs the create command logic (used in CLI and tests)
 */
export const runCreate = async (filePath: string): Promise<void> => {
    const metadata = loadMetadata(filePath);

    // Prompt for a connection name if not already set
    if (!metadata.connectionName) {
        metadata.connectionName = await selectConnection(appConfig.connections);
    }

    const connection = appConfig.connections.find((c) => c.name === requireConnectionName(metadata));
    if (!connection) {
        throw new Error(`No connection config found for "${metadata.connectionName}"`);
    }

    const db = connectDb(connection);

    for (const file of metadata.files) {
        if (file.created) continue;

        if (!file.analyzed || !file.columns.length) {
            throw new Error(`File "${file.fileName}" has not been analyzed`);
        }

        log(`[create] 🏗️  Creating table: ${file.tableName}`);
        await createTable(db, file.tableName, file.columns);
        file.created = true;
        log(`[create] ✅ Created: ${file.tableName}`);
    }

    await db.destroy();
    saveMetadata(filePath, metadata);
    log(`[create] 📝 Updated metadata: ${filePath}`);
};

/**
 * Commander binding
 */
export const registerCreateCommand = (program: Command) => {
    program
        .command('create')
        .description('Create SQL tables from analyzed CSV metadata')
        .action(async () => {
            try {
                const filePath = await selectMetadataFile('create', appConfig.metadataDir);
                await runCreate(filePath);
            } catch (err) {
                error(`[create] ❌ ${String(err)}`);
                process.exit(1);
            }
        });
};
