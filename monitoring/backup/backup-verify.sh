#!/bin/bash

# Rep Dashboard - Backup Verification Script
# This script verifies backup integrity and tests restoration

set -e  # Exit on any error

# --- Load configuration ---
source "$(dirname "$0")/backup-config.sh"

# --- Functions ---
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOGS_BACKUP_DIR}/backup-verify.log"
}

error() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "${LOGS_BACKUP_DIR}/backup-verify.log"
  if [ "${ENABLE_NOTIFICATIONS}" = true ]; then
    send_notification "Backup Verification Error" "$1"
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

verify_database_backup() {
  local backup_file="$1"
  local status=0
  
  log "Verifying database backup: ${backup_file}"
  
  # Create a temporary directory for verification
  local temp_dir=$(mktemp -d)
  
  # Check if the backup file exists
  if [ ! -f "${backup_file}" ]; then
    error "Backup file does not exist: ${backup_file}"
  fi
  
  # Check if it's encrypted
  if [[ "${backup_file}" == *.gpg ]]; then
    log "Decrypting backup file"
    
    if [ -n "${GPG_HOME}" ]; then
      gpg --homedir "${GPG_HOME}" --decrypt "${backup_file}" > "${temp_dir}/backup.sql" 2>/dev/null || { 
        error "Failed to decrypt backup file"
      }
    else
      gpg --decrypt "${backup_file}" > "${temp_dir}/backup.sql" 2>/dev/null || { 
        error "Failed to decrypt backup file"
      }
    fi
    
    backup_file="${temp_dir}/backup.sql"
  fi
  
  # Verify the backup file format
  if [[ "${backup_file}" == *.gz ]]; then
    log "Testing gzip integrity"
    gzip -t "${backup_file}" || {
      error "Backup file is corrupted (gzip test failed)"
    }
  fi
  
  # For custom format backups, verify with pg_restore
  if [[ "${backup_file}" == *.sql.gz ]] || [[ "${backup_file}" == *.dump ]] || [[ "${backup_file}" == *.sql ]]; then
    log "Testing database dump integrity with pg_restore"
    
    # Create test database
    local test_db="${DB_NAME}_verify_$(date +%s)"
    
    # Set PostgreSQL environment variables
    export PGHOST="${DB_HOST}"
    export PGPORT="${DB_PORT}"
    export PGUSER="${DB_USER}"
    # PGPASSWORD should be set in the environment or use .pgpass file
    
    log "Creating test database: ${test_db}"
    if ! psql -c "CREATE DATABASE ${test_db} WITH TEMPLATE template0;" postgres; then
      error "Failed to create test database"
    fi
    
    # Try to restore the backup to the test database
    log "Attempting test restore"
    if [[ "${backup_file}" == *.sql.gz ]]; then
      # Gunzip and pipe to psql
      gunzip -c "${backup_file}" | psql -d "${test_db}" >/dev/null 2>&1 || {
        status=1
      }
    elif [[ "${backup_file}" == *.dump ]]; then
      # Use pg_restore for custom format
      pg_restore -d "${test_db}" "${backup_file}" >/dev/null 2>&1 || {
        status=1
      }
    else
      # Plain SQL file
      psql -d "${test_db}" -f "${backup_file}" >/dev/null 2>&1 || {
        status=1
      }
    fi
    
    # Check if the restore was successful by verifying some tables exist
    if [ $status -eq 0 ]; then
      log "Checking for tables in restored database"
      local table_count=$(psql -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" "${test_db}")
      
      if [ "$table_count" -eq 0 ]; then
        error "Restore verification failed: no tables found in test database"
      else
        log "Successfully verified ${table_count} tables in test restore"
      fi
    else
      error "Failed to restore backup to test database"
    fi
    
    # Drop the test database
    log "Dropping test database"
    psql -c "DROP DATABASE ${test_db};" postgres
  fi
  
  # Cleanup
  rm -rf "${temp_dir}"
  
  log "Database backup verification completed successfully"
}

verify_application_backup() {
  local backup_file="$1"
  local status=0
  
  log "Verifying application backup: ${backup_file}"
  
  # Create a temporary directory for verification
  local temp_dir=$(mktemp -d)
  
  # Check if the backup file exists
  if [ ! -f "${backup_file}" ]; then
    error "Backup file does not exist: ${backup_file}"
  fi
  
  # Check if it's encrypted
  if [[ "${backup_file}" == *.gpg ]]; then
    log "Decrypting backup file"
    
    if [ -n "${GPG_HOME}" ]; then
      gpg --homedir "${GPG_HOME}" --decrypt "${backup_file}" > "${temp_dir}/backup.tar.gz" 2>/dev/null || { 
        error "Failed to decrypt backup file"
      }
    else
      gpg --decrypt "${backup_file}" > "${temp_dir}/backup.tar.gz" 2>/dev/null || { 
        error "Failed to decrypt backup file"
      }
    fi
    
    backup_file="${temp_dir}/backup.tar.gz"
  fi
  
  # Verify the backup file integrity
  if [[ "${backup_file}" == *.tar.gz ]]; then
    log "Testing tar.gz integrity"
    tar -tzf "${backup_file}" >/dev/null || {
      error "Backup file is corrupted (tar test failed)"
    }
    
    # Extract a few key files to verify content
    log "Extracting sample files for verification"
    tar -xzf "${backup_file}" -C "${temp_dir}" --strip-components=2 "*/package.json" "*/prisma/schema.prisma" "*/next.config.ts" 2>/dev/null || {
      log "Warning: Could not extract sample files, but archive seems valid"
    }
    
    # Check if at least package.json was extracted
    if [ -f "${temp_dir}/package.json" ]; then
      log "Successfully verified package.json content"
      
      # Check for specific content to verify it's the right application
      if ! grep -q "rep-dash" "${temp_dir}/package.json"; then
        error "Backup verification failed: package.json doesn't contain expected content"
      fi
    else
      log "Warning: Could not verify package.json, but archive seems valid"
    fi
  else
    error "Unknown backup format: ${backup_file}"
  fi
  
  # Cleanup
  rm -rf "${temp_dir}"
  
  log "Application backup verification completed successfully"
}

# --- Main ---
main() {
  log "Starting backup verification"
  
  # Get the latest database backup
  local db_backup="${DB_BACKUP_DIR}/latest.sql.gz"
  
  # If the latest symlink doesn't exist, find the most recent backup
  if [ ! -f "${db_backup}" ]; then
    db_backup=$(find "${DB_BACKUP_DIR}" -name "*.sql.gz*" -type f -o -name "*.dump*" -type f | sort -r | head -n 1)
  fi
  
  # Verify the database backup if it exists
  if [ -n "${db_backup}" ]; then
    verify_database_backup "${db_backup}"
  else
    error "No database backup found to verify"
  fi
  
  # Get the latest application backup
  local app_backup="${FILES_BACKUP_DIR}/latest.tar.gz"
  
  # If the latest symlink doesn't exist, find the most recent backup
  if [ ! -f "${app_backup}" ]; then
    app_backup=$(find "${FILES_BACKUP_DIR}" -name "${APP_NAME}_*.tar.gz*" -type f | sort -r | head -n 1)
  fi
  
  # Verify the application backup if it exists
  if [ -n "${app_backup}" ]; then
    verify_application_backup "${app_backup}"
  else
    error "No application backup found to verify"
  fi
  
  log "Backup verification completed successfully"
  
  # Send success notification
  if [ "${ENABLE_NOTIFICATIONS}" = true ]; then
    send_notification "Backup Verification Successful" "All backups have been verified successfully."
  fi
}

# --- Start verification ---
main