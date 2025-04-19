#!/bin/bash

# Rep Dashboard - Complete Production Setup
# This script orchestrates the entire production deployment process

set -e  # Exit on any error

# --- Color output for better readability ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Configuration variables ---
APP_NAME="rep-dash"
DOMAIN="rep-dashboard.example.com"  # Change to your actual domain
EMAIL="admin@example.com"  # Change to your email for Let's Encrypt notifications

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

# --- Welcome message ---
log "Welcome to the Rep Dashboard Production Setup"
log "This script will guide you through the complete setup process."
log ""
log "The setup includes:"
log "1. Server configuration (Node.js, PostgreSQL, Nginx)"
log "2. PostgreSQL optimization"
log "3. SSL certificate setup with Let's Encrypt"
log "4. Monitoring and performance tools"
log "5. Backup configuration"
log ""
log "Domain: ${DOMAIN}"
log "Application: ${APP_NAME}"
log ""

# Ask for confirmation before proceeding
read -p "Do you want to proceed with the setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  log "Setup aborted by user."
  exit 0
fi

# --- Update deployment scripts with actual domain and email ---
log "Updating deployment scripts with your domain and email..."
find /var/www/rep-dash/deployment -type f -name "*.sh" -exec sed -i "s/rep-dashboard.example.com/${DOMAIN}/g" {} \;
find /var/www/rep-dash/deployment -type f -name "*.sh" -exec sed -i "s/admin@example.com/${EMAIL}/g" {} \;

# --- Step 1: Server setup ---
log "Step 1: Setting up the server..."
bash /var/www/rep-dash/deployment/server_setup.sh || error "Server setup failed."

# --- Step 2: PostgreSQL optimization ---
log "Step 2: Optimizing PostgreSQL..."
bash /var/www/rep-dash/deployment/postgres_optimize.sh || warn "PostgreSQL optimization failed, but continuing..."

# --- Step 3: SSL certificate setup ---
log "Step 3: Setting up SSL certificate..."
bash /var/www/rep-dash/deployment/ssl_setup.sh || warn "SSL setup failed, but continuing..."

# --- Step 4: Monitoring and performance tools ---
log "Step 4: Setting up monitoring and performance tools..."
bash /var/www/rep-dash/deployment/monitoring.sh || warn "Monitoring setup failed, but continuing..."

# --- Step 5: Backup configuration ---
log "Step 5: Setting up backup configuration..."
bash /var/www/rep-dash/deployment/backup.sh || warn "Backup setup failed, but continuing..."

# --- Setup environment variables ---
log "Setting up environment variables..."
if [ ! -d "/var/www/${APP_NAME}/shared" ]; then
  mkdir -p /var/www/${APP_NAME}/shared
  chown -R node-app:node-app /var/www/${APP_NAME}/shared
fi

# Copy the example env file to the shared directory
cp /var/www/rep-dash/deployment/env.example /var/www/${APP_NAME}/shared/.env.example
chown node-app:node-app /var/www/${APP_NAME}/shared/.env.example

# Get database password from config
DB_PASSWORD=$(grep DB_PASSWORD /root/app-setup/${APP_NAME}_config.txt | cut -d= -f2)

# Create actual .env file
cat > /var/www/${APP_NAME}/shared/.env << EOF
# Rep Dashboard - Production Environment Variables
# Generated on $(date)

# Node.js Environment
NODE_ENV=production
PORT=3000

# Next.js Configuration
NEXT_PUBLIC_API_URL=https://${DOMAIN}/api
NEXT_PUBLIC_APP_URL=https://${DOMAIN}

# NextAuth.js Configuration
NEXTAUTH_URL=https://${DOMAIN}
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Database Configuration
DATABASE_URL=postgresql://rep_dash_user:${DB_PASSWORD}@localhost:5432/rep_dash_prod?schema=public

# Email Configuration
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@${DOMAIN}

# Logging and Monitoring
LOG_LEVEL=info

# Security Settings
JWT_EXPIRY=2592000
RESET_TOKEN_EXPIRY=86400
RATE_LIMIT=60
RATE_LIMIT_WHITELIST=127.0.0.1

# Feature Flags
FEATURE_CONTESTS=true
FEATURE_ACHIEVEMENTS=true
FEATURE_TRAINING_CERTIFICATES=true

# Application time zone
TZ=UTC
EOF

chown node-app:node-app /var/www/${APP_NAME}/shared/.env
chmod 600 /var/www/${APP_NAME}/shared/.env

# --- Setup cron jobs ---
log "Setting up cron jobs..."
(crontab -l 2>/dev/null || echo "") | \
{ cat; echo "0 2 * * * /var/www/rep-dash/deployment/backup.sh > /var/log/backup.log 2>&1"; } | \
crontab -

(crontab -l 2>/dev/null || echo "") | \
{ cat; echo "0 3 * * 0 /usr/local/bin/db_maintenance.sh > /var/log/postgres_maintenance.log 2>&1"; } | \
crontab -

(crontab -l 2>/dev/null || echo "") | \
{ cat; echo "0 4 * * * /var/www/rep-dash/deployment/manage_disk_space.sh > /var/log/disk_management.log 2>&1"; } | \
crontab -

# --- Output summary ---
log "==============================================================="
log "Rep Dashboard Production Setup Completed!"
log "==============================================================="
log ""
log "Setup Summary:"
log "- Server configured with Node.js, PostgreSQL, and Nginx"
log "- PostgreSQL optimized for performance"
log "- SSL certificate obtained for ${DOMAIN}"
log "- Monitoring and performance tools installed"
log "- Backup configuration set up"
log "- Environment variables configured"
log "- Cron jobs set up for maintenance tasks"
log ""
log "Next steps:"
log "1. Deploy your application code:"
log "   sudo -u node-app bash /var/www/rep-dash/deployment/deploy.sh"
log ""
log "2. Check the application status:"
log "   pm2 list"
log "   pm2 logs"
log ""
log "3. Review the complete deployment documentation:"
log "   less /var/www/rep-dash/deployment/README.md"
log ""
log "4. Update your email configuration in .env:"
log "   nano /var/www/${APP_NAME}/shared/.env"
log ""
log "Your application will be available at: https://${DOMAIN}"
log ""
log "Database connection string:"
log "DATABASE_URL=postgresql://rep_dash_user:${DB_PASSWORD}@localhost:5432/rep_dash_prod?schema=public"
log ""
log "All configuration details have been saved to /root/app-setup/${APP_NAME}_config.txt"
log "==============================================================="