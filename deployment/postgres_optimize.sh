#!/bin/bash

# Rep Dashboard - PostgreSQL Performance Optimization Script
# This script optimizes PostgreSQL configuration for better performance

set -e  # Exit on any error

# --- Color output for better readability ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Configuration variables ---
PG_VERSION="16"  # Adjust based on your installed PostgreSQL version
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"
DB_NAME="rep_dash_prod"

# --- Function definitions ---
log() {
  echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] $1${NC}"
}

warn() {
  echo -e "${YELLOW}[$(date +"%Y-%m-%d %H:%M:%S")] WARNING: $1${NC}"
}

error() {
  echo -e "${RED}[$(date +"%Y-%m-%d %H:%M:%S")] ERROR: $1${NC}"
  exit 1
}

# --- Check if running as root ---
if [ "$(id -u)" -ne 0 ]; then
  error "This script must be run as root or with sudo."
fi

# --- Check PostgreSQL version ---
if [ ! -f "$PG_CONF" ]; then
  error "PostgreSQL configuration file not found: $PG_CONF. Check your version."
fi

# --- Backup original configuration ---
log "Backing up original PostgreSQL configuration..."
cp ${PG_CONF} ${PG_CONF}.bak.$(date +%Y%m%d%H%M%S)
cp ${PG_HBA} ${PG_HBA}.bak.$(date +%Y%m%d%H%M%S)

# --- Get system memory and resources ---
log "Analyzing system resources..."
MEMORY_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
MEMORY_MB=$((MEMORY_KB / 1024))
CPU_CORES=$(grep -c ^processor /proc/cpuinfo)

log "System has ${MEMORY_MB}MB of memory and ${CPU_CORES} CPU cores."

# --- Calculate optimal PostgreSQL settings ---
# These are based on general recommendations but might need tweaking for specific workloads

# Calculate shared_buffers (25% of RAM)
SHARED_BUFFERS=$((MEMORY_MB / 4))
# Calculate effective_cache_size (75% of RAM)
EFFECTIVE_CACHE_SIZE=$((MEMORY_MB * 3 / 4))
# Calculate maintenance_work_mem (5% of RAM up to 1GB)
MAINTENANCE_WORK_MEM=$((MEMORY_MB / 20))
if [ $MAINTENANCE_WORK_MEM -gt 1024 ]; then
  MAINTENANCE_WORK_MEM=1024
fi
# Calculate work_mem (25% of RAM divided by max_connections)
MAX_CONNECTIONS=100
WORK_MEM=$((MEMORY_MB / 4 / MAX_CONNECTIONS))
if [ $WORK_MEM -lt 4 ]; then
  WORK_MEM=4
fi
# Calculate max_worker_processes (1-2 per CPU core)
MAX_WORKER_PROCESSES=$((CPU_CORES * 2))
if [ $MAX_WORKER_PROCESSES -gt 8 ]; then
  MAX_WORKER_PROCESSES=8
fi
# Calculate max_parallel_workers (same as max_worker_processes)
MAX_PARALLEL_WORKERS=$MAX_WORKER_PROCESSES
# Calculate max_parallel_workers_per_gather (half of CPU cores)
MAX_PARALLEL_WORKERS_PER_GATHER=$((CPU_CORES / 2))
if [ $MAX_PARALLEL_WORKERS_PER_GATHER -lt 1 ]; then
  MAX_PARALLEL_WORKERS_PER_GATHER=1
elif [ $MAX_PARALLEL_WORKERS_PER_GATHER -gt 4 ]; then
  MAX_PARALLEL_WORKERS_PER_GATHER=4
fi

# --- Update PostgreSQL configuration ---
log "Updating PostgreSQL configuration..."

cat > /tmp/pg_config_update.sql << EOF
# Rep Dashboard PostgreSQL Configuration - $(date)
# Optimized for server with ${MEMORY_MB}MB RAM and ${CPU_CORES} CPU cores

# Connection Settings
max_connections = ${MAX_CONNECTIONS}              # Adjust based on expected concurrent connections
superuser_reserved_connections = 3

# Memory Settings
shared_buffers = ${SHARED_BUFFERS}MB              # 25% of RAM
effective_cache_size = ${EFFECTIVE_CACHE_SIZE}MB  # 75% of RAM
work_mem = ${WORK_MEM}MB                          # Per-operation memory
maintenance_work_mem = ${MAINTENANCE_WORK_MEM}MB  # For maintenance operations
temp_buffers = 8MB

# Disk Settings
random_page_cost = 1.1      # For SSD storage (use 4.0 for HDD)
effective_io_concurrency = 200  # For SSD storage (use 2 for HDD)

# Background Writer
bgwriter_delay = 200ms
bgwriter_lru_maxpages = 100
bgwriter_lru_multiplier = 2.0

