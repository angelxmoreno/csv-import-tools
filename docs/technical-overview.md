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

### Metadata System

#### TypeScript Type Definition

```ts
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
  connectionName?: string;
  files: CsvFileMetadata[];
}
```

* Directory: `metadata/`
* One JSON file per scan
* Format includes:

    * file metadata
    * analysis status flags
    * per-scan `connectionName` added during create/import

### Configuration

* `.env` file:

  ```env
  METADATA_DIR=metadata
  MYSQL_CONFIG_PATH=connections.json
  ```
* `connections.json`:

  ```json
  [
    {
      "name": "db1",
      "host": "localhost",
      "user": "root",
      "password": "...",
      "database": "mydb"
    }
  ]
  ```
* `config.ts` (committed): loads `.env` and `connections.json` and exports:

    * `appConfig.metadataDir`
    * `appConfig.connections[]`

### Logger

* `lib/logger.ts`: wraps `console.log` with:

    * Tag (`[scan]`, `[analyze]`, etc.)
    * Optional structured data (pretty-printed JSON)
    * Colored output using `chalk`

### Helper Libraries

* `lib/utils.ts`: for sanitizing table names, formatting dates, etc.
* `lib/duckdb.ts`: for analyzing CSVs using DuckDB
* `lib/mysql.ts`: for running queries and importing data
* `lib/prompts.ts`: for selecting metadata files and connections
* `lib/io.ts`: for reading and writing metadata JSON files
* `lib/types.ts`: for shared interfaces and enums

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

* Prompt user to select a metadata file where all files have `analyzed: true`
* Prompt user to select a connection from `connections.json`
* Store `connectionName` in metadata
* Generate MySQL `CREATE TABLE` query using metadata
* Run query using `mysql2`
* Update metadata file with `created: true`

### `import`

* Prompt user to select a metadata file where all files have `created: true` and a `connectionName`
* Lookup `connectionName` in `connections.json`
* For each CSV:

    * Connect using `mysql2` with `localInfile: true`
    * Truncate table before import
    * Run `LOAD DATA LOCAL INFILE` with:

        * `FIELDS TERMINATED BY ',' ENCLOSED BY '"'`
        * `LINES TERMINATED BY '\n'`
        * `IGNORE 1 ROWS`
        * `SET col = NULLIF(col, '')` for null conversion
    * On success: update metadata with `imported: true`
    * On error: stop process, log, and do not mark as imported

---

## Design Decisions (Finalized)

* Metadata is saved per scan with one JSON per folder
* Column type inference via DuckDB with fallback to `TEXT` for mixed types
* Table name is sanitized from CSV file name
* Empty strings always converted to `NULL`
* Connection is selected per metadata file and saved as `connectionName`
* `connections.json` is an array of profiles
* `config.ts` exports combined `appConfig`

---

## Optional Enhancements (Future)

* Dry-run support for `create` and `import`
* `--force` flag to override analysis/creation gating
* Table name deduplication
* Metadata repair/auto-fix tooling
* Report generation
* Parallel import execution
