#!/usr/bin/env bash

set -euo pipefail

# Configuration:
#   NEO4J_DATABASE=neo4j
#   NEO4J_IMAGE=neo4j:2025.05.0
#   SIMPLE_TAROT_NEO4J_BACKUP_DIR=~/.local/share/simple-tarot/neo4j-backups

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

NEO4J_DATABASE="${NEO4J_DATABASE:-neo4j}"
NEO4J_IMAGE="${NEO4J_IMAGE:-neo4j:2025.05.0}"
BACKUP_ROOT="${SIMPLE_TAROT_NEO4J_BACKUP_DIR:-$HOME/.local/share/simple-tarot/neo4j-backups}"
BACKUP_ROOT="${BACKUP_ROOT/#\~/$HOME}"
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"
DATA_DIR="$REPO_ROOT/apps/graph-api/data"
COMPOSE_FILE="$REPO_ROOT/compose.yaml"

STOP_METHOD=""

log() {
    printf '[backup-neo4j] %s\n' "$1"
}

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        printf '[backup-neo4j] Missing required command: %s\n' "$1" >&2
        exit 1
    fi
}

is_running_container() {
    local container_name="$1"

    docker inspect -f '{{.State.Running}}' "$container_name" 2>/dev/null | grep -q '^true$'
}

stop_neo4j() {
    local compose_container_id

    compose_container_id="$(docker compose -f "$COMPOSE_FILE" ps -q db 2>/dev/null || true)"

    if [[ -n "$compose_container_id" ]] && is_running_container "$compose_container_id"; then
        log "Stopping docker compose service: db"
        docker compose -f "$COMPOSE_FILE" stop db
        STOP_METHOD="compose"
        return
    fi

    if is_running_container "neo4j-db"; then
        log "Stopping container: neo4j-db"
        docker stop neo4j-db
        STOP_METHOD="container:neo4j-db"
        return
    fi

    if is_running_container "graph"; then
        log "Stopping container: graph"
        docker stop graph
        STOP_METHOD="container:graph"
        return
    fi

    log "No running local Neo4j container found; continuing with offline data directory."
}

restart_neo4j() {
    case "$STOP_METHOD" in
        compose)
            log "Restarting docker compose service: db"
            docker compose -f "$COMPOSE_FILE" up -d db
            ;;
        container:neo4j-db)
            log "Restarting container: neo4j-db"
            docker start neo4j-db
            ;;
        container:graph)
            log "Restarting container: graph"
            docker start graph
            ;;
        "")
            ;;
        *)
            printf '[backup-neo4j] Unknown stop method: %s\n' "$STOP_METHOD" >&2
            exit 1
            ;;
    esac
}

write_manifest() {
    local git_sha

    git_sha="$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || printf 'unknown')"

    cat >"$BACKUP_DIR/manifest.txt" <<EOF
created_at_utc=$TIMESTAMP
database=$NEO4J_DATABASE
neo4j_image=$NEO4J_IMAGE
repo_root=$REPO_ROOT
data_dir=$DATA_DIR
git_sha=$git_sha
dump_file=$NEO4J_DATABASE.dump
EOF
}

run_backup() {
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"

    log "Dumping database '$NEO4J_DATABASE' with $NEO4J_IMAGE"
    docker run --rm \
        -v "$DATA_DIR:/data" \
        -v "$BACKUP_DIR:/backups" \
        "$NEO4J_IMAGE" \
        neo4j-admin database dump "$NEO4J_DATABASE" \
            --to-path=/backups \
            --overwrite-destination=true

    write_manifest
}

main() {
    require_command docker

    if [[ ! -d "$DATA_DIR" ]]; then
        printf '[backup-neo4j] Neo4j data directory does not exist: %s\n' "$DATA_DIR" >&2
        exit 1
    fi

    trap restart_neo4j EXIT

    stop_neo4j
    run_backup

    log "Backup complete: $BACKUP_DIR"
    # log "S3 upload is intentionally separate. Example:"
    # log "aws s3 cp \"$BACKUP_DIR/\" \"s3://<bucket>/simple-tarot/neo4j/$TIMESTAMP/\" --recursive"
}

main "$@"
