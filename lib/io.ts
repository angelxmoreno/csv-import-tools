import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { basename, join } from 'node:path';
import { appConfig } from '@config';
import type { MetadataFile } from '@lib/types';
import { formatTimestamp, sanitizeTableName } from '@lib/utils';

export const generateMetadataFilePath = (sourceDir: string): { id: string; path: string } => {
    const slug = sanitizeTableName(basename(sourceDir) || 'scan');
    const id = `${formatTimestamp()}_${slug}`;
    const path = join(appConfig.metadataDir, `${id}.json`);
    return { id, path };
};

export const requireConnectionName = (meta: MetadataFile): string => {
    if (!meta.connectionName) {
        throw new Error(`Metadata file is missing 'connectionName'`);
    }
    return meta.connectionName;
};

export const loadMetadata = (filePath: string): MetadataFile => {
    const absPath = resolve(filePath);
    const raw = readFileSync(absPath, 'utf8');
    return JSON.parse(raw);
};

export const saveMetadata = (filePath: string, data: MetadataFile): void => {
    const absPath = resolve(filePath);
    const pretty = JSON.stringify(data, null, 2);
    writeFileSync(absPath, pretty, 'utf8');
};
