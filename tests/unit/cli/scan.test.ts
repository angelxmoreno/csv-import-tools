import { describe, expect, test } from 'bun:test';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runScan } from '@cli/scan';
import { appConfig } from '@config';
import { loadMetadata } from '@lib/io';

const tmpDir = join(import.meta.dir, 'mock-dir');
const tmpFile = join(import.meta.dir, 'mock-file.txt');
const csvPath = join(tmpDir, 'sample.csv');

describe('runScan', () => {
    test('creates metadata file for valid directory with CSV', async () => {
        mkdirSync(tmpDir, { recursive: true });
        writeFileSync(csvPath, 'name,age\nAlice,30\nBob,25\n');

        await runScan(tmpDir);

        const files = readdirSync(appConfig.metadataDir).filter((f) => f.endsWith('.json'));
        const latest = files.sort().pop(); // get most recent metadata file
        expect(latest).toBeTruthy();

        const metadataPath = join(appConfig.metadataDir, String(latest));
        const metadata = loadMetadata(metadataPath);
        expect(metadata.sourceDir).toContain('mock-dir');
        expect(metadata.files.length).toBe(1);
        expect(metadata.files[0].fileName).toBe('sample.csv');
    });

    test('throws if the path is a file', async () => {
        writeFileSync(tmpFile, 'hello');
        expect(runScan(tmpFile)).rejects.toThrow('not a directory');
    });

    test('throws if the path does not exist', async () => {
        const badPath = join(import.meta.dir, 'does-not-exist');
        expect(runScan(badPath)).rejects.toThrow('Invalid path');
    });

    test('cleanup', () => {
        rmSync(tmpFile, { force: true });
        rmSync(tmpDir, { recursive: true });
    });
});
