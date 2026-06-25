# Neo4j Database Backup (Archived)

> **Archived.** Neo4j was replaced by AWS Bedrock Knowledge Base in June 2026.
> The graph-api no longer uses Neo4j or Docker. This document is kept for
> historical reference only. Do not follow these instructions on the current codebase.

---

# Neo4j Database Backup

Simple Tarot stores graph-api data in the local Neo4j data directory at
`apps/graph-api/data`. The backup and restore scripts run `neo4j-admin` inside a
matching Neo4j Docker image so they can be run from a local checkout without
installing Neo4j directly.

Backups are stored outside the repository by default:

```sh
~/.local/share/simple-tarot/neo4j-backups
```

The scripts stop Neo4j before running because `neo4j-admin database dump` and
`neo4j-admin database load` operate on an offline Community-style database.
Expect local graph-api database downtime while backup or restore is running.

## Requirements

- Docker with Docker Compose support.
- A local Neo4j data directory at `apps/graph-api/data`.
- The repository's Neo4j image, `neo4j:2025.05.0`, unless overridden.

## Create a Backup

From the repository root:

```sh
apps/graph-api/scripts/backup-neo4j.sh
```

The script:

- resolves the repository root;
- creates a timestamped directory under the backup root;
- stops the local Neo4j container or Compose service if one is running;
- runs `neo4j-admin database dump`;
- writes a `manifest.txt` next to the dump;
- restarts Neo4j the same way it was stopped.

The generated backup directory contains:

```text
neo4j.dump
manifest.txt
```

## Configuration

The backup script supports these environment variables:

```sh
NEO4J_DATABASE=neo4j
NEO4J_IMAGE=neo4j:2025.05.0
SIMPLE_TAROT_NEO4J_BACKUP_DIR=~/.local/share/simple-tarot/neo4j-backups
```

Example with a custom local backup root:

```sh
SIMPLE_TAROT_NEO4J_BACKUP_DIR=/tmp/simple-tarot-neo4j-backups \
  apps/graph-api/scripts/backup-neo4j.sh
```

None of these variables are secrets. Do not add credentials or cloud tokens to
the backup script.

## Upload to S3

S3 upload is intentionally separate from backup creation. After a backup
completes, upload the generated directory with the AWS CLI:

```sh
aws s3 cp \
  ~/.local/share/simple-tarot/neo4j-backups/<backup-dir>/ \
  s3://<bucket>/simple-tarot/neo4j/<backup-dir>/ \
  --recursive
```

Use your local AWS CLI profile or environment configuration for credentials.
Do not commit AWS credentials to this repository.

## Restore a Backup

Restore replaces the local Neo4j database. Run it only when you intend to
overwrite local data.

From the repository root:

```sh
CONFIRM_RESTORE=true \
  apps/graph-api/scripts/restore-neo4j.sh \
  ~/.local/share/simple-tarot/neo4j-backups/<backup-dir>
```

The restore script verifies that `<backup-dir>/neo4j.dump` exists before it
allows the restore. It then stops Neo4j, runs:

```sh
neo4j-admin database load neo4j --from-path=/backups --overwrite-destination=true
```

and restarts Neo4j the same way it was stopped.

## Validate the Scripts

Use shell syntax checks before changing backup or restore behavior:

```sh
bash -n apps/graph-api/scripts/backup-neo4j.sh
bash -n apps/graph-api/scripts/restore-neo4j.sh
```

Safe restore guardrail checks:

```sh
apps/graph-api/scripts/restore-neo4j.sh
apps/graph-api/scripts/restore-neo4j.sh /tmp/missing-backup
```

Do not run a real restore as a casual validation step because it overwrites the
local database.
