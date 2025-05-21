# csv-import-tools

A CLI tool for scanning, analyzing, creating, and importing CSV data into MySQL, PostgreSQL, or SQLite databases. Designed for massive CSVs with streaming support and metadata persistence.

## Features

* 🗂 Scan CSV directories and generate metadata
* 📊 Analyze CSV structure using DuckDB
* 🛠️ Generate SQL tables for multiple DBs
* 📥 Bulk import using the fastest strategy per driver
* 🧪 Tested with MariaDB, Postgres, and SQLite (via Docker)

## Quickstart

```bash
# Copy sample environment and connection config
cp sample.env .env
cp sample.connections.json connections.json

# Install dependencies
bun install

# Generate sample CSVs
bun cli sampler sample

# Scan
bun cli scan ./sample/pet-owners

# Analyze
bun cli analyze

# Create tables
bun cli create

# Import rows
bun cli import
```

## Supported DB Drivers

* MySQL / MariaDB (via `LOAD DATA LOCAL INFILE`)
* PostgreSQL (via `COPY FROM STDIN`)
* SQLite (import skipped, warning shown)

## Metadata Format

CSV file metadata is saved to JSON files in a directory (default: `metadata/`). These files persist scanning, analysis, and import progress for reuse across steps.

## Dev Commands

```bash
# Run unit tests
bun test

# Format using Biome
bun lint:fix
```

## Environment

Create a `.env` file (or use `.env.test` for testing):

```bash
# For development
cp sample.env .env
cp sample.connections.json connections.json

# For testing
cp sample.env .env.test
cp sample.connections.json connections.test.json
```

````env
METADATA_DIR=metadata
MYSQL_PORT=3306 # for docker-compose
POSTGRES_PORT=5432 # for docker-compose
MYSQL_CONFIG_PATH=connections.json
``` (or use `.env.test` for testing):

```env
METADATA_DIR=metadata
MYSQL_PORT=3306 # for docker-compose
POSTGRES_PORT=5432 # for docker-compose
MYSQL_CONFIG_PATH=connections.json
````

## [License](LICENSE)

MIT © 2025
