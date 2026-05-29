#!/usr/bin/env bash

set -euo pipefail

# Configuration:
#   NEO4J_DATABASE=neo4j
#   NEO4J_IMAGE=neo4j:2025.05.0
#   CONFIRM_RESTORE=true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

NEO4J_DATABASE="${NEO4J_DATABASE:-neo4j}"
NEO4J_IMAGE="${NEO4J_IMAGE:-neo4j:2025.05.0}"
BACKUP_DIR="${1:-}"
BACKUP_DIR="${BACKUP_DIR/#\~/$HOME}"
DATA_DIR="$REPO_ROOT/apps/graph-api/data"
COMPOSE_FILE="$REPO_ROOT/compose.yaml"
DUMP_FILE="$BACKUP_DIR/$NEO4J_DATABASE.dump"

STOP_METHOD=""

log() {
    printf '[restore-neo4j] %s\n' "$1"
}

usage() {
    cat <<EOF
Usage:
  CONFIRM_RESTORE=true $0 <backup-dir>

Example:
  CONFIRM_RESTORE=true $0 ~/.local/share/simple-tarot/neo4j-backups/20260529T170000Z
EOF
}

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        printf '[restore-neo4j] Missing required command: %s\n' "$1" >&2
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
            printf '[restore-neo4j] Unknown stop method: %s\n' "$STOP_METHOD" >&2
            exit 1
            ;;
    esac
}

validate_inputs() {
    if [[ -z "$BACKUP_DIR" ]]; then
        usage >&2
        exit 1
    fi

    if [[ ! -d "$DATA_DIR" ]]; then
        printf '[restore-neo4j] Neo4j data directory does not exist: %s\n' "$DATA_DIR" >&2
        exit 1
    fi

    if [[ ! -f "$DUMP_FILE" ]]; then
        printf '[restore-neo4j] Expected dump file does not exist: %s\n' "$DUMP_FILE" >&2
        exit 1
    fi

    if [[ "${CONFIRM_RESTORE:-}" != "true" ]]; then
        printf '[restore-neo4j] Refusing to restore without CONFIRM_RESTORE=true.\n' >&2
        usage >&2
        exit 1
    fi

    require_command docker
}

run_restore() {
    log "Restoring database '$NEO4J_DATABASE' from: $BACKUP_DIR"
    docker run --rm \
        -v "$DATA_DIR:/data" \
        -v "$BACKUP_DIR:/backups" \
        "$NEO4J_IMAGE" \
        neo4j-admin database load "$NEO4J_DATABASE" \
            --from-path=/backups \
            --overwrite-destination=true
}

main() {
    validate_inputs

    trap restart_neo4j EXIT

    stop_neo4j
    run_restore

    log "Restore complete."
}

main "$@"