# WAL Settings
wal_buffers = 16MB
wal_writer_delay = 200ms
synchronous_commit = off    # Improves performance at slight risk of data loss
wal_compression = on

# Planner Settings
default_statistics_target = 100
max_worker_processes = ${MAX_WORKER_PROCESSES}
max_parallel_workers_per_gather = ${MAX_PARALLEL_WORKERS_PER_GATHER}
max_parallel_workers = ${MAX_PARALLEL_WORKERS}
max_parallel_maintenance_workers = ${MAX_PARALLEL_WORKERS_PER_GATHER}

# Query Optimization
jit = on                  # Just-in-time compilation for queries

# Autovacuum Settings
autovacuum = on
autovacuum_max_workers = $((CPU_CORES / 2 > 0 ? CPU_CORES / 2 : 1))
autovacuum_naptime = 1min
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
autovacuum_vacuum_scale_factor = 0.02
autovacuum_analyze_scale_factor = 0.01
autovacuum_vacuum_cost_delay = 20ms
autovacuum_vacuum_cost_limit = 2000

# Logging
log_min_duration_statement = 200  # Log queries taking more than 200ms
EOF

# Apply the configuration
log "Applying new configuration to ${PG_CONF}..."
cp /tmp/pg_config_update.sql /etc/postgresql/${PG_VERSION}/postgresql_optimizations.conf

# Add include to main PostgreSQL config file
if ! grep -q "include 'postgresql_optimizations.conf'" $PG_CONF; then
  echo "include 'postgresql_optimizations.conf'" >> $PG_CONF
  log "Added include directive to $PG_CONF"
else
  log "Include directive already exists in $PG_CONF"
fi

# --- Create database optimization functions ---
log "Creating database optimization functions..."
sudo -u postgres psql -d $DB_NAME << EOF
-- Function to find and optimize tables with bloat
CREATE OR REPLACE FUNCTION find_bloated_tables() RETURNS TABLE (
    tablename name,
    bloat_ratio numeric,
    wasted_size text
) AS \$\$
BEGIN
    RETURN QUERY
    WITH constants AS (
        SELECT current_setting('block_size')::numeric AS bs,
               23 AS hdr,
               8 AS ma
    ),
    bloat_info AS (
        SELECT
            schemaname, tablename, cc.reltuples, cc.relpages,
            bs,
            CEIL((cc.reltuples*((datahdr+ma-
                (CASE WHEN datahdr%ma=0 THEN ma ELSE datahdr%ma END))+nullhdr2+4))/(bs-20::float)) AS otta,
            COALESCE(c2.relname,'?') AS iname, COALESCE(c2.reltuples,0) AS ituples, COALESCE(c2.relpages,0) AS ipages,
            COALESCE(CEIL((c2.reltuples*(datahdr-12))/(bs-20::float)),0) AS iotta -- very rough approximation, assumes all cols
        FROM (
            SELECT
                ma,bs,schemaname,tablename,
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
        LEFT JOIN pg_index i ON indrelid = cc.oid
        LEFT JOIN pg_class c2 ON i.indexrelid = c2.oid
    )
    SELECT rs.tablename::name,
           ROUND(((rs.relpages::float / NULLIF(rs.otta, 0))::numeric - 1) * 100, 2) AS bloat_ratio,
           pg_size_pretty((rs.relpages::bigint - rs.otta::bigint) * bs::bigint) AS wasted_size
    FROM bloat_info rs
    CROSS JOIN constants
    WHERE schemaname = 'public'
        AND rs.relpages > rs.otta
        AND ROUND(((rs.relpages::float / NULLIF(rs.otta, 0))::numeric - 1) * 100, 2) > 20
    ORDER BY ((rs.relpages::float / NULLIF(rs.otta, 0))::numeric - 1) DESC;
END;
\$\$ LANGUAGE plpgsql;

-- Function to optimize a specific table
CREATE OR REPLACE FUNCTION optimize_table(target_table text) RETURNS void AS \$\$
BEGIN
    RAISE NOTICE 'Optimizing table: %', target_table;
    EXECUTE 'VACUUM FULL ANALYZE ' || target_table;
    RAISE NOTICE 'Optimization completed for table: %', target_table;
    RETURN;
END;
\$\$ LANGUAGE plpgsql;

-- Function to optimize all bloated tables
CREATE OR REPLACE FUNCTION optimize_bloated_tables() RETURNS void AS \$\$
DECLARE
    row record;
BEGIN
    RAISE NOTICE 'Starting optimization of bloated tables...';
    
    FOR row IN SELECT * FROM find_bloated_tables() ORDER BY bloat_ratio DESC LOOP
        RAISE NOTICE 'Table % has bloat ratio of % (wasted: %)', 
                     row.tablename, row.bloat_ratio, row.wasted_size;
        PERFORM optimize_table(row.tablename::text);
    END LOOP;
    
    RAISE NOTICE 'Optimization of bloated tables completed.';
    RETURN;
END;
\$\$ LANGUAGE plpgsql;

-- Function to get database size statistics
CREATE OR REPLACE FUNCTION database_size_stats() RETURNS TABLE (
    table_name text,
    table_size text,
    indexes_size text,
    total_size text,
    bloat_estimate text
) AS \$\$
BEGIN
    RETURN QUERY
    SELECT
        t.tablename::text AS table_name,
        pg_size_pretty(pg_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))::bigint) AS table_size,
        pg_size_pretty(sum(pg_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(indexname))::bigint)::bigint) AS indexes_size,
        pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))::bigint) AS total_size,
        CASE 
            WHEN b.bloat_ratio IS NOT NULL 
            THEN b.bloat_ratio || '% (' || b.wasted_size || ' wasted)'
            ELSE 'Unknown'
        END AS bloat_estimate
    FROM pg_tables t
    LEFT JOIN pg_indexes i ON t.schemaname = i.schemaname AND t.tablename = i.tablename
    LEFT JOIN find_bloated_tables() b ON t.tablename = b.tablename
    WHERE t.schemaname = 'public'
    GROUP BY t.schemaname, t.tablename, b.bloat_ratio, b.wasted_size
    ORDER BY pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename)) DESC;
