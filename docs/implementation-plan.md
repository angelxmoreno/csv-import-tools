# Implementation Plan: CSV-to-MySQL CLI Tool

This document breaks down the development of the tool into committable, incremental steps. Dependencies are implemented first, followed by CLI commands in order of execution (`scan`, `analyze`, `create`, `import`).

---

## 1. 📦 Setup & Dependencies

### 1.1 Create Project Structure

* `cli/`, `lib/`, `metadata/`, `config.json`
* `tests/unit/lib/` for unit tests
* Add `.gitignore`, `tsconfig.json`, `README.md`
* Add `@lib` path alias for `lib/` in `tsconfig.json`

### 1.2 Install Dependencies

```bash
bun add commander chalk mysql2 duckdb inquirer
```

### 1.3 Create Shared Utilities

* `lib/logger.ts`: structured logger using chalk + console.log
* `lib/utils.ts`:

  * `sanitizeTableName(name: string): string`
  * `formatTimestamp(): string`
* `lib/io.ts`:

  * `loadMetadata(filePath: string): MetadataFile`
  * `saveMetadata(filePath: string, data: MetadataFile): void`
  * `requireConnectionName(meta: MetadataFile): string`
* `lib/prompts.ts`:

  * `selectMetadataFile(stage: 'analyze' | 'create' | 'import', metadataDir: string): Promise<string>`
  * `selectConnection(connections: DbConnectionConfig[]): Promise<string>`

---

## 2. 🗂️ Command: `scan <dir>`

### Step 2.1

* Read a directory and collect metadata for each `.csv` file:

  * File name, full path, size, modified time
* Generate a unique metadata file name: `metadata/{timestamp}_{slug}.json`

### Step 2.2

* Write metadata to disk using `lib/io`
* Use `logger` for reporting

---

## 3. 🔎 Command: `analyze`

### Step 3.1

* Load selected metadata file
* For each file:

  * Use DuckDB to get:

    * Column headers
    * Column types (inferred)
    * Row count
* Warn on mixed types → treat as `TEXT`
* Throw error on malformed headers

### Step 3.2

* Update metadata with:

  * `headers[]`, `columns[]`, `rowCount`, `analyzed: true`
* Save file with `saveMetadata()`

---

## 4. 🏗️ Command: `create`

### Step 4.1

* Use `selectMetadataFile('create', metadataDir)`
* Use `selectConnection(connections)` to choose DB profile
* Store `connectionName` in metadata and save

### Step 4.2

* For each file:

  * Generate MySQL `CREATE TABLE` query using metadata
  * Sanitize table name
  * Connect using `mysql2`
  * Execute statement

### Step 4.3

* Update metadata:

  * `created: true`, `createdAt`
  * Save with `saveMetadata()`

---

## 5. 🚚 Command: `import`

### Step 5.1

* Use `selectMetadataFile('import', metadataDir)`
* Load metadata and extract `connectionName`
* Look up connection config from `connections.json`

### Step 5.2

* For each file:

  * Truncate table
  * Use `LOAD DATA LOCAL INFILE` via `mysql2`
  * Apply `NULLIF(col, '')` for every column

### Step 5.3

* On success: mark `imported: true`
* On failure: stop immediately and log

---

## 6. ✅ Final Step: Integration Testing

* Use fixture CSVs for each phase
* Validate JSON metadata updates and MySQL changes
* Confirm logs and errors behave as expected

---

## Design Updates (Finalized)

* Store `connectionName` in metadata file after user selects it via `selectConnection()`
* Remove use of `MYSQL_CONNECTION` from `.env` — connection is now selected per metadata file
* Rename `environments.json` → `connections.json` and store as an array of profiles
* `config.ts` loads `connections.json` and exposes `appConfig.metadataDir` and `appConfig.connections[]`

---

## Optional / Future

* Add `--dry-run` to `create` and `import`
* Add `--force` to override validity checks
* Add parallel import support
