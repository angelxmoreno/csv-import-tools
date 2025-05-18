import type { CsvAnalysisResult } from '@lib/types';
import { Database, type RowData } from 'duckdb-async';

export const analyzeCsv = async (filePath: string): Promise<CsvAnalysisResult> => {
    const db = await Database.create(':memory:');
    const conn = await db.connect();

    await conn.run(`CREATE VIEW temp_view AS SELECT * FROM read_csv_auto('${filePath}', HEADER=TRUE)`);

    const pragma = await conn.all(`PRAGMA table_info('temp_view')`);
    const headers = pragma.map((col: RowData) => col.name);
    const types = pragma.map((col: RowData) => col.type);

    const [{ count }] = await conn.all('SELECT COUNT(*) as count FROM temp_view');
    const rowCount = Number(count);

    await conn.close();

    return { headers, types, rowCount };
};
