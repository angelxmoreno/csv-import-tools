import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadMetadata } from '@lib/io';
import type { DbConnectionConfig, MetadataFile } from '@lib/types';
import inquirer from 'inquirer';

function shouldDisableFile(meta: MetadataFile, stage: 'analyze' | 'create' | 'import'): false | string {
    if (stage === 'create') {
        const valid = meta.files.every((file) => file.analyzed && !file.created);
        return valid ? false : 'Not ready';
    }

    if (stage === 'import') {
        const valid = meta.files.every((file) => file.created && !file.imported && !!meta.connectionName);
        return valid ? false : 'Not ready';
    }

    return false;
}

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

            const allAnalyzed = meta.files.every((file) => file.analyzed);
            const status = stage === 'analyze' && allAnalyzed ? '✅ Complete. Re-analyze' : '';

            return {
                name: `${f} — ${meta.sourceDir} (${meta.files.length} files) ${status}`,
                value: fullPath,
                disabled: shouldDisableFile(meta, stage),
            };
        });

    const enabledChoices = files.filter((f) => !f.disabled);
    if (enabledChoices.length === 0) {
        throw new Error('No valid metadata files found for this stage.');
    }

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
