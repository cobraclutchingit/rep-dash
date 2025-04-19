#!/bin/bash

# Rep Dashboard - Application Maintenance Script
# This script performs regular maintenance tasks for the Next.js application

set -e  # Exit on any error

# --- Configuration ---
APP_NAME="rep-dash"
APP_DIR="/var/www/${APP_NAME}"
NODE_APP_USER="node-app"
LOG_DIR="/var/log/rep-dash"
SLACK_WEBHOOK_URL=""  # Set this to enable Slack notifications

# --- Functions ---
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_DIR}/app-maintenance.log"
}

error() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "${LOG_DIR}/app-maintenance.log"
  if [ -n "${SLACK_WEBHOOK_URL}" ]; then
    curl -s -X POST --data-urlencode "payload={\"text\":\"*Application Maintenance Error*\n${1}\"}" "${SLACK_WEBHOOK_URL}"
  fi
  exit 1
}

# --- Create log directory if it doesn't exist ---
mkdir -p "${LOG_DIR}"

# --- Begin maintenance ---
log "Starting application maintenance for ${APP_NAME}"

# --- Check if the application is running ---
if ! systemctl is-active pm2-${NODE_APP_USER} > /dev/null; then
  error "PM2 service is not running"
fi

# --- Check Node.js processes ---
log "Checking Node.js processes..."
pm2_status=$(sudo -u ${NODE_APP_USER} bash -c "PM2_HOME=/home/${NODE_APP_USER}/.pm2 pm2 list")
echo "${pm2_status}" | tee -a "${LOG_DIR}/app-maintenance.log"

# --- Check for memory leaks ---
log "Checking for memory issues..."
memory_usage=$(sudo -u ${NODE_APP_USER} bash -c "PM2_HOME=/home/${NODE_APP_USER}/.pm2 pm2 status | grep -A 10 ${APP_NAME}")
echo "${memory_usage}" | tee -a "${LOG_DIR}/app-maintenance.log"

# Check if memory usage is high (over 1GB)
if echo "${memory_usage}" | grep -q "1000M"; then
  log "WARNING: High memory usage detected, considering a restart"
  high_memory=true
else
  high_memory=false
fi

# --- Check for long-running requests ---
log "Checking for long-running requests in logs..."
long_requests=$(grep -i "timeout\|long running\|slow query\|took [0-9]\{4,\}ms" ${LOG_DIR}/app-error.log | tail -n 10)

if [ -n "${long_requests}" ]; then
  log "WARNING: Long-running requests detected:"
  echo "${long_requests}" | tee -a "${LOG_DIR}/app-maintenance.log"
fi

# --- Check disk space ---
log "Checking disk space..."
disk_space=$(df -h / /var/log)
echo "${disk_space}" | tee -a "${LOG_DIR}/app-maintenance.log"

# Check if disk space is low (less than 10% free)
if echo "${disk_space}" | grep -q "[9][0-9]%"; then
  log "WARNING: Low disk space detected"
  low_disk=true
else
  low_disk=false
fi

# --- Clean up Next.js cache ---
log "Cleaning up Next.js cache..."
if [ -d "${APP_DIR}/shared/.next/cache" ]; then
  cache_size_before=$(du -sh "${APP_DIR}/shared/.next/cache" | awk '{print $1}')
  log "Cache size before cleanup: ${cache_size_before}"
  
  # Remove all cache files older than 7 days
  find "${APP_DIR}/shared/.next/cache" -type f -mtime +7 -delete
  
  cache_size_after=$(du -sh "${APP_DIR}/shared/.next/cache" | awk '{print $1}')
  log "Cache size after cleanup: ${cache_size_after}"
fi

# --- Clean up log files ---
log "Cleaning up log files..."

# Remove log files older than 30 days
log_files_removed=$(find "${LOG_DIR}" -name "*.log.*" -type f -mtime +30 -delete -print | wc -l)
log "Removed ${log_files_removed} old log files"

# Compress log files older than a week but newer than 30 days
log_files_compressed=$(find "${LOG_DIR}" -name "*.log.*" -type f -mtime +7 -mtime -30 -not -name "*.gz" -exec gzip {} \; -print | wc -l)
log "Compressed ${log_files_compressed} log files"

# --- Check npm dependencies for updates ---
log "Checking for npm dependency updates..."
if [ -f "${APP_DIR}/current/package.json" ]; then
  cd "${APP_DIR}/current"
  
  # Use npm to check for outdated packages
  sudo -u ${NODE_APP_USER} npm outdated --json > "${LOG_DIR}/npm-outdated.json" || true
  
  # Check for security vulnerabilities
  log "Checking for security vulnerabilities..."
  sudo -u ${NODE_APP_USER} npm audit --json > "${LOG_DIR}/npm-audit.json" || true
  
  # Count high and critical vulnerabilities
  if [ -f "${LOG_DIR}/npm-audit.json" ]; then
    high_vulns=$(grep -c '"severity":"high"' "${LOG_DIR}/npm-audit.json" || echo "0")
    critical_vulns=$(grep -c '"severity":"critical"' "${LOG_DIR}/npm-audit.json" || echo "0")
    
    if [ "${high_vulns}" -gt 0 ] || [ "${critical_vulns}" -gt 0 ]; then
      log "WARNING: Found ${high_vulns} high and ${critical_vulns} critical vulnerabilities"
      has_vulnerabilities=true
    else
      has_vulnerabilities=false
    fi
  fi
