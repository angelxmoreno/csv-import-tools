import { describe, expect, mock, spyOn, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { selectConnection, selectMetadataFile } from '@lib/prompts';
import type { DbConnectionConfig } from '@lib/types';
import { createMockMetadata } from '@test/helpers/createMockMetadata';
import inquirer from 'inquirer';

const mockDir = join(import.meta.dir, 'mock-meta');
const filePath = join(mockDir, 'meta.json');

describe('lib/prompts', () => {
    test('selectMetadataFile returns the chosen file path', async () => {
        mkdirSync(mockDir, { recursive: true });
        const mockMeta = createMockMetadata();
        writeFileSync(filePath, JSON.stringify(mockMeta, null, 2));
        const spy = spyOn(inquirer, 'prompt').mockResolvedValue({ file: filePath });

        const selected = await selectMetadataFile('create', mockDir);
        expect(selected).toBe(filePath);

        spy.mockRestore();
        rmSync(mockDir, { recursive: true });
    });

    test('selectConnection returns selected connection name', async () => {
        const mockConnections: DbConnectionConfig[] = [
            { name: 'db1', host: 'localhost', user: 'root', password: '', database: 'test' },
            { name: 'db2', host: 'remote', user: 'user', password: 'secret', database: 'data' },
        ];
        const spy = spyOn(inquirer, 'prompt').mockResolvedValue({ connectionName: 'db2' });

        const selected = await selectConnection(mockConnections);
        expect(selected).toBe('db2');

        spy.mockRestore();
    });
});
