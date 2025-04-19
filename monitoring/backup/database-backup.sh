#!/bin/bash

# Rep Dashboard - Database Backup Script
# This script performs full and incremental database backups

set -e  # Exit on any error

# --- Load configuration ---
source "$(dirname "$0")/backup-config.sh"

# --- Functions ---
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOGS_BACKUP_DIR}/db-backup.log"
}

error() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "${LOGS_BACKUP_DIR}/db-backup.log"
  if [ "${ENABLE_NOTIFICATIONS}" = true ]; then
    send_notification "Database Backup Error" "$1"
  fi
  exit 1
}

send_notification() {
  local subject="$1"
  local message="$2"
  
  # Email notification
  if [ -n "${NOTIFICATION_EMAIL}" ]; then
    echo "${message}" | mail -s "[Rep Dashboard] ${subject}" "${NOTIFICATION_EMAIL}"
  fi
  
  # Slack notification
  if [ -n "${SLACK_WEBHOOK_URL}" ]; then
    curl -s -X POST --data-urlencode "payload={\"text\":\"*${subject}*\n${message}\"}" "${SLACK_WEBHOOK_URL}"
  fi
}

send_healthcheck() {
  if [ "${ENABLE_HEALTHCHECK}" = true ] && [ -n "${HEALTHCHECK_URL}" ]; then
    if [ "$1" = "success" ]; then
      curl -s -m 10 --retry 5 "${HEALTHCHECK_URL}"
    else
      curl -s -m 10 --retry 5 "${HEALTHCHECK_URL}/fail"
    fi
  fi
}

encrypt_file() {
  local file="$1"
  
  if [ "${ENABLE_ENCRYPTION}" = true ] && [ -n "${GPG_RECIPIENT}" ]; then
    log "Encrypting ${file}"
    if [ -n "${GPG_HOME}" ]; then
      gpg --homedir "${GPG_HOME}" -e -r "${GPG_RECIPIENT}" "${file}"
    else
      gpg -e -r "${GPG_RECIPIENT}" "${file}"
    fi
    rm "${file}"  # Remove unencrypted file
  fi
}

upload_to_remote() {
  local file="$1"
  local remote_path="$2"
  
  if [ "${ENABLE_REMOTE_BACKUP}" != true ]; then
    return 0
  fi
  
  log "Uploading ${file} to remote storage"
  
  case "${REMOTE_BACKUP_TYPE}" in
    s3)
      if [ -z "${AWS_ACCESS_KEY_ID}" ] || [ -z "${AWS_SECRET_ACCESS_KEY}" ]; then
        log "Warning: AWS credentials not set, skipping S3 upload"
        return 1
      fi
      aws s3 cp "${file}" "s3://${S3_BUCKET}/${S3_PREFIX}/${remote_path}/"
      ;;
    sftp)
      if [ -z "${SFTP_HOST}" ] || [ -z "${SFTP_USER}" ] || [ -z "${SFTP_PATH}" ]; then
        log "Warning: SFTP settings incomplete, skipping SFTP upload"
        return 1
      fi
      sftp ${SFTP_USER}@${SFTP_HOST}:${SFTP_PATH}/${remote_path}/ <<< $"put ${file}"
      ;;
    rsync)
      if [ -z "${RSYNC_TARGET}" ]; then
        log "Warning: RSYNC_TARGET not set, skipping rsync upload"
        return 1
      fi
      rsync -avz "${file}" "${RSYNC_TARGET}/${remote_path}/"
      ;;
    *)
      log "Warning: Unknown remote backup type: ${REMOTE_BACKUP_TYPE}"
      return 1
      ;;
  esac
  
  return $?
}

