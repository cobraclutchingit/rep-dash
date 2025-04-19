#!/bin/bash

# Rep Dashboard - Production Backup Script
# This script creates backups of the database and application files

set -e  # Exit on any error

# --- Color output for better readability ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Configuration variables ---
APP_NAME="rep-dash"
DB_NAME="rep_dash_prod"
DB_USER="rep_dash_user"
BACKUP_DIR="/var/backups/${APP_NAME}"
APP_DIR="/var/www/${APP_NAME}"
RETENTION_DAYS=30
AWS_S3_BUCKET="rep-dash-backups"  # Optional: Set to your S3 bucket for remote backups
AWS_S3_PREFIX="backups"           # Optional: Prefix for S3 path

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

# --- Create backup directory if it doesn't exist ---
log "Setting up backup directory..."
mkdir -p ${BACKUP_DIR}/{database,files,logs}
chmod 700 ${BACKUP_DIR}

# --- Create timestamp for backup files ---
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_LOG="${BACKUP_DIR}/logs/backup_${TIMESTAMP}.log"

# --- Start backup process ---
log "Starting backup process..." | tee -a ${BACKUP_LOG}
echo "Backup started at $(date)" >> ${BACKUP_LOG}

# --- Backup database ---
log "Backing up PostgreSQL database..." | tee -a ${BACKUP_LOG}
DB_BACKUP_FILE="${BACKUP_DIR}/database/${DB_NAME}_${TIMESTAMP}.sql.gz"

if sudo -u postgres pg_dump ${DB_NAME} | gzip > ${DB_BACKUP_FILE}; then
  log "Database backup completed: ${DB_BACKUP_FILE}" | tee -a ${BACKUP_LOG}
  # Create a symlink to the latest backup
  ln -sf ${DB_BACKUP_FILE} ${BACKUP_DIR}/database/latest.sql.gz
else
  error "Database backup failed" | tee -a ${BACKUP_LOG}
fi

# --- Backup application files ---
log "Backing up application files..." | tee -a ${BACKUP_LOG}
APP_BACKUP_FILE="${BACKUP_DIR}/files/${APP_NAME}_${TIMESTAMP}.tar.gz"

if tar -czf ${APP_BACKUP_FILE} \
  --exclude="${APP_DIR}/releases/*/node_modules" \
  --exclude="${APP_DIR}/shared/node_modules" \
  --exclude="${APP_DIR}/shared/.next/cache" \
  ${APP_DIR}; then
  log "Application backup completed: ${APP_BACKUP_FILE}" | tee -a ${BACKUP_LOG}
  # Create a symlink to the latest backup
  ln -sf ${APP_BACKUP_FILE} ${BACKUP_DIR}/files/latest.tar.gz
else
  error "Application backup failed" | tee -a ${BACKUP_LOG}
fi

# --- Optional: Backup to S3 ---
if [ -n "${AWS_S3_BUCKET}" ] && command -v aws >/dev/null 2>&1; then
  log "Uploading backups to S3..." | tee -a ${BACKUP_LOG}
  
  # Upload database backup
  aws s3 cp ${DB_BACKUP_FILE} s3://${AWS_S3_BUCKET}/${AWS_S3_PREFIX}/database/ >> ${BACKUP_LOG} 2>&1
  
  # Upload application backup
  aws s3 cp ${APP_BACKUP_FILE} s3://${AWS_S3_BUCKET}/${AWS_S3_PREFIX}/files/ >> ${BACKUP_LOG} 2>&1
  
  log "S3 upload completed" | tee -a ${BACKUP_LOG}
fi

# --- Clean up old backups ---
log "Cleaning up old backups (older than ${RETENTION_DAYS} days)..." | tee -a ${BACKUP_LOG}
find ${BACKUP_DIR}/database -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
find ${BACKUP_DIR}/files -name "*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete
find ${BACKUP_DIR}/logs -name "*.log" -type f -mtime +${RETENTION_DAYS} -delete

# --- Output backup summary ---
TOTAL_SIZE=$(du -sh ${BACKUP_DIR} | cut -f1)
log "Backup process completed successfully!" | tee -a ${BACKUP_LOG}
log "Total backup size: ${TOTAL_SIZE}" | tee -a ${BACKUP_LOG}
log "Database backup: ${DB_BACKUP_FILE}" | tee -a ${BACKUP_LOG}
log "Application backup: ${APP_BACKUP_FILE}" | tee -a ${BACKUP_LOG}
log "Backup log: ${BACKUP_LOG}" | tee -a ${BACKUP_LOG}

