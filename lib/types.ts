export enum SqlType {
    INT = 'INT',
    BIGINT = 'BIGINT',
    FLOAT = 'FLOAT',
    DOUBLE = 'DOUBLE',
    TEXT = 'TEXT',
    DATE = 'DATE',
    DATETIME = 'DATETIME',
    BOOLEAN = 'TINYINT(1)',
}

export const isSqlType = (value: string): value is SqlType => {
    return Object.values(SqlType).includes(value as SqlType);
};

export interface CsvColumn {
    name: string;
    type: SqlType;
}

export interface CsvFileMetadata {
    fileName: string;
    fullPath: string;
    size: number;
    headers: string[];
    columns: CsvColumn[];
    rowCount: number;
    tableName: string;
    analyzed: boolean;
    created: boolean;
    imported: boolean;
}

export interface MetadataFile {
    id: string;
    scannedAt: string;
    sourceDir: string;
    files: CsvFileMetadata[];
    connectionName?: string; // ← optional until set
}

export interface DbConnectionConfig {
    name: string;
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
}

export interface AppConfig {
    metadataDir: string;
    connections: DbConnectionConfig[];
}

export interface CsvAnalysisResult {
    headers: string[];
    types: string[];
    rowCount: number;
}
