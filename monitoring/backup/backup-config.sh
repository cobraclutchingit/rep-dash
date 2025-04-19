#!/bin/bash

# Rep Dashboard - Backup Configuration
# Define all backup-related variables here

# --- Backup storage locations ---
BACKUP_ROOT="/var/backups/rep-dash"
DB_BACKUP_DIR="${BACKUP_ROOT}/database"
FILES_BACKUP_DIR="${BACKUP_ROOT}/files"
LOGS_BACKUP_DIR="${BACKUP_ROOT}/logs"

# --- Application details ---
APP_NAME="rep-dash"
APP_DIR="/var/www/${APP_NAME}"
APP_USER="node-app"

# --- Database details ---
DB_NAME="rep_dash_prod"
DB_USER="rep_dash_user"
DB_HOST="localhost"
DB_PORT="5432"
# For security, avoid storing DB password in scripts
# Use the .pgpass file method or environment variable method
# DB_PASSWORD is read from environment in the backup scripts

# --- Backup schedule ---
# These values are used in crontab
# Format: minute hour day-of-month month day-of-week
FULL_BACKUP_SCHEDULE="0 1 * * *"  # Daily at 1am
INCREMENTAL_BACKUP_SCHEDULE="0 */6 * * *"  # Every 6 hours
LOG_BACKUP_SCHEDULE="30 0 * * *"  # Daily at 00:30am

# --- Retention policy ---
# Number of backups to keep
DAILY_RETENTION=14  # Keep daily backups for 2 weeks
WEEKLY_RETENTION=4  # Keep weekly backups for 1 month
MONTHLY_RETENTION=12  # Keep monthly backups for 1 year
# Log retention in days
LOG_RETENTION=30

# --- Remote backup settings ---
ENABLE_REMOTE_BACKUP=true
REMOTE_BACKUP_TYPE="s3"  # Options: s3, sftp, rsync

# S3 settings
S3_BUCKET="rep-dash-backups"
S3_PREFIX="prod"
S3_REGION="us-east-1"
# AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY should be set in environment

# SFTP settings
SFTP_HOST="backup.example.com"
SFTP_USER="backup-user"
SFTP_PATH="/backups/rep-dash"
# SSH key authentication is assumed

# --- Notification settings ---
ENABLE_NOTIFICATIONS=true
NOTIFICATION_EMAIL="admin@example.com"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxxx/yyyy/zzzz"

# --- Encryption settings ---
ENABLE_ENCRYPTION=true
# Using GPG for encryption
GPG_RECIPIENT="backup@example.com"
# Optional: If using a non-standard GPG home
# GPG_HOME="/path/to/gpg"

# --- Performance settings ---
COMPRESSION_LEVEL=6  # 1-9, higher is slower but better compression
PARALLEL_JOBS=2  # Number of parallel jobs for compression

# --- Healthcheck settings ---
ENABLE_HEALTHCHECK=true
HEALTHCHECK_URL="https://hc-ping.com/your-uuid-here"