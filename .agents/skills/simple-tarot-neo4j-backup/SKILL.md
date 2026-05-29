---
name: simple-tarot-neo4j-backup
description: Use when changing, debugging, documenting, or explaining Simple Tarot graph-api Neo4j backup and restore scripts, local dump storage, S3 upload guidance, or neo4j-admin database dump/load workflows.
---

# Simple Tarot Neo4j Backup

## Goal

Preserve the local-first Neo4j backup workflow for `apps/graph-api`: create
offline dumps locally, keep S3 upload separate, and make restores explicit and
guarded.

## Files

- Human docs: `docs/neo4j_database_backup.md`
- Backup script: `apps/graph-api/scripts/backup-neo4j.sh`
- Restore script: `apps/graph-api/scripts/restore-neo4j.sh`
- Neo4j data: `apps/graph-api/data`
- Docker Compose service: `db` in `compose.yaml`

## Backup Workflow

Use the script from the repo root:

```sh
apps/graph-api/scripts/backup-neo4j.sh
```

The script should:

1. Resolve the repo root from its own location.
2. Store backups outside the repo under
   `~/.local/share/simple-tarot/neo4j-backups` unless overridden.
3. Stop the running local Neo4j service or container.
4. Run `neo4j-admin database dump` in the configured Neo4j Docker image.
5. Mount `apps/graph-api/data:/data` and the backup directory to `/backups`.
6. Restart Neo4j using the same method it stopped.

Supported env vars:

```sh
NEO4J_DATABASE=neo4j
NEO4J_IMAGE=neo4j:2025.05.0
SIMPLE_TAROT_NEO4J_BACKUP_DIR=~/.local/share/simple-tarot/neo4j-backups
```

These are not secrets. Do not add credentials to the scripts.

## Restore Workflow

Restore is destructive. Keep it as a separate script and require explicit
confirmation:

```sh
CONFIRM_RESTORE=true apps/graph-api/scripts/restore-neo4j.sh <backup-dir>
```

The restore script must verify `<backup-dir>/neo4j.dump` before stopping Neo4j
or running:

```sh
neo4j-admin database load neo4j --from-path=/backups --overwrite-destination=true
```

## S3 Rule

Do not bake S3 upload into the backup script. Upload is a separate user action:

```sh
aws s3 cp <backup-dir>/ s3://<bucket>/simple-tarot/neo4j/<backup-dir>/ --recursive
```

If S3 credentials or bucket names are needed, keep them in the user's AWS CLI
configuration or local environment, not in repo files.

## Validation

After script edits, run:

```sh
bash -n apps/graph-api/scripts/backup-neo4j.sh
bash -n apps/graph-api/scripts/restore-neo4j.sh
```

Safe restore guardrail checks:

```sh
apps/graph-api/scripts/restore-neo4j.sh
apps/graph-api/scripts/restore-neo4j.sh /tmp/missing-backup
```

Avoid running a real restore unless the user explicitly asks for it, because it
overwrites the local database.
