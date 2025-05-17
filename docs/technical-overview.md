# CSV-to-MySQL CLI Tool: Technical Work Plan

## Overview

A CLI tool with four stages:

1. `scan`: Scans a directory for CSV files and records metadata
2. `analyze`: Uses DuckDB to infer headers, column types, and row counts
3. `create`: Generates and executes MySQL `CREATE TABLE` statements
4. `import`: Imports CSV data into the created MySQL tables using `LOAD DATA LOCAL INFILE`

Each stage reads and updates a metadata JSON file stored in `metadata/`. This ensures stateful, resumable processing.

This project is implemented using **Bun**.

---

## Required Node Modules

Install with Bun:

```bash
bun add commander chalk mysql2 duckdb inquirer
```

* `commander`: CLI argument parsing
* `chalk`: Colored logging output
* `mysql2`: MySQL connection and query execution
* `duckdb`: SQL-powered CSV analyzer
* `inquirer`: Interactive prompts for user input

---

## Technical Components to Build

### CLI Structure

* Use Commander.js
* Commands:

    * `scan <dir>`
    * `analyze`
    * `create`
    * `import`
* CLI entry point: `cli/index.ts`

## Metadata System

### TypeScript Type Definition

```ts
export interface CsvColumn {
  name: string;
  type: string; // MySQL type (e.g., INT, TEXT, FLOAT, DATE)
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
}
```

* Directory: `metadata/`
* One JSON file per scan
* Format includes:

  ```json
  {
    "id": "20240517_slug",
    "scannedAt": "...",
    "sourceDir": "...",
    "files": [
      {
        "fileName": "file.csv",
        "fullPath": "...",
        "size": 12345,
        "headers": [],
        "columns": [],
        "rowCount": 0,
        "tableName": "sanitized_name",
        "analyzed": false,
        "created": false,
        "imported": false
      }
    ]
  }
  ```

### Configuration

* `config.json` (in project root, not committed)
* Format:

  ```json
  {
    "dev": {
      "host": "localhost",
      "user": "root",
      "password": "secret",
      "database": "mydb"
    },
    "prod": { ... }
  }
  ```

### Logger

* `lib/logger.ts`
* Wraps `console.log` with:

    * Tag (`[scan]`, `[analyze]`, etc.)
    * Optional structured data (pretty-printed JSON)
    * Colored output using `chalk`

### Helper Libraries

* `lib/utils.ts`: for sanitizing table names, formatting dates, etc.
* `lib/duckdb.ts`: for analyzing CSVs using DuckDB
* `lib/mysql.ts`: for running queries and importing data
* `lib/prompts.ts`: for selecting metadata files and environments
* `lib/io.ts`: for reading and writing metadata JSON files (`loadMetadata`, `saveMetadata`, etc.)

---

## Implementation Tasks by Command

### `scan`

* Read directory and collect:

    * `.csv` files only
    * File name, full path, size, modified time
* Create JSON metadata file in `metadata/`
* Output descriptive filename including timestamp and folder slug

### `analyze`

* List metadata files
* Allow user to select one
* For each CSV:

    * Use DuckDB to:

        * Read headers
        * Infer column types
        * Count rows
    * Handle errors:

        * Malformed/missing headers: throw and halt
        * Mixed types: warn and use `TEXT`
        * Line breaks and special characters: allow quoted field handling
* Update metadata file with headers, types, row count

### `create`

* List metadata files where all files have `analyzed: true` and `created: false`
* Let user choose env from `config.json`
* For each CSV:

    * Generate MySQL `CREATE TABLE` query using metadata
    * Sanitize table name
    * Run query using `mysql2`
    * Update metadata file with `created: true`

### `import`

* List metadata files where all files have `created: true` and `imported: false`
* Let user choose env from `config.json`
* For each CSV:

    * Connect using `mysql2` with `localInfile: true`
    * Truncate table before import
    * Run `LOAD DATA LOCAL INFILE` with:

        * `FIELDS TERMINATED BY ',' ENCLOSED BY '"'`
        * `LINES TERMINATED BY '\n'`
        * `IGNORE 1 ROWS`
        * `SET col = NULLIF(col, '')` for null conversion
    * On error: stop process, log, and do not mark as imported
    * On success: update metadata with `imported: true`

---

## Design Decisions (Finalized)

* One JSON per scan; name includes source folder and timestamp
* Mixed column types → treat as `TEXT` with warning
* Malformed/missing headers → throw error and halt
* All phases operate on JSON state files
* CLI shows all JSONs but only allows valid ones for the step
* `--force` flag overrides safety checks (e.g., re-run import)
* All empty strings → `NULL` unless overridden in metadata
* Metadata tracks `created`, `imported`, timestamps, etc.
* Default metadata folder: `metadata/`
* Custom logger with chalk, structured JSON
* Use `LOAD DATA LOCAL INFILE` via `mysql2` (not CLI)
* Tables are truncated before import
* On failure during import, stop process and raise

---

## Optional Enhancements (Future)

* Detect duplicate table names before create
* Add dry-run preview for `create` and `import`
* CLI flag to auto-fix metadata (e.g., re-infer types)
* Parallel import mode
* Report generation: rows imported, time taken, etc.
