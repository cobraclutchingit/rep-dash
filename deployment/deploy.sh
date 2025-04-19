#!/bin/bash

# Rep Dashboard - Production Deployment Script with Zero Downtime
# This script performs a zero-downtime deployment of the Next.js application

set -e  # Exit on any error

# --- Color output for better readability ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Configuration variables ---
APP_NAME="rep-dash"
APP_USER="node-app"
APP_DIR="/var/www/${APP_NAME}"
REPO_URL="<repository-url>"  # Replace with your git repository URL
BRANCH="main"                # Production branch
MAX_ROLLBACKS=5              # Number of previous releases to keep

# Environment variables (customize as needed)
export NODE_ENV="production"
export PORT=3000
export NEXTAUTH_URL="https://rep-dashboard.example.com"  # Replace with your actual domain
export NEXTAUTH_SECRET="your-nextauth-secret"            # Replace with your actual secret
export DATABASE_URL="postgresql://rep_dash_user:password@localhost:5432/rep_dash_prod?schema=public"  # Update with actual credentials

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

# --- Check if running as root or the application user ---
if [ "$(id -u)" -eq 0 ]; then
  warn "This script is running as root. Consider running as ${APP_USER} instead."
fi

# --- Create directory structure if it doesn't exist ---
log "Setting up directory structure..."
mkdir -p ${APP_DIR}/{releases,shared}
mkdir -p ${APP_DIR}/shared/{node_modules,.next,public,logs,.env}

# --- Check if production deployment setup is properly configured ---
if [ ! -f "${APP_DIR}/shared/.env" ]; then
  warn "No .env file found in shared directory. Creating from deployment settings."
  cat > ${APP_DIR}/shared/.env << EOF
NODE_ENV=production
PORT=${PORT}
NEXTAUTH_URL=${NEXTAUTH_URL}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
DATABASE_URL=${DATABASE_URL}
EOF
fi

# --- Start deployment ---
log "Starting deployment of ${APP_NAME}..."
TIMESTAMP=$(date +%Y%m%d%H%M%S)
RELEASE_DIR="${APP_DIR}/releases/${TIMESTAMP}"

# --- Clone repository ---
log "Cloning repository..."
git clone --depth 1 --branch ${BRANCH} ${REPO_URL} ${RELEASE_DIR}

# --- Create symlinks to shared resources ---
log "Setting up shared resources..."
ln -sf ${APP_DIR}/shared/.env ${RELEASE_DIR}/.env
ln -sf ${APP_DIR}/shared/public ${RELEASE_DIR}/public
ln -sf ${APP_DIR}/shared/logs ${RELEASE_DIR}/logs
ln -sf ${APP_DIR}/shared/node_modules ${RELEASE_DIR}/node_modules

# --- Install dependencies ---
log "Installing dependencies..."
cd ${RELEASE_DIR}
npm ci --omit=dev

# --- Build application ---
log "Building application..."
npm run build

# --- Link .next to shared directory ---
log "Linking .next directory..."
rm -rf ${APP_DIR}/shared/.next
mv ${RELEASE_DIR}/.next ${APP_DIR}/shared/.next
ln -sf ${APP_DIR}/shared/.next ${RELEASE_DIR}/.next

# --- Setup PM2 configuration ---
log "Creating PM2 configuration..."
cat > ${RELEASE_DIR}/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: "${APP_NAME}",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "${RELEASE_DIR}",
      instances: "max", // Use max available CPUs
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: ${PORT}
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "${APP_DIR}/logs/error.log",
      out_file: "${APP_DIR}/logs/out.log",
      pid_file: "${APP_DIR}/logs/pm2.pid",
      merge_logs: true
    }
  ]
};
EOF

# --- Run prisma migrations ---
log "Running database migrations..."
cd ${RELEASE_DIR}
npx prisma migrate deploy

# --- Create current symlink ---
if [ -L "${APP_DIR}/current" ]; then
  # Store the current release for potential rollback
  PREVIOUS_RELEASE=$(readlink ${APP_DIR}/current)
  log "Previous release: ${PREVIOUS_RELEASE}"
fi

log "Linking new release as current..."
ln -sfn ${RELEASE_DIR} ${APP_DIR}/current

# --- Apply new release with zero-downtime ---
if pm2 list | grep -q "${APP_NAME}"; then
  log "Reloading application..."
  PM2_HOME=/home/${APP_USER}/.pm2 pm2 reload ${RELEASE_DIR}/ecosystem.config.js
else
  log "Starting application for the first time..."
  PM2_HOME=/home/${APP_USER}/.pm2 pm2 start ${RELEASE_DIR}/ecosystem.config.js
fi

# --- Save PM2 state ---
PM2_HOME=/home/${APP_USER}/.pm2 pm2 save

# --- Cleanup old releases ---
log "Cleaning up old releases..."
cd ${APP_DIR}/releases
ls -1dt */ | tail -n +$((MAX_ROLLBACKS + 1)) | xargs -I {} rm -rf {}

# --- Create rollback script ---
log "Creating rollback script..."
cat > ${APP_DIR}/rollback.sh << EOF
#!/bin/bash
# Rollback script generated on $(date)

set -e  # Exit on any error

# Available releases for rollback:
echo "Available releases for rollback:"
ls -1dt ${APP_DIR}/releases/*/ | head -n ${MAX_ROLLBACKS}

if [ -z "\$1" ]; then
  echo "Usage: ./rollback.sh <release-directory>"
  echo "Example: ./rollback.sh ${APP_DIR}/releases/20221231235959"
  exit 1
fi

ROLLBACK_RELEASE=\$1

if [ ! -d "\${ROLLBACK_RELEASE}" ]; then
  echo "Error: Release directory \${ROLLBACK_RELEASE} does not exist"
  exit 1
fi

echo "Rolling back to \$(basename \${ROLLBACK_RELEASE})..."

# Link the rollback release as current
ln -sfn \${ROLLBACK_RELEASE} ${APP_DIR}/current

# Reload the application
PM2_HOME=/home/${APP_USER}/.pm2 pm2 reload ${APP_NAME}

echo "Rollback completed successfully"
EOF

chmod +x ${APP_DIR}/rollback.sh

# --- Output success message ---
log "Deployment completed successfully!"
log "Application is running at ${NEXTAUTH_URL}"
log ""
log "To rollback to a previous release, use: ${APP_DIR}/rollback.sh <release-directory>"
log "Available releases:"
ls -1dt ${APP_DIR}/releases/*/ | head -n ${MAX_ROLLBACKS}