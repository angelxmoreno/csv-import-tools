import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadMetadata } from '@lib/io';
import type { DbConnectionConfig, MetadataFile } from '@lib/types';
import inquirer from 'inquirer';

/**
 * Prompts the user to select a metadata file suitable for the given stage.
 * Filters out invalid choices based on file analysis/creation/import state.
 */
export const selectMetadataFile = async (
    stage: 'analyze' | 'create' | 'import',
    metadataDir: string
): Promise<string> => {
    const files = readdirSync(metadataDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => {
            const fullPath = join(metadataDir, f);
            const meta: MetadataFile = loadMetadata(fullPath);

            const valid = meta.files.every((file) => {
                if (stage === 'analyze') return !file.analyzed;
                if (stage === 'create') return file.analyzed && !file.created && !!meta.connectionName;
                if (stage === 'import') return file.created && !file.imported && !!meta.connectionName;
                return false;
            });

            return {
                name: `${f} — ${meta.sourceDir} (${meta.files.length} files)`,
                value: fullPath,
                disabled: valid ? false : 'Not ready',
            };
        });

    const { file } = await inquirer.prompt([
        {
            type: 'list',
            name: 'file',
            message: `Select a metadata file for ${stage}:`,
            choices: files,
        },
    ]);

    return file;
};

/**
 * Prompts the user to choose a database connection profile by name.
 * Used to assign a connectionName into the metadata before creation/import.
 */
export const selectConnection = async (connections: DbConnectionConfig[]): Promise<string> => {
    const { connectionName } = await inquirer.prompt([
        {
            type: 'list',
            name: 'connectionName',
            message: 'Select the database connection to use:',
            choices: connections.map((conn) => ({
                name: `${conn.name} (${conn.host})`,
                value: conn.name,
            })),
        },
    ]);

    return connectionName;
};
