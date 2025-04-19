#!/bin/bash

# Rep Dashboard - Security Audit Script
# This script performs a comprehensive security audit for the application

set -e  # Exit on any error

# --- Configuration ---
APP_NAME="rep-dash"
APP_DIR="/var/www/${APP_NAME}"
LOG_DIR="/var/log/rep-dash"
REPORT_DIR="${LOG_DIR}/security"
SLACK_WEBHOOK_URL=""  # Set this to enable Slack notifications
EMAIL_RECIPIENT=""    # Set this to enable email notifications

# --- Functions ---
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${REPORT_DIR}/security-audit.log"
}

error() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "${REPORT_DIR}/security-audit.log"
  if [ -n "${SLACK_WEBHOOK_URL}" ]; then
    curl -s -X POST --data-urlencode "payload={\"text\":\"*Security Audit Error*\n${1}\"}" "${SLACK_WEBHOOK_URL}"
  fi
  exit 1
}

send_notification() {
  local subject="$1"
  local message="$2"
  local severity="$3"  # low, medium, high, critical
  
  # Email notification
  if [ -n "${EMAIL_RECIPIENT}" ]; then
    echo "${message}" | mail -s "[${severity^^}] ${subject}" "${EMAIL_RECIPIENT}"
  fi
  
  # Slack notification
  if [ -n "${SLACK_WEBHOOK_URL}" ]; then
    local color="good"
    if [ "${severity}" = "medium" ]; then
      color="warning"
    elif [ "${severity}" = "high" ] || [ "${severity}" = "critical" ]; then
      color="danger"
    fi
    
    curl -s -X POST -H 'Content-type: application/json' --data "{
      \"attachments\": [
        {
          \"color\": \"${color}\",
          \"title\": \"${subject}\",
          \"text\": \"${message}\",
          \"fields\": [
            {
              \"title\": \"Severity\",
              \"value\": \"${severity^^}\",
              \"short\": true
            },
            {
              \"title\": \"Application\",
              \"value\": \"${APP_NAME}\",
              \"short\": true
            }
          ]
        }
      ]
    }" "${SLACK_WEBHOOK_URL}"
  fi
}

# --- Create log and report directories if they don't exist ---
mkdir -p "${REPORT_DIR}"

# --- Generate timestamp for reports ---
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_FILE="${REPORT_DIR}/security-audit-${TIMESTAMP}.txt"

# --- Begin security audit ---
log "Starting security audit for ${APP_NAME}" | tee "${REPORT_FILE}"
echo "===============================================" | tee -a "${REPORT_FILE}"
echo "SECURITY AUDIT REPORT" | tee -a "${REPORT_FILE}"
echo "Application: ${APP_NAME}" | tee -a "${REPORT_FILE}"
echo "Date: $(date)" | tee -a "${REPORT_FILE}"
echo "===============================================" | tee -a "${REPORT_FILE}"
echo "" | tee -a "${REPORT_FILE}"

# --- Check for system updates ---
echo "1. SYSTEM UPDATES CHECK" | tee -a "${REPORT_FILE}"
echo "------------------------" | tee -a "${REPORT_FILE}"
apt_updates=$(apt-get -s upgrade | grep -c "^Inst")
security_updates=$(apt-get -s upgrade | grep -c "^Inst.*security")

echo "Pending updates: ${apt_updates}" | tee -a "${REPORT_FILE}"
echo "Security updates: ${security_updates}" | tee -a "${REPORT_FILE}"

if [ "${security_updates}" -gt 0 ]; then
  echo "ACTION REQUIRED: Security updates need to be installed" | tee -a "${REPORT_FILE}"
  send_notification "Security Updates Required" "There are ${security_updates} security updates pending installation." "high"
fi
echo "" | tee -a "${REPORT_FILE}"

# --- Check SSH configuration ---
echo "2. SSH CONFIGURATION CHECK" | tee -a "${REPORT_FILE}"
echo "---------------------------" | tee -a "${REPORT_FILE}"

