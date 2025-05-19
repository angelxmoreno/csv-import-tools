import type { CsvAnalysisResult, CsvColumn } from '@lib/types';
import { SqlType } from '@lib/types';
import { type Connection, Database, type RowData } from 'duckdb-async';

const mapDuckDbTypeToSqlType = (duckType: string): SqlType => {
    const type = duckType.toUpperCase();

    if (type.includes('INT')) return SqlType.INT;
    if (type === 'BIGINT') return SqlType.BIGINT;
    if (type === 'DOUBLE' || type === 'REAL') return SqlType.DOUBLE;
    if (type === 'FLOAT') return SqlType.FLOAT;
    if (type === 'DATE') return SqlType.DATE;
    if (type === 'TIMESTAMP' || type === 'DATETIME') return SqlType.TIMESTAMP;

    return SqlType.TEXT; // fallback for VARCHAR, UNKNOWN, etc.
};

export const analyzeCsv = async (filePath: string): Promise<CsvAnalysisResult> => {
    const db = await Database.create(':memory:');
    const conn = await db.connect();

    // Create a streaming view from the CSV
    await conn.run(`CREATE VIEW temp_view AS SELECT * FROM read_csv_auto('${filePath}', HEADER=TRUE)`);

    // Extract headers and raw DuckDB types
    const pragma = await conn.all(`PRAGMA table_info('temp_view')`);
    const headers = pragma.map((col: RowData) => col.name);
    const types = pragma.map((col: RowData) => col.type);

    // Count total rows
    const [{ count }] = await conn.all(`SELECT COUNT(*) as count
                                      FROM temp_view`);
    const rowCount = Number(count);

    // Detect nullable and boolean columns
    const columns: CsvColumn[] = [];

    for (let i = 0; i < headers.length; i++) {
        const name = headers[i];
        const rawType = types[i];

        const nullable = await isNullable(conn, 'temp_view', name);
        const isBoolean = await isBooleanColumn(conn, 'temp_view', name);

        const sqlType = isBoolean ? SqlType.BOOLEAN : mapDuckDbTypeToSqlType(rawType);
        columns.push({
            name,
            sqlType,
            csvType: rawType,
            nullable,
        });
    }

    await conn.close();

    return {
        headers,
        rowCount,
        columns,
    };
};

export const isNullable = async (conn: Connection, table: string, column: string): Promise<boolean> => {
    const [{ count }] = await conn.all(`
        SELECT COUNT(*) as count
        FROM "${table}"
        WHERE TRIM(CAST("${column}" AS VARCHAR)) = ''
    `);

    return Number(count) > 0;
};

export const isBooleanColumn = async (conn: Connection, table: string, column: string): Promise<boolean> => {
    const distinct = await conn.all(`
        SELECT DISTINCT "${column}" as value
        FROM "${table}"
        WHERE TRIM(CAST("${column}" AS VARCHAR)) != ''
        LIMIT 5
    `);

    const normalized = distinct.map((row) => String(row.value).trim().toLowerCase());

    return normalized.length > 0 && normalized.every((val) => ['0', '1', 'true', 'false', 'yes', 'no'].includes(val));
};