# --- Create restore script for this backup ---
RESTORE_SCRIPT="${BACKUP_DIR}/restore_${TIMESTAMP}.sh"
log "Creating restore script: ${RESTORE_SCRIPT}" | tee -a ${BACKUP_LOG}

cat > ${RESTORE_SCRIPT} << EOF
#!/bin/bash

# Rep Dashboard - Restore Script for backup from ${TIMESTAMP}
# This script restores the database and application files from the backup

set -e  # Exit on any error

# --- Color output for better readability ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Configuration variables ---
APP_NAME="${APP_NAME}"
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
APP_DIR="${APP_DIR}"
DB_BACKUP_FILE="${DB_BACKUP_FILE}"
APP_BACKUP_FILE="${APP_BACKUP_FILE}"

# --- Function definitions ---
log() {
  echo -e "\${GREEN}[\$(date +"%Y-%m-%d %H:%M:%S")] \$1\${NC}"
}

warn() {
  echo -e "\${YELLOW}[\$(date +"%Y-%m-%d %H:%M:%S")] WARNING: \$1\${NC}"
}

error() {
  echo -e "\${RED}[\$(date +"%Y-%m-%d %H:%M:%S")] ERROR: \$1\${NC}"
  exit 1
}

# --- Check if running as root ---
if [ "\$(id -u)" -ne 0 ]; then
  error "This script must be run as root or with sudo."
fi

log "Starting restore process..."

# --- Confirm before proceeding ---
echo "This will restore the database and application files from the backup taken on $(date -r ${DB_BACKUP_FILE})"
echo "WARNING: This will overwrite the current database and application files."
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo
if [[ ! \$REPLY =~ ^[Yy]$ ]]; then
  error "Restore cancelled by user."
fi

# --- Stop application ---
log "Stopping application..."
if pm2 list | grep -q "\${APP_NAME}"; then
  PM2_HOME=/home/node-app/.pm2 pm2 stop \${APP_NAME}
fi

# --- Restore database ---
log "Restoring database..."
if [ -f "\${DB_BACKUP_FILE}" ]; then
  # Drop existing database
  sudo -u postgres psql -c "DROP DATABASE IF EXISTS \${DB_NAME};"
  sudo -u postgres psql -c "CREATE DATABASE \${DB_NAME} OWNER \${DB_USER};"
  
  # Restore from backup
  gunzip -c \${DB_BACKUP_FILE} | sudo -u postgres psql \${DB_NAME}
  
  log "Database restore completed successfully"
else
  error "Database backup file not found: \${DB_BACKUP_FILE}"
fi

# --- Restore application files ---
log "Restoring application files..."
if [ -f "\${APP_BACKUP_FILE}" ]; then
  # Backup current .env file
  if [ -f "\${APP_DIR}/shared/.env" ]; then
    cp \${APP_DIR}/shared/.env \${APP_DIR}/shared/.env.bak
  fi
  
  # Remove existing files
  rm -rf \${APP_DIR}/releases \${APP_DIR}/shared
  
  # Extract from backup
  tar -xzf \${APP_BACKUP_FILE} -C /
  
  # Restore .env file from backup if it was lost
  if [ ! -f "\${APP_DIR}/shared/.env" ] && [ -f "\${APP_DIR}/shared/.env.bak" ]; then
    cp \${APP_DIR}/shared/.env.bak \${APP_DIR}/shared/.env
  fi
  
  log "Application restore completed successfully"
else
  error "Application backup file not found: \${APP_BACKUP_FILE}"
fi

# --- Start application ---
log "Starting application..."
if [ -L "\${APP_DIR}/current" ] && [ -f "\${APP_DIR}/current/ecosystem.config.js" ]; then
  PM2_HOME=/home/node-app/.pm2 pm2 start \${APP_DIR}/current/ecosystem.config.js
  PM2_HOME=/home/node-app/.pm2 pm2 save
  log "Application started successfully"
else
  warn "Could not find ecosystem.config.js in current release. Please deploy the application manually."
fi

log "Restore process completed successfully!"
EOF

chmod +x ${RESTORE_SCRIPT}

echo "Backup completed at $(date)" >> ${BACKUP_LOG}