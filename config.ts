import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AppConfig, DbConnectionConfig } from '@lib/types';

const metadataDir = String(Bun.env.METADATA_DIR || 'metadata');
const connectionsPath = String(Bun.env.MYSQL_CONFIG_PATH || 'connections.json');
let connections: DbConnectionConfig[] = [];
const fullPath = join(process.cwd(), connectionsPath);

if (existsSync(fullPath)) {
    const raw = readFileSync(fullPath, 'utf8');
    connections = JSON.parse(raw);
}

export const appConfig: AppConfig = {
    metadataDir,
    connections,
};