# Check if PasswordAuthentication is disabled
ssh_password_auth=$(grep -c "^PasswordAuthentication no" /etc/ssh/sshd_config || echo "0")
ssh_root_login=$(grep -c "^PermitRootLogin no" /etc/ssh/sshd_config || echo "0")

if [ "${ssh_password_auth}" -eq 0 ]; then
  echo "SECURITY ISSUE: Password authentication is enabled for SSH" | tee -a "${REPORT_FILE}"
  send_notification "SSH Password Authentication Enabled" "Password authentication is enabled for SSH, which is less secure than key-based authentication." "medium"
else
  echo "Password authentication is correctly disabled for SSH" | tee -a "${REPORT_FILE}"
fi

if [ "${ssh_root_login}" -eq 0 ]; then
  echo "SECURITY ISSUE: Root login is not explicitly disabled" | tee -a "${REPORT_FILE}"
  send_notification "SSH Root Login Not Disabled" "Root login is not explicitly disabled in SSH configuration." "medium"
else
  echo "Root login is correctly disabled for SSH" | tee -a "${REPORT_FILE}"
fi
echo "" | tee -a "${REPORT_FILE}"

# --- Check firewall status ---
echo "3. FIREWALL STATUS" | tee -a "${REPORT_FILE}"
echo "-------------------" | tee -a "${REPORT_FILE}"

if command -v ufw &> /dev/null; then
  ufw_status=$(ufw status)
  echo "${ufw_status}" | tee -a "${REPORT_FILE}"
  
  if ! echo "${ufw_status}" | grep -q "Status: active"; then
    echo "SECURITY ISSUE: Firewall is not active" | tee -a "${REPORT_FILE}"
    send_notification "Firewall Not Active" "The system firewall (ufw) is not active." "high"
  fi
else
  echo "UFW not installed, checking iptables..." | tee -a "${REPORT_FILE}"
  iptables -L | tee -a "${REPORT_FILE}"
fi
echo "" | tee -a "${REPORT_FILE}"

# --- Check for exposed sensitive files ---
echo "4. SENSITIVE FILES CHECK" | tee -a "${REPORT_FILE}"
echo "------------------------" | tee -a "${REPORT_FILE}"

# Check for .env files with wrong permissions
env_files=$(find "${APP_DIR}" -name ".env*" -not -path "*/node_modules/*" -not -path "*/.git/*")
for file in ${env_files}; do
  permissions=$(stat -c "%a" "${file}")
  if [ "${permissions}" != "600" ] && [ "${permissions}" != "400" ]; then
    echo "SECURITY ISSUE: ${file} has insecure permissions: ${permissions}" | tee -a "${REPORT_FILE}"
    send_notification "Insecure Environment File Permissions" "Environment file ${file} has insecure permissions: ${permissions}. Should be 600 or 400." "high"
  else
    echo "${file} has secure permissions: ${permissions}" | tee -a "${REPORT_FILE}"
  fi
done

# Check for exposed secrets in code
echo "" | tee -a "${REPORT_FILE}"
echo "Checking for potential secrets in code..." | tee -a "${REPORT_FILE}"
potential_secrets=$(grep -r -E "(password|passwd|pwd|secret|token|key|auth|credential|api_key|apikey).*['\"][a-zA-Z0-9_\-\.=]{8,}['\"]" \
  --include="*.js" --include="*.ts" --include="*.tsx" \
  "${APP_DIR}" | grep -v "node_modules" | grep -v ".git")

if [ -n "${potential_secrets}" ]; then
  echo "SECURITY ISSUE: Potential hardcoded secrets found:" | tee -a "${REPORT_FILE}"
  echo "${potential_secrets}" | tee -a "${REPORT_FILE}"
  send_notification "Potential Hardcoded Secrets" "Found potential hardcoded secrets in code. See security audit report for details." "high"
