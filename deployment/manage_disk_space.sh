#!/bin/bash

# Rep Dashboard - Disk Space Management Script
# This script checks disk usage and performs cleanup when necessary

set -e  # Exit on any error

# --- Color output for better readability ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Configuration variables ---
APP_NAME="rep-dash"
APP_DIR="/var/www/${APP_NAME}"
THRESHOLD=85  # Disk usage percentage threshold for cleanup
LOG_DIR="/var/log"
LOG_MAX_AGE=30  # Days to keep logs
TEMP_MAX_AGE=7  # Days to keep temp files
NPM_CACHE_MAX_AGE=30  # Days to keep npm cache
MIN_FREE_SPACE=1024  # Minimum free space in MB after cleanup

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

# --- Check disk space ---
log "Checking disk space usage..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
FREE_SPACE_MB=$(df -m / | awk 'NR==2 {print $4}')
TOTAL_SPACE_MB=$(df -m / | awk 'NR==2 {print $2}')

log "Current disk usage: ${DISK_USAGE}% (${FREE_SPACE_MB}MB free out of ${TOTAL_SPACE_MB}MB)"

if [ "$DISK_USAGE" -gt "$THRESHOLD" ] || [ "$FREE_SPACE_MB" -lt "$MIN_FREE_SPACE" ]; then
  warn "Disk usage exceeds threshold of ${THRESHOLD}% or free space below ${MIN_FREE_SPACE}MB. Starting cleanup..."
  
  # --- Step 1: Show largest directories ---
  log "Top 10 largest directories:"
  find / -type d -not -path "/proc/*" -not -path "/sys/*" -not -path "/dev/*" 2>/dev/null | xargs du -sh 2>/dev/null | sort -hr | head -n 10
  
  # --- Step 2: Show largest files ---
  log "Top 10 largest files:"
  find / -type f -not -path "/proc/*" -not -path "/sys/*" -not -path "/dev/*" 2>/dev/null | xargs du -sh 2>/dev/null | sort -hr | head -n 10
  
  # --- Step 3: Clean up system logs ---
  log "Cleaning up old system logs..."
  find ${LOG_DIR} -name "*.log" -type f -mtime +${LOG_MAX_AGE} -delete
  find ${LOG_DIR} -name "*.log.*" -type f -mtime +${LOG_MAX_AGE} -delete
  journalctl --vacuum-time=${LOG_MAX_AGE}d
  
  # --- Step 4: Clean up temporary files ---
  log "Cleaning up temporary files..."
  find /tmp -type f -atime +${TEMP_MAX_AGE} -delete 2>/dev/null || true
  find /var/tmp -type f -atime +${TEMP_MAX_AGE} -delete 2>/dev/null || true
  
  # --- Step 5: Clean up application specific files ---
  log "Cleaning up application files..."
  
  # Clean up application logs
  find ${APP_DIR}/logs -name "*.log.*" -type f -mtime +${LOG_MAX_AGE} -delete 2>/dev/null || true
  
  # Clean up old releases (keep the 3 most recent)
  if [ -d "${APP_DIR}/releases" ]; then
    log "Cleaning up old releases..."
    cd ${APP_DIR}/releases
    ls -1td */ | tail -n +4 | xargs rm -rf 2>/dev/null || true
  fi
  
  # Clean up Next.js build cache
  if [ -d "${APP_DIR}/shared/.next/cache" ]; then
    log "Cleaning up Next.js build cache..."
    rm -rf ${APP_DIR}/shared/.next/cache/* 2>/dev/null || true
  fi
  
  # --- Step 6: Clean up package manager caches ---
  log "Cleaning up package manager caches..."
  if command -v npm &> /dev/null; then
    npm cache clean --force
  fi
  
  # --- Step 7: Clean up old Docker containers and images if Docker is installed ---
  if command -v docker &> /dev/null; then
    log "Cleaning up Docker resources..."
    docker system prune -af --volumes 2>/dev/null || true
  fi
  
  # --- Step 8: Clean up old backups keeping only the 5 most recent ---
  if [ -d "/var/backups/${APP_NAME}" ]; then
    log "Cleaning up old backups..."
    find /var/backups/${APP_NAME}/database -name "*.sql.gz" -type f | sort | head -n -5 | xargs rm -f 2>/dev/null || true
    find /var/backups/${APP_NAME}/files -name "*.tar.gz" -type f | sort | head -n -5 | xargs rm -f 2>/dev/null || true
  fi
  
  # --- Step 9: Check and clean apt cache ---
  log "Cleaning up apt cache..."
  apt-get clean
  apt-get autoremove -y
  
  # --- Step 10: Run system cleanup ---
  log "Running system cleanup..."
  sync
  echo 3 > /proc/sys/vm/drop_caches
  
  # --- Check disk space after cleanup ---
  DISK_USAGE_AFTER=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
  FREE_SPACE_MB_AFTER=$(df -m / | awk 'NR==2 {print $4}')
  SPACE_FREED=$((FREE_SPACE_MB_AFTER - FREE_SPACE_MB))
  
  log "Disk cleanup completed. Usage now: ${DISK_USAGE_AFTER}% (${FREE_SPACE_MB_AFTER}MB free, ${SPACE_FREED}MB freed)"
  
  if [ "$DISK_USAGE_AFTER" -gt "$THRESHOLD" ] || [ "$FREE_SPACE_MB_AFTER" -lt "$MIN_FREE_SPACE" ]; then
    warn "Disk usage still above threshold after cleanup. Manual intervention may be required."
    
    # Suggest further actions
    log "Suggested manual cleanup actions:"
    log "1. Examine /var/log for large log files: find /var/log -type f -name \"*.log\" | xargs du -sh | sort -hr"
    log "2. Check for large files in user home directories: find /home -type f -size +100M | xargs du -sh"
    log "3. Consider increasing disk space or adding additional storage"
    log "4. Review database size and consider archiving old data: sudo -u postgres psql -c \"\\l+\""
  else
    log "Disk usage now within acceptable limits."
  fi
else
  log "Disk usage is below threshold (${THRESHOLD}%). No cleanup needed."
fi

# --- Create report ---
REPORT_FILE="/var/log/disk_space_report_$(date +%Y%m%d).txt"
log "Creating disk space report at ${REPORT_FILE}..."

cat > ${REPORT_FILE} << EOF
# Disk Space Report - $(date)

## System Overview
- Total Disk Space: ${TOTAL_SPACE_MB}MB
- Free Disk Space: ${FREE_SPACE_MB}MB
- Disk Usage: ${DISK_USAGE}%

## Disk Usage by Filesystem
$(df -h)

## Disk Usage by Directory (Top 15)
$(du -h --max-depth=1 / 2>/dev/null | sort -hr | head -n 15)

## PostgreSQL Database Sizes
$(sudo -u postgres psql -c "\l+" 2>/dev/null || echo "Unable to get database sizes")

## Application Directory Space Usage
$(du -h --max-depth=2 ${APP_DIR} 2>/dev/null | sort -hr)

## Log Directory Space Usage
$(du -h --max-depth=2 /var/log 2>/dev/null | sort -hr | head -n 10)

## Largest Files (Top 20)
$(find / -not -path "/proc/*" -not -path "/sys/*" -not -path "/dev/*" -type f -size +50M 2>/dev/null | xargs du -sh 2>/dev/null | sort -hr | head -n 20)
EOF

log "Disk space report created at ${REPORT_FILE}"

# --- Recommendation for cron job if not already running as cron ---
if [ -t 1 ]; then
  log "To automate disk space management, add this to crontab:"
  log "0 2 * * * /var/www/rep-dash/deployment/manage_disk_space.sh > /var/log/disk_management.log 2>&1"
fi