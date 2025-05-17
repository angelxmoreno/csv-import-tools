import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AppConfig, DbConnectionConfig } from '@lib/types';

const metadataDir = String(Bun.env.METADATA_DIR || 'metadata');
const connectionsPath = String(Bun.env.MYSQL_CONFIG_PATH || 'connections.json');
const connectionsRaw = readFileSync(join(process.cwd(), connectionsPath), 'utf8');
const connections: DbConnectionConfig[] = JSON.parse(connectionsRaw);

export const appConfig: AppConfig = {
    metadataDir,
    connections,
};