# --- Main ---
main() {
  local backup_type="$1"
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local day_of_week=$(date +"%u")  # 1-7, where 1 is Monday
  local day_of_month=$(date +"%d")
  
  # Create backup directories if they don't exist
  mkdir -p "${DB_BACKUP_DIR}/daily" "${DB_BACKUP_DIR}/weekly" "${DB_BACKUP_DIR}/monthly" "${LOGS_BACKUP_DIR}"
  
  # Set backup filename and path based on backup type
  local backup_filename="${DB_NAME}_${timestamp}.sql"
  local backup_path="${DB_BACKUP_DIR}/daily/${backup_filename}"
  local remote_path="database/daily"
  
  # For weekly and monthly backups, create hard links to save space
  if [ "${backup_type}" = "weekly" ] || [ "${day_of_week}" = "7" ]; then  # Sunday
    mkdir -p "${DB_BACKUP_DIR}/weekly"
    remote_path="database/weekly"
  fi
  
  if [ "${backup_type}" = "monthly" ] || [ "${day_of_month}" = "01" ]; then  # First day of month
    mkdir -p "${DB_BACKUP_DIR}/monthly"
    remote_path="database/monthly"
  fi
  
  log "Starting ${backup_type} backup of ${DB_NAME} database"
  
  # Check if pg_dump is available
  if ! command -v pg_dump &> /dev/null; then
    error "pg_dump command not found. Is PostgreSQL installed?"
  fi
  
  # Set PostgreSQL environment variables
  export PGHOST="${DB_HOST}"
  export PGPORT="${DB_PORT}"
  export PGUSER="${DB_USER}"
  export PGDATABASE="${DB_NAME}"
  # PGPASSWORD should be set in the environment or use .pgpass file
  
  # Create backup
  log "Creating database dump to ${backup_path}"
  if ! pg_dump -Fc -Z${COMPRESSION_LEVEL} -f "${backup_path}"; then
    error "Database backup failed"
  fi
  
  # Calculate backup size
  local backup_size=$(du -h "${backup_path}" | cut -f1)
  log "Backup created successfully (${backup_size})"
  
  # Encrypt backup if enabled
  if [ "${ENABLE_ENCRYPTION}" = true ]; then
    encrypt_file "${backup_path}"
    backup_path="${backup_path}.gpg"
  fi
  
  # Create hard links for weekly/monthly backups
  if [ "${backup_type}" = "weekly" ] || [ "${day_of_week}" = "7" ]; then
    local weekly_path="${DB_BACKUP_DIR}/weekly/$(basename "${backup_path}")"
    ln "${backup_path}" "${weekly_path}" 2>/dev/null || cp "${backup_path}" "${weekly_path}"
    log "Created weekly backup at ${weekly_path}"
  fi
  
  if [ "${backup_type}" = "monthly" ] || [ "${day_of_month}" = "01" ]; then
    local monthly_path="${DB_BACKUP_DIR}/monthly/$(basename "${backup_path}")"
    ln "${backup_path}" "${monthly_path}" 2>/dev/null || cp "${backup_path}" "${monthly_path}"
    log "Created monthly backup at ${monthly_path}"
  fi
  
  # Upload to remote storage
  if [ "${ENABLE_REMOTE_BACKUP}" = true ]; then
    if upload_to_remote "${backup_path}" "${remote_path}"; then
      log "Upload to remote storage successful"
    else
      error "Upload to remote storage failed"
    fi
  fi
  
  # Cleanup old backups
  log "Cleaning up old backups"
  find "${DB_BACKUP_DIR}/daily" -name "*.sql*" -type f -mtime +${DAILY_RETENTION} -delete
  find "${DB_BACKUP_DIR}/weekly" -name "*.sql*" -type f -mtime +$((7 * WEEKLY_RETENTION)) -delete
  find "${DB_BACKUP_DIR}/monthly" -name "*.sql*" -type f -mtime +$((30 * MONTHLY_RETENTION)) -delete
  
  # Cleanup old logs
  find "${LOGS_BACKUP_DIR}" -name "*.log*" -type f -mtime +${LOG_RETENTION} -delete
  
  log "Database backup completed successfully"
  
  # Create symlink to latest backup
  ln -sf "${backup_path}" "${DB_BACKUP_DIR}/latest.sql.gz"
  
  # Send success notification
  if [ "${ENABLE_NOTIFICATIONS}" = true ]; then
    send_notification "Database Backup Successful" "Database ${DB_NAME} was backed up successfully.\nBackup size: ${backup_size}\nLocation: ${backup_path}"
  fi
  
  # Send healthcheck ping
  send_healthcheck "success"
}

# --- Handle command line arguments ---
backup_type="full"
if [ $# -ge 1 ]; then
  backup_type="$1"
fi

# Start backup
main "${backup_type}"