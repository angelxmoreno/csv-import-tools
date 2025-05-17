import { type MetadataFile, SqlType } from '@lib/types';

export const createMockMetadata = (overrides?: Partial<MetadataFile>): MetadataFile => ({
    id: 'mock-id',
    scannedAt: new Date().toISOString(),
    sourceDir: '/mock/source',
    connectionName: 'db1',
    files: [
        {
            fileName: 'file.csv',
            fullPath: '/mock/source/file.csv',
            size: 123,
            headers: ['id'],
            columns: [{ name: 'id', type: SqlType.INT }],
            rowCount: 10,
            tableName: 'file',
            analyzed: true,
            created: false,
            imported: false,
        },
    ],
    ...overrides,
});
