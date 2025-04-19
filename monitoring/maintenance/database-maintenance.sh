#!/bin/bash

# Rep Dashboard - Database Maintenance Script
# This script performs regular PostgreSQL database maintenance tasks

set -e  # Exit on any error

# --- Configuration ---
APP_NAME="rep-dash"
DB_NAME="rep_dash_prod"
DB_USER="rep_dash_user"
DB_HOST="localhost"
LOG_DIR="/var/log/rep-dash"
SLACK_WEBHOOK_URL=""  # Set this to enable Slack notifications

# --- Functions ---
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_DIR}/db-maintenance.log"
}

error() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "${LOG_DIR}/db-maintenance.log"
  if [ -n "${SLACK_WEBHOOK_URL}" ]; then
    curl -s -X POST --data-urlencode "payload={\"text\":\"*Database Maintenance Error*\n${1}\"}" "${SLACK_WEBHOOK_URL}"
  fi
  exit 1
}

execute_query() {
  local query="$1"
  local message="$2"
  
  log "${message}..."
  if ! sudo -u postgres psql -d "${DB_NAME}" -c "${query}"; then
    error "Failed to execute query: ${query}"
  fi
  log "${message} completed"
}

# --- Create log directory if it doesn't exist ---
mkdir -p "${LOG_DIR}"

# --- Set PostgreSQL environment variables ---
export PGHOST="${DB_HOST}"
export PGUSER="${DB_USER}"
export PGDATABASE="${DB_NAME}"
# PGPASSWORD should be set in the environment or use .pgpass file

# --- Begin maintenance ---
log "Starting database maintenance for ${DB_NAME}"

# --- Get database size before maintenance ---
log "Current database size:"
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('${DB_NAME}')) as db_size;"

# --- Check for long-running queries ---
log "Checking for long-running queries..."
sudo -u postgres psql -c "
  SELECT pid, 
         now() - pg_stat_activity.query_start AS duration, 
         query, 
         state
  FROM pg_stat_activity
  WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
    AND state != 'idle'
    AND query NOT LIKE '%pg_stat_activity%'
  ORDER BY duration DESC;
"

# --- VACUUM ANALYZE to reclaim space and update statistics ---
execute_query "VACUUM ANALYZE;" "Running VACUUM ANALYZE on all tables"

# --- VACUUM FULL on specific tables if needed ---
# Note: VACUUM FULL locks the table and requires exclusive access
log "Checking for tables that need VACUUM FULL..."
tables_to_vacuum=$(sudo -u postgres psql -t -c "
  SELECT relname
  FROM pg_stat_user_tables
  WHERE n_dead_tup > 10000
    AND n_dead_tup > 0.1 * n_live_tup
  ORDER BY n_dead_tup DESC
  LIMIT 5;
")

if [ -n "$tables_to_vacuum" ]; then
  log "Found tables that need VACUUM FULL:"
  echo "$tables_to_vacuum"
  
  for table in $tables_to_vacuum; do
    table=$(echo $table | xargs)  # Trim whitespace
    if [ -n "$table" ]; then
      execute_query "VACUUM FULL ANALYZE \"$table\";" "Running VACUUM FULL on $table"
    fi
  done
else
  log "No tables require VACUUM FULL at this time"
fi

# --- REINDEX to rebuild indexes ---
# Only rebuild indexes if fragmentation is high
log "Checking for fragmented indexes..."
fragmented_indexes=$(sudo -u postgres psql -t -c "
  SELECT indexrelname, pg_size_pretty(pg_relation_size(indexrelid)) as index_size
  FROM pg_stat_user_indexes
  JOIN pg_index ON pg_index.indexrelid = pg_stat_user_indexes.indexrelid
  WHERE pg_index.indisvalid = false 
     OR pg_stat_user_indexes.idx_scan = 0
  LIMIT 10;
")

if [ -n "$fragmented_indexes" ]; then
  log "Found fragmented or unused indexes:"
  echo "$fragmented_indexes"
  
  execute_query "REINDEX DATABASE ${DB_NAME};" "Rebuilding all indexes"
else
  log "No highly fragmented indexes found, skipping REINDEX"
fi

# --- Update database statistics ---
execute_query "ANALYZE;" "Updating database statistics"

# --- Find unused indexes ---
log "Checking for unused indexes..."
sudo -u postgres psql -c "
  SELECT s.schemaname,
         s.relname AS tablename,
         s.indexrelname AS indexname,
         pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size
  FROM pg_catalog.pg_stat_user_indexes s
  JOIN pg_catalog.pg_index i ON s.indexrelid = i.indexrelid
  WHERE s.idx_scan = 0      -- has never been scanned
    AND 0 <> ALL(i.indkey)  -- is not a primary key
    AND i.indisunique IS FALSE -- is not a UNIQUE index
    AND NOT EXISTS          -- does not enforce a constraint
         (SELECT 1 FROM pg_catalog.pg_constraint c
          WHERE c.conindid = s.indexrelid)
  ORDER BY pg_relation_size(s.indexrelid) DESC;
"

# --- Find missing indexes (tables with high sequential scans) ---
log "Checking for potentially missing indexes..."
sudo -u postgres psql -c "
  SELECT relname AS table_name,
         seq_scan AS seq_scans,
         seq_tup_read AS rows_read_seq,
         idx_scan AS idx_scans,
         seq_tup_read / GREATEST(seq_scan, 1) AS avg_rows_per_seq_scan,
         pg_size_pretty(pg_relation_size(relid)) AS table_size
  FROM pg_stat_user_tables
  WHERE seq_scan > 1000
    AND seq_tup_read / GREATEST(seq_scan, 1) > 100
    AND idx_scan / GREATEST(seq_scan, 1)::float < 0.1
  ORDER BY seq_tup_read DESC
  LIMIT 10;
"

# --- Check for bloated tables and indexes ---
log "Checking for bloated tables..."
sudo -u postgres psql -c "
  WITH constants AS (
    SELECT current_setting('block_size')::numeric AS bs
  ),
  bloat_info AS (
    SELECT
      tablename,
      ROUND(CASE WHEN otta=0 THEN 0.0 ELSE sml.relpages/otta::numeric END,1) AS table_bloat,
      CASE WHEN relpages < otta THEN '0' ELSE pg_size_pretty((bs*(sml.relpages-otta)::bigint)::bigint) END AS table_waste
    FROM (
      SELECT
        schemaname, tablename, cc.reltuples, cc.relpages, bs,
        CEIL((cc.reltuples*((datahdr+ma-
          (CASE WHEN datahdr%ma=0 THEN ma ELSE datahdr%ma END))+nullhdr2+4))/(bs-20::float)) AS otta
      FROM (
        SELECT
          ma, bs, schemaname, tablename,
          (datawidth+(hdr+ma-(case when hdr%ma=0 THEN ma ELSE hdr%ma END)))::numeric AS datahdr,
          (maxfracsum*(nullhdr+ma-(case when nullhdr%ma=0 THEN ma ELSE nullhdr%ma END)))::numeric AS nullhdr2
        FROM (
          SELECT
            schemaname, tablename, hdr, ma, bs,
            SUM((1-null_frac)*avg_width) AS datawidth,
            MAX(null_frac) AS maxfracsum,
            hdr+(
              SELECT 1+count(*)/8
              FROM pg_stats s2
              WHERE null_frac<>0 AND s2.schemaname = s.schemaname AND s2.tablename = s.tablename
            ) AS nullhdr
          FROM pg_stats s, constants
          GROUP BY 1,2,3,4,5
        ) AS foo
      ) AS rs
      JOIN pg_class cc ON cc.relname = rs.tablename
      JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = rs.schemaname
    ) AS sml
    WHERE sml.relpages - otta > 128
  )
  SELECT
    tablename AS \"Table Name\",
    table_bloat AS \"Bloat Factor\",
    table_waste AS \"Wasted Space\"
  FROM bloat_info
  ORDER BY table_bloat DESC
  LIMIT 10;
"

# --- Check for cache hit ratio ---
log "Checking database cache hit ratio..."
sudo -u postgres psql -c "
  SELECT 
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
  FROM pg_statio_user_tables;
"

# --- Optimize specific tables for the application ---
log "Optimizing specific application tables..."

# Example: TrainingProgress table is likely high-traffic
execute_query "VACUUM ANALYZE \"TrainingProgress\";" "Optimizing TrainingProgress table"

# Example: Notification table might have many deletes
execute_query "VACUUM ANALYZE \"Notification\";" "Optimizing Notification table"

# Example: CalendarEvent table for date range queries
execute_query "VACUUM ANALYZE \"CalendarEvent\";" "Optimizing CalendarEvent table"

# --- Get database size after maintenance ---
log "New database size:"
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('${DB_NAME}')) as db_size;"

# --- Maintenance complete ---
log "Database maintenance completed successfully"

# --- Send notification if configured ---
if [ -n "${SLACK_WEBHOOK_URL}" ]; then
  curl -s -X POST --data-urlencode "payload={\"text\":\"*Database Maintenance Completed*\nSuccessfully performed maintenance on ${DB_NAME} database.\"}" "${SLACK_WEBHOOK_URL}"
fi