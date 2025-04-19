#!/bin/bash

# Rep Dashboard - Application Backup Script
# This script backs up application files and configurations

set -e  # Exit on any error

# --- Load configuration ---
source "$(dirname "$0")/backup-config.sh"

# --- Functions ---
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOGS_BACKUP_DIR}/app-backup.log"
}

error() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "${LOGS_BACKUP_DIR}/app-backup.log"
  if [ "${ENABLE_NOTIFICATIONS}" = true ]; then
    send_notification "Application Backup Error" "$1"
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
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local day_of_week=$(date +"%u")  # 1-7, where 1 is Monday
  local day_of_month=$(date +"%d")
  
  # Create backup directories if they don't exist
  mkdir -p "${FILES_BACKUP_DIR}/daily" "${FILES_BACKUP_DIR}/weekly" "${FILES_BACKUP_DIR}/monthly"
  
  # Set backup filename and path
  local backup_filename="${APP_NAME}_${timestamp}.tar.gz"
  local backup_path="${FILES_BACKUP_DIR}/daily/${backup_filename}"
  local remote_path="files/daily"
  
  # For weekly and monthly backups, create hard links to save space
  if [ "${day_of_week}" = "7" ]; then  # Sunday
    mkdir -p "${FILES_BACKUP_DIR}/weekly"
    remote_path="files/weekly"
  fi
  
  if [ "${day_of_month}" = "01" ]; then  # First day of month
    mkdir -p "${FILES_BACKUP_DIR}/monthly"
    remote_path="files/monthly"
  fi
  
  log "Starting backup of ${APP_NAME} application files"
  
  # Create a list of files/directories to exclude
  local temp_exclude=$(mktemp)
  cat > "${temp_exclude}" << EOF
${APP_DIR}/node_modules
${APP_DIR}/.next/cache
${APP_DIR}/logs/*.log
*.git
*.log
*.pid
*.sock
*.tar.gz
*.tmp
EOF
  
  # Create backup
  log "Creating archive to ${backup_path}"
  if ! tar --exclude-from="${temp_exclude}" -czf "${backup_path}" -C "$(dirname "${APP_DIR}")" "$(basename "${APP_DIR}")"; then
    rm "${temp_exclude}"
    error "Application backup failed"
  fi
  
  rm "${temp_exclude}"
  
  # Calculate backup size
  local backup_size=$(du -h "${backup_path}" | cut -f1)
  log "Backup created successfully (${backup_size})"
  
  # Encrypt backup if enabled
  if [ "${ENABLE_ENCRYPTION}" = true ]; then
    encrypt_file "${backup_path}"
    backup_path="${backup_path}.gpg"
  fi
  
  # Create hard links for weekly/monthly backups
  if [ "${day_of_week}" = "7" ]; then
    local weekly_path="${FILES_BACKUP_DIR}/weekly/$(basename "${backup_path}")"
    ln "${backup_path}" "${weekly_path}" 2>/dev/null || cp "${backup_path}" "${weekly_path}"
    log "Created weekly backup at ${weekly_path}"
  fi
  
  if [ "${day_of_month}" = "01" ]; then
    local monthly_path="${FILES_BACKUP_DIR}/monthly/$(basename "${backup_path}")"
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
  
  # Backup environment variables separately (they contain sensitive data)
  if [ -f "${APP_DIR}/shared/.env" ]; then
    local env_backup="${FILES_BACKUP_DIR}/env_${timestamp}.txt"
    
    if ! cp "${APP_DIR}/shared/.env" "${env_backup}"; then
      error "Environment variables backup failed"
    fi
    
    # Encrypt environment backup
    if [ "${ENABLE_ENCRYPTION}" = true ]; then
      encrypt_file "${env_backup}"
      env_backup="${env_backup}.gpg"
    fi
    
    # Upload environment backup
    if [ "${ENABLE_REMOTE_BACKUP}" = true ]; then
      upload_to_remote "${env_backup}" "env"
    fi
  fi
  
  # Backup nginx configuration if it exists
  if [ -f "/etc/nginx/sites-available/${APP_NAME}" ]; then
    local nginx_backup="${FILES_BACKUP_DIR}/nginx_${timestamp}.conf"
    
    if ! cp "/etc/nginx/sites-available/${APP_NAME}" "${nginx_backup}"; then
      log "Warning: Nginx configuration backup failed"
    else
      # Encrypt nginx backup
      if [ "${ENABLE_ENCRYPTION}" = true ]; then
        encrypt_file "${nginx_backup}"
        nginx_backup="${nginx_backup}.gpg"
      fi
      
      # Upload nginx backup
      if [ "${ENABLE_REMOTE_BACKUP}" = true ]; then
        upload_to_remote "${nginx_backup}" "config"
      fi
    fi
  fi
  
  # Backup PM2 configuration if it exists
  if [ -f "${APP_DIR}/current/ecosystem.config.js" ]; then
    local pm2_backup="${FILES_BACKUP_DIR}/pm2_${timestamp}.js"
    
    if ! cp "${APP_DIR}/current/ecosystem.config.js" "${pm2_backup}"; then
      log "Warning: PM2 configuration backup failed"
    else
      # Encrypt PM2 backup
      if [ "${ENABLE_ENCRYPTION}" = true ]; then
        encrypt_file "${pm2_backup}"
        pm2_backup="${pm2_backup}.gpg"
      fi
      
      # Upload PM2 backup
      if [ "${ENABLE_REMOTE_BACKUP}" = true ]; then
        upload_to_remote "${pm2_backup}" "config"
      fi
    fi
  fi
  
  # Cleanup old backups
  log "Cleaning up old backups"
  find "${FILES_BACKUP_DIR}/daily" -name "${APP_NAME}_*.tar.gz*" -type f -mtime +${DAILY_RETENTION} -delete
  find "${FILES_BACKUP_DIR}/weekly" -name "${APP_NAME}_*.tar.gz*" -type f -mtime +$((7 * WEEKLY_RETENTION)) -delete
  find "${FILES_BACKUP_DIR}/monthly" -name "${APP_NAME}_*.tar.gz*" -type f -mtime +$((30 * MONTHLY_RETENTION)) -delete
  
  # Cleanup old configuration backups
  find "${FILES_BACKUP_DIR}" -name "env_*.txt*" -type f -mtime +${DAILY_RETENTION} -delete
  find "${FILES_BACKUP_DIR}" -name "nginx_*.conf*" -type f -mtime +${DAILY_RETENTION} -delete
  find "${FILES_BACKUP_DIR}" -name "pm2_*.js*" -type f -mtime +${DAILY_RETENTION} -delete
  
  log "Application backup completed successfully"
  
  # Create symlink to latest backup
  ln -sf "${backup_path}" "${FILES_BACKUP_DIR}/latest.tar.gz"
  
  # Send success notification
  if [ "${ENABLE_NOTIFICATIONS}" = true ]; then
    send_notification "Application Backup Successful" "Application ${APP_NAME} was backed up successfully.\nBackup size: ${backup_size}\nLocation: ${backup_path}"
  fi
  
  # Send healthcheck ping
  send_healthcheck "success"
}

# --- Start backup ---
main