else
  echo "No obvious hardcoded secrets found in code" | tee -a "${REPORT_FILE}"
fi
echo "" | tee -a "${REPORT_FILE}"

# --- Check Node.js application dependencies for vulnerabilities ---
echo "5. NODE.JS DEPENDENCIES CHECK" | tee -a "${REPORT_FILE}"
echo "------------------------------" | tee -a "${REPORT_FILE}"

if [ -f "${APP_DIR}/current/package.json" ]; then
  cd "${APP_DIR}/current"
  
  # Check for npm vulnerabilities
  echo "Running npm audit..." | tee -a "${REPORT_FILE}"
  npm_audit=$(npm audit --json 2>/dev/null || echo '{"vulnerabilities":{}}')
  
  # Count vulnerabilities by severity
  low_vulns=$(echo "${npm_audit}" | grep -o '"severity":"low"' | wc -l)
  moderate_vulns=$(echo "${npm_audit}" | grep -o '"severity":"moderate"' | wc -l)
  high_vulns=$(echo "${npm_audit}" | grep -o '"severity":"high"' | wc -l)
  critical_vulns=$(echo "${npm_audit}" | grep -o '"severity":"critical"' | wc -l)
  
  echo "Vulnerabilities found:" | tee -a "${REPORT_FILE}"
  echo "  Low: ${low_vulns}" | tee -a "${REPORT_FILE}"
  echo "  Moderate: ${moderate_vulns}" | tee -a "${REPORT_FILE}"
  echo "  High: ${high_vulns}" | tee -a "${REPORT_FILE}"
  echo "  Critical: ${critical_vulns}" | tee -a "${REPORT_FILE}"
  
  if [ "${high_vulns}" -gt 0 ] || [ "${critical_vulns}" -gt 0 ]; then
    echo "ACTION REQUIRED: Critical or high vulnerabilities found in dependencies" | tee -a "${REPORT_FILE}"
    echo "Run 'npm audit fix' to fix automatically fixable issues" | tee -a "${REPORT_FILE}"
    send_notification "Dependency Vulnerabilities" "Found ${high_vulns} high and ${critical_vulns} critical vulnerabilities in npm dependencies." "high"
  fi
else
  echo "No package.json found at ${APP_DIR}/current" | tee -a "${REPORT_FILE}"
fi
echo "" | tee -a "${REPORT_FILE}"

# --- Check for misconfigured CORS ---
echo "6. CORS CONFIGURATION CHECK" | tee -a "${REPORT_FILE}"
echo "----------------------------" | tee -a "${REPORT_FILE}"

# Check CORS configuration in Next.js config
if [ -f "${APP_DIR}/current/next.config.ts" ]; then
  cors_wildcard=$(grep -c "origin: ['\"]\\*['\"]" "${APP_DIR}/current/next.config.ts" || echo "0")
  if [ "${cors_wildcard}" -gt 0 ]; then
    echo "SECURITY ISSUE: Wildcard CORS origin found in next.config.ts" | tee -a "${REPORT_FILE}"
    send_notification "Insecure CORS Configuration" "Wildcard (*) CORS origin found in Next.js configuration." "medium"
  else
    echo "No wildcard CORS origin found in next.config.ts" | tee -a "${REPORT_FILE}"
  fi
fi

# Check CORS in API routes
wildcards=$(grep -r "Access-Control-Allow-Origin: ['\"]\\*['\"]" "${APP_DIR}/app/api" || echo "")
if [ -n "${wildcards}" ]; then
  echo "SECURITY ISSUE: Wildcard CORS headers found in API routes:" | tee -a "${REPORT_FILE}"
  echo "${wildcards}" | tee -a "${REPORT_FILE}"
  send_notification "Insecure CORS Headers" "Wildcard (*) CORS headers found in API routes." "medium"
else
  echo "No wildcard CORS headers found in API routes" | tee -a "${REPORT_FILE}"
fi
echo "" | tee -a "${REPORT_FILE}"

# --- Check Nginx configuration ---
echo "7. NGINX CONFIGURATION CHECK" | tee -a "${REPORT_FILE}"
echo "-----------------------------" | tee -a "${REPORT_FILE}"

if [ -f "/etc/nginx/sites-available/${APP_NAME}" ]; then
  # Check for security headers
  hsts_header=$(grep -c "Strict-Transport-Security" "/etc/nginx/sites-available/${APP_NAME}" || echo "0")
  xss_header=$(grep -c "X-XSS-Protection" "/etc/nginx/sites-available/${APP_NAME}" || echo "0")
  content_type_header=$(grep -c "X-Content-Type-Options" "/etc/nginx/sites-available/${APP_NAME}" || echo "0")
  frame_options_header=$(grep -c "X-Frame-Options" "/etc/nginx/sites-available/${APP_NAME}" || echo "0")
  csp_header=$(grep -c "Content-Security-Policy" "/etc/nginx/sites-available/${APP_NAME}" || echo "0")
  
  missing_headers=0
  
  if [ "${hsts_header}" -eq 0 ]; then
    echo "SECURITY ISSUE: HSTS header is missing" | tee -a "${REPORT_FILE}"
    missing_headers=$((missing_headers + 1))
  fi
  
  if [ "${xss_header}" -eq 0 ]; then
    echo "SECURITY ISSUE: X-XSS-Protection header is missing" | tee -a "${REPORT_FILE}"
    missing_headers=$((missing_headers + 1))
  fi
  
  if [ "${content_type_header}" -eq 0 ]; then
    echo "SECURITY ISSUE: X-Content-Type-Options header is missing" | tee -a "${REPORT_FILE}"
    missing_headers=$((missing_headers + 1))
  fi
  
  if [ "${frame_options_header}" -eq 0 ]; then
    echo "SECURITY ISSUE: X-Frame-Options header is missing" | tee -a "${REPORT_FILE}"
    missing_headers=$((missing_headers + 1))
  fi
  
  if [ "${csp_header}" -eq 0 ]; then
    echo "SECURITY ISSUE: Content-Security-Policy header is missing" | tee -a "${REPORT_FILE}"
    missing_headers=$((missing_headers + 1))
  fi
  
  if [ "${missing_headers}" -gt 0 ]; then
    echo "ACTION REQUIRED: ${missing_headers} security headers are missing in Nginx configuration" | tee -a "${REPORT_FILE}"
    send_notification "Missing Security Headers" "${missing_headers} security headers are missing in Nginx configuration." "medium"
  else
    echo "All security headers are properly configured" | tee -a "${REPORT_FILE}"
  fi
  
  # Check for SSL configuration
  ssl_protocols=$(grep "ssl_protocols" "/etc/nginx/sites-available/${APP_NAME}" || echo "")
  if [ -z "${ssl_protocols}" ] || echo "${ssl_protocols}" | grep -q "TLSv1 "; then
    echo "SECURITY ISSUE: Weak SSL protocols may be enabled" | tee -a "${REPORT_FILE}"
    send_notification "Weak SSL Protocols" "Nginx configuration may allow weak SSL protocols." "medium"
  else
    echo "SSL protocols properly configured: ${ssl_protocols}" | tee -a "${REPORT_FILE}"
  fi
else
  echo "Nginx configuration not found for ${APP_NAME}" | tee -a "${REPORT_FILE}"
fi
echo "" | tee -a "${REPORT_FILE}"

# --- Check process owner security ---
echo "8. PROCESS OWNERSHIP CHECK" | tee -a "${REPORT_FILE}"
echo "----------------------------" | tee -a "${REPORT_FILE}"

# Check that the application is not running as root
running_as_root=$(ps aux | grep node | grep -v grep | grep -c "^root" || echo "0")
if [ "${running_as_root}" -gt 0 ]; then
  echo "SECURITY ISSUE: Node.js processes running as root" | tee -a "${REPORT_FILE}"
  ps aux | grep node | grep "^root" | tee -a "${REPORT_FILE}"
  send_notification "Node.js Running as Root" "One or more Node.js processes are running as root, which is a security risk." "high"
else
  echo "No Node.js processes running as root" | tee -a "${REPORT_FILE}"
fi
echo "" | tee -a "${REPORT_FILE}"

# --- Check database security ---
echo "9. DATABASE SECURITY CHECK" | tee -a "${REPORT_FILE}"
echo "----------------------------" | tee -a "${REPORT_FILE}"

# Check PostgreSQL configuration
if [ -f "/etc/postgresql/14/main/pg_hba.conf" ]; then
  # Check for unencrypted authentication methods
  md5_only=$(grep -v "^#" "/etc/postgresql/14/main/pg_hba.conf" | grep -v "^$" | grep -v "md5\|scram-sha-256" | wc -l)
  if [ "${md5_only}" -gt 0 ]; then
    echo "SECURITY ISSUE: Non-encrypted authentication methods found in PostgreSQL configuration" | tee -a "${REPORT_FILE}"
    grep -v "^#" "/etc/postgresql/14/main/pg_hba.conf" | grep -v "^$" | grep -v "md5\|scram-sha-256" | tee -a "${REPORT_FILE}"
    send_notification "Insecure Database Authentication" "Non-encrypted authentication methods found in PostgreSQL configuration." "high"
  else
    echo "PostgreSQL using secure authentication methods" | tee -a "${REPORT_FILE}"
  fi
  
  # Check if PostgreSQL is listening on all interfaces
  listen_addresses=$(grep "^listen_addresses" "/etc/postgresql/14/main/postgresql.conf" || echo "")
  if echo "${listen_addresses}" | grep -q "'\\*'\|0.0.0.0"; then
    echo "SECURITY ISSUE: PostgreSQL is listening on all interfaces" | tee -a "${REPORT_FILE}"
    send_notification "PostgreSQL Listening on All Interfaces" "PostgreSQL is configured to listen on all network interfaces, which may expose it to unnecessary risk." "medium"
  else
    echo "PostgreSQL listening configuration: ${listen_addresses}" | tee -a "${REPORT_FILE}"
  fi
else
  echo "PostgreSQL configuration not found" | tee -a "${REPORT_FILE}"
fi
echo "" | tee -a "${REPORT_FILE}"

# --- Check login activity ---
echo "10. LOGIN ACTIVITY CHECK" | tee -a "${REPORT_FILE}"
echo "---------------------------" | tee -a "${REPORT_FILE}"

# Check failed SSH login attempts
failed_ssh=$(grep "Failed password" /var/log/auth.log | wc -l)
echo "Failed SSH login attempts: ${failed_ssh}" | tee -a "${REPORT_FILE}"

if [ "${failed_ssh}" -gt 10 ]; then
  echo "WARNING: High number of failed SSH login attempts" | tee -a "${REPORT_FILE}"
  echo "Most common sources:" | tee -a "${REPORT_FILE}"
  grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -nr | head -5 | tee -a "${REPORT_FILE}"
  send_notification "High Failed SSH Attempts" "Detected ${failed_ssh} failed SSH login attempts. Could indicate brute force attack." "medium"
fi

# Check for suspicious logins
echo "" | tee -a "${REPORT_FILE}"
echo "Recent successful logins:" | tee -a "${REPORT_FILE}"
last | head -10 | tee -a "${REPORT_FILE}"
echo "" | tee -a "${REPORT_FILE}"

# --- Generate security score ---
echo "SECURITY SCORE" | tee -a "${REPORT_FILE}"
echo "--------------" | tee -a "${REPORT_FILE}"

# Count issues by severity
critical_issues=$(grep -c "SECURITY ISSUE" "${REPORT_FILE}")
warnings=$(grep -c "WARNING" "${REPORT_FILE}")
actions=$(grep -c "ACTION REQUIRED" "${REPORT_FILE}")

total_issues=$((critical_issues + warnings))

# Calculate a simple score (100 - (critical*10 + warnings*5))
score=$((100 - (critical_issues * 10) - (warnings * 5)))
if [ "${score}" -lt 0 ]; then
  score=0
fi

echo "Critical issues: ${critical_issues}" | tee -a "${REPORT_FILE}"
echo "Warnings: ${warnings}" | tee -a "${REPORT_FILE}"
echo "Actions required: ${actions}" | tee -a "${REPORT_FILE}"
echo "Security score: ${score}/100" | tee -a "${REPORT_FILE}"

# Determine overall security status
if [ "${score}" -ge 90 ]; then
  status="EXCELLENT"
elif [ "${score}" -ge 70 ]; then
  status="GOOD"
elif [ "${score}" -ge 50 ]; then
  status="FAIR"
else
  status="POOR"
fi

echo "Overall security status: ${status}" | tee -a "${REPORT_FILE}"
echo "" | tee -a "${REPORT_FILE}"

# --- Recommendations ---
echo "RECOMMENDATIONS" | tee -a "${REPORT_FILE}"
echo "---------------" | tee -a "${REPORT_FILE}"

if [ "${security_updates}" -gt 0 ]; then
  echo "1. Apply pending security updates using 'apt-get upgrade'" | tee -a "${REPORT_FILE}"
fi

if [ "${high_vulns}" -gt 0 ] || [ "${critical_vulns}" -gt 0 ]; then
  echo "2. Update vulnerable npm packages using 'npm audit fix'" | tee -a "${REPORT_FILE}"
fi

if [ "${missing_headers}" -gt 0 ]; then
  echo "3. Add missing security headers to Nginx configuration" | tee -a "${REPORT_FILE}"
fi

if [ "${failed_ssh}" -gt 10 ]; then
  echo "4. Review SSH security and consider implementing additional protections" | tee -a "${REPORT_FILE}"
fi

echo "" | tee -a "${REPORT_FILE}"
echo "===============================================" | tee -a "${REPORT_FILE}"
echo "End of Security Audit Report" | tee -a "${REPORT_FILE}"
echo "Report saved to: ${REPORT_FILE}" | tee -a "${REPORT_FILE}"
echo "===============================================" | tee -a "${REPORT_FILE}"

# --- Send notification of audit completion ---
if [ -n "${SLACK_WEBHOOK_URL}" ]; then
  curl -s -X POST -H 'Content-type: application/json' --data "{
    \"attachments\": [
      {
        \"color\": \"$(if [ ${score} -ge 70 ]; then echo 'good'; elif [ ${score} -ge 50 ]; then echo 'warning'; else echo 'danger'; fi)\",
        \"title\": \"Security Audit Completed\",
        \"text\": \"Security audit completed for ${APP_NAME}.\",
        \"fields\": [
          {
            \"title\": \"Security Score\",
            \"value\": \"${score}/100 (${status})\",
            \"short\": true
          },
          {
            \"title\": \"Issues Found\",
            \"value\": \"${total_issues} (${critical_issues} critical)\",
            \"short\": true
          }
        ]
      }
    ]
  }" "${SLACK_WEBHOOK_URL}"
fi

if [ -n "${EMAIL_RECIPIENT}" ]; then
  (
    echo "Subject: Security Audit Report - ${APP_NAME} - Score: ${score}/100 (${status})"
    echo "To: ${EMAIL_RECIPIENT}"
    echo "MIME-Version: 1.0"
    echo "Content-Type: text/plain"
    echo ""
    cat "${REPORT_FILE}"
  ) | sendmail -t
fi

log "Security audit completed with score: ${score}/100 (${status})"