fi

# --- Check for stale PM2 logs ---
log "Cleaning PM2 logs..."
sudo -u ${NODE_APP_USER} bash -c "PM2_HOME=/home/${NODE_APP_USER}/.pm2 pm2 flush"

# --- Rotate PM2 logs if not using logrotate ---
if sudo -u ${NODE_APP_USER} bash -c "PM2_HOME=/home/${NODE_APP_USER}/.pm2 pm2 list | grep -q 'pm2-logrotate'"; then
  log "PM2 log rotation is already configured"
else
  log "Setting up PM2 log rotation..."
  sudo -u ${NODE_APP_USER} bash -c "PM2_HOME=/home/${NODE_APP_USER}/.pm2 pm2 install pm2-logrotate"
  sudo -u ${NODE_APP_USER} bash -c "PM2_HOME=/home/${NODE_APP_USER}/.pm2 pm2 set pm2-logrotate:max_size 10M"
  sudo -u ${NODE_APP_USER} bash -c "PM2_HOME=/home/${NODE_APP_USER}/.pm2 pm2 set pm2-logrotate:compress true"
  sudo -u ${NODE_APP_USER} bash -c "PM2_HOME=/home/${NODE_APP_USER}/.pm2 pm2 set pm2-logrotate:retain 7"
fi

# --- Application health check ---
log "Performing application health check..."
health_check=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "Failed")

if [ "${health_check}" = "200" ]; then
  log "Health check passed: HTTP 200"
else
  log "WARNING: Health check failed with status ${health_check}"
  health_check_failed=true
fi

# --- Decide if application restart is needed ---
restart_needed=false

if [ "${high_memory}" = true ]; then
  log "Restart needed: High memory usage"
  restart_needed=true
fi

if [ "${health_check_failed}" = true ]; then
  log "Restart needed: Failed health check"
  restart_needed=true
fi

# --- Restart the application if needed ---
if [ "${restart_needed}" = true ]; then
  log "Restarting application..."
  sudo -u ${NODE_APP_USER} bash -c "PM2_HOME=/home/${NODE_APP_USER}/.pm2 pm2 restart ${APP_NAME}"
fi

# --- Maintenance summary ---
log "Application maintenance summary:"
log "- Disk space: $(if [ "${low_disk}" = true ]; then echo "LOW"; else echo "OK"; fi)"
log "- Memory usage: $(if [ "${high_memory}" = true ]; then echo "HIGH"; else echo "OK"; fi)"
log "- Health check: $(if [ "${health_check_failed}" = true ]; then echo "FAILED"; else echo "OK"; fi)"
log "- Security vulnerabilities: $(if [ "${has_vulnerabilities}" = true ]; then echo "FOUND"; else echo "OK"; fi)"
log "- Application restarted: $(if [ "${restart_needed}" = true ]; then echo "YES"; else echo "NO"; fi)"

# Generate an overall status
if [ "${low_disk}" = true ] || [ "${has_vulnerabilities}" = true ]; then
  overall_status="WARNING"
elif [ "${restart_needed}" = true ]; then
  overall_status="RESTARTED"
else
  overall_status="OK"
fi

log "Overall status: ${overall_status}"

# --- Send notification if configured ---
if [ -n "${SLACK_WEBHOOK_URL}" ]; then
  if [ "${overall_status}" = "OK" ]; then
    curl -s -X POST --data-urlencode "payload={\"text\":\"*Application Maintenance Completed*\nAll systems normal for ${APP_NAME}.\"}" "${SLACK_WEBHOOK_URL}"
  else
    curl -s -X POST --data-urlencode "payload={\"text\":\"*Application Maintenance Alert*\nStatus: ${overall_status}\n- Disk space: $(if [ "${low_disk}" = true ]; then echo "LOW"; else echo "OK"; fi)\n- Memory usage: $(if [ "${high_memory}" = true ]; then echo "HIGH"; else echo "OK"; fi)\n- Health check: $(if [ "${health_check_failed}" = true ]; then echo "FAILED"; else echo "OK"; fi)\n- Security vulnerabilities: $(if [ "${has_vulnerabilities}" = true ]; then echo "FOUND"; else echo "OK"; fi)\n- Application restarted: $(if [ "${restart_needed}" = true ]; then echo "YES"; else echo "NO"; fi)\"}" "${SLACK_WEBHOOK_URL}"
  fi
fi

log "Application maintenance completed"