END;
\$\$ LANGUAGE plpgsql;

-- Create a view for easy access to stats
CREATE OR REPLACE VIEW db_stats AS
SELECT * FROM database_size_stats();

COMMENT ON FUNCTION find_bloated_tables() IS 'Finds tables with significant bloat (wasted space)';
COMMENT ON FUNCTION optimize_table(text) IS 'Performs a VACUUM FULL ANALYZE on the specified table';
COMMENT ON FUNCTION optimize_bloated_tables() IS 'Optimizes all tables with significant bloat';
COMMENT ON FUNCTION database_size_stats() IS 'Shows size statistics for all tables in the database';
COMMENT ON VIEW db_stats IS 'Easy access to database size statistics';

-- Create indexes on important lookup fields
CREATE INDEX IF NOT EXISTS idx_user_email_search ON "User" (lower(email));
CREATE INDEX IF NOT EXISTS idx_user_name_search ON "User" (lower(name)) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_startdate ON "User" (startDate) WHERE startDate IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trainingmodule_title_search ON "TrainingModule" (lower(title));
CREATE INDEX IF NOT EXISTS idx_calendarevent_date_range ON "CalendarEvent" (startDate, endDate);
CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON "LeaderboardEntry" (periodStart, periodEnd);

-- Add JSONB indexing if needed
CREATE INDEX IF NOT EXISTS idx_leaderboardentry_metrics ON "LeaderboardEntry" USING GIN (metrics) WHERE metrics IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contest_prizes ON "Contest" USING GIN (prizes) WHERE prizes IS NOT NULL;

VACUUM ANALYZE;
EOF

# --- Restart PostgreSQL to apply changes ---
log "Restarting PostgreSQL..."
systemctl restart postgresql

# --- Create script to run regular maintenance ---
log "Creating database maintenance script..."
cat > /usr/local/bin/db_maintenance.sh << EOF
#!/bin/bash

# PostgreSQL maintenance script
# Run weekly via cron

export PGPASSWORD=your_password  # Set this to the actual password if needed

echo "Running database maintenance at \$(date)"

# Run VACUUM ANALYZE on all tables
echo "Running VACUUM ANALYZE..."
sudo -u postgres psql -d ${DB_NAME} -c "VACUUM ANALYZE;"

# Find and optimize bloated tables
echo "Finding and optimizing bloated tables..."
sudo -u postgres psql -d ${DB_NAME} -c "SELECT * FROM optimize_bloated_tables();"

# Update statistics
echo "Updating statistics..."
sudo -u postgres psql -d ${DB_NAME} -c "ANALYZE;"

# Report database statistics
echo "Database statistics:"
sudo -u postgres psql -d ${DB_NAME} -c "SELECT * FROM db_stats LIMIT 10;"

echo "Maintenance completed at \$(date)"
EOF

chmod +x /usr/local/bin/db_maintenance.sh

# Add weekly cron job
(crontab -l 2>/dev/null || echo "") | \
{ cat; echo "0 2 * * 0 /usr/local/bin/db_maintenance.sh > /var/log/postgres_maintenance.log 2>&1"; } | \
crontab -

# --- Create performance tuning examples for specific queries ---
log "Creating performance tuning examples for common queries..."
cat > /usr/local/bin/postgres_query_examples.sql << EOF
-- Optimized query patterns for Rep Dashboard application

-- 1. Efficient pagination with keyset pagination
-- Instead of using OFFSET which gets slower as the offset increases
SELECT u.id, u.name, u.email, u.role, u.position
FROM "User" u
WHERE u.id > '5678' -- Last ID from previous page
ORDER BY u.id
LIMIT 20;

-- 2. User with active training modules
SELECT 
    u.id, 
    u.name, 
    COUNT(tp.id) AS active_modules
FROM "User" u
LEFT JOIN "TrainingProgress" tp ON u.id = tp.userId AND tp.status = 'IN_PROGRESS'
GROUP BY u.id, u.name
ORDER BY active_modules DESC;

-- 3. Efficient leaderboard query
SELECT 
    u.id, 
    u.name, 
    le.score,
    RANK() OVER (ORDER BY le.score DESC) as rank
FROM "LeaderboardEntry" le
JOIN "User" u ON le.userId = u.id
WHERE le.leaderboardId = '1234'
  AND le.periodStart >= '2025-01-01'
  AND le.periodEnd <= '2025-12-31'
ORDER BY le.score DESC;

-- 4. Calendar events with attendees
SELECT 
    e.id, 
    e.title, 
    e.startDate, 
    e.endDate,
    COUNT(ea.id) AS attendee_count
FROM "CalendarEvent" e
LEFT JOIN "EventAttendee" ea ON e.id = ea.eventId
WHERE e.startDate >= CURRENT_DATE
  AND e.startDate < CURRENT_DATE + INTERVAL '30 days'
GROUP BY e.id, e.title, e.startDate, e.endDate
ORDER BY e.startDate;

-- 5. Training modules with completion rate
SELECT 
    tm.id, 
    tm.title,
    COUNT(tp.id) AS total_enrollments,
    SUM(CASE WHEN tp.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
    (SUM(CASE WHEN tp.status = 'COMPLETED' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(tp.id), 0)::float) * 100 AS completion_rate
FROM "TrainingModule" tm
LEFT JOIN "TrainingProgress" tp ON tm.id = tp.moduleId
GROUP BY tm.id, tm.title
ORDER BY completion_rate DESC;

-- 6. Using materialized views for complex reports
-- Example of materialized view for user achievements
CREATE MATERIALIZED VIEW user_achievement_summary AS
SELECT 
    u.id AS user_id, 
    u.name, 
    COUNT(ua.id) AS achievement_count,
    SUM(a.points) AS total_points
FROM "User" u
LEFT JOIN "UserAchievement" ua ON u.id = ua.userId
LEFT JOIN "Achievement" a ON ua.achievementId = a.id
GROUP BY u.id, u.name;

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW user_achievement_summary;

-- Query the materialized view (fast!)
SELECT * FROM user_achievement_summary ORDER BY total_points DESC;

-- 7. Using partial indexes for filtering
CREATE INDEX idx_trainingprogress_inprogress
ON "TrainingProgress" (userId, moduleId)
WHERE status = 'IN_PROGRESS';

-- 8. Using LATERAL joins for related records
SELECT 
    u.id, 
    u.name,
    recent_events.title AS latest_event,
    recent_events.startDate AS event_date
FROM "User" u
LEFT JOIN LATERAL (
    SELECT e.title, e.startDate
    FROM "CalendarEvent" e
    JOIN "EventAttendee" ea ON e.id = ea.eventId
    WHERE ea.userId = u.id
    ORDER BY e.startDate DESC
    LIMIT 1
) recent_events ON true
WHERE u.role = 'USER'
ORDER BY u.name;
EOF

# --- Output summary ---
log "PostgreSQL optimization completed successfully!"
log ""
log "Summary of optimizations:"
log "1. PostgreSQL configuration optimized for ${MEMORY_MB}MB RAM and ${CPU_CORES} CPU cores"
log "2. Added utility functions for monitoring and optimizing database bloat"
log "3. Created indexes on frequently searched fields"
log "4. Added GIN indexes for JSONB data"
log "5. Created weekly maintenance script and cron job"
log "6. Provided optimized query examples for common patterns"
log ""
log "To view database statistics:"
log "sudo -u postgres psql -d ${DB_NAME} -c \"SELECT * FROM db_stats;\""
log ""
log "To manually run database maintenance:"
log "sudo /usr/local/bin/db_maintenance.sh"
log ""
log "Configuration files:"
log "- PostgreSQL config: ${PG_CONF}"
log "- Optimization settings: /etc/postgresql/${PG_VERSION}/postgresql_optimizations.conf"
log "- Query examples: /usr/local/bin/postgres_query_examples.sql"