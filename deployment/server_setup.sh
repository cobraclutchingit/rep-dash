#!/bin/bash

# Rep Dashboard - Production Server Setup Script for Ubuntu 24.04
# This script sets up a complete production environment for the Next.js application

set -e  # Exit on any error

# --- Color output for better readability ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Configuration variables ---
# You may want to customize these values
APP_NAME="rep-dash"
DOMAIN="rep-dashboard.example.com"  # Change to your actual domain
NODE_VERSION="20"  # Node.js version
POSTGRES_VERSION="16"  # PostgreSQL version
APP_USER="node-app"
DB_NAME="rep_dash_prod"
DB_USER="rep_dash_user"
# Generate a random password
DB_PASSWORD=$(openssl rand -base64 24)
TZ="UTC"  # Change to your timezone

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

# --- Record all configuration to a file for reference ---
log "Recording configuration..."
mkdir -p /root/app-setup
cat > /root/app-setup/${APP_NAME}_config.txt << EOL
# ${APP_NAME} Configuration - $(date)
APP_NAME=${APP_NAME}
DOMAIN=${DOMAIN}
NODE_VERSION=${NODE_VERSION}
POSTGRES_VERSION=${POSTGRES_VERSION}
APP_USER=${APP_USER}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
TZ=${TZ}
EOL

log "Starting server setup for ${APP_NAME}..."

# --- Update system and set timezone ---
log "Updating system packages..."
apt-get update && apt-get upgrade -y

log "Setting timezone to ${TZ}..."
timedatectl set-timezone ${TZ}

# --- Install essential packages ---
log "Installing essential packages..."
apt-get install -y build-essential git curl wget gnupg2 ca-certificates \
  lsb-release debian-archive-keyring software-properties-common \
  apt-transport-https unzip fail2ban logrotate chrony

# --- Setup Node.js ---
log "Setting up Node.js ${NODE_VERSION}..."
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_VERSION}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
apt-get update
apt-get install -y nodejs
npm install -g npm@latest
npm install -g pm2

# --- Install and configure PostgreSQL ---
log "Installing PostgreSQL ${POSTGRES_VERSION}..."
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg
echo "deb [signed-by=/etc/apt/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list
apt-get update
apt-get install -y postgresql-${POSTGRES_VERSION} postgresql-contrib-${POSTGRES_VERSION}

# Ensure PostgreSQL is started
systemctl start postgresql
systemctl enable postgresql

# Create database and user
log "Setting up PostgreSQL database and user..."
sudo -u postgres psql << EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER USER ${DB_USER} WITH SUPERUSER;
\c ${DB_NAME}
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
ALTER USER ${DB_USER} WITH NOSUPERUSER;
EOF

# Configure PostgreSQL for better performance
log "Optimizing PostgreSQL configuration..."
PG_CONF="/etc/postgresql/${POSTGRES_VERSION}/main/postgresql.conf"
PG_HBA="/etc/postgresql/${POSTGRES_VERSION}/main/pg_hba.conf"
MEMORY_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
MEMORY_MB=$((MEMORY_KB / 1024))
SHARED_BUFFERS=$((MEMORY_MB / 4))  # 25% of RAM

# Create backup of original files
cp ${PG_CONF} ${PG_CONF}.bak
cp ${PG_HBA} ${PG_HBA}.bak

# Update PostgreSQL configuration
sed -i "s/#shared_buffers = .*/shared_buffers = ${SHARED_BUFFERS}MB/" ${PG_CONF}
sed -i "s/#work_mem = .*/work_mem = 8MB/" ${PG_CONF}
sed -i "s/#maintenance_work_mem = .*/maintenance_work_mem = 128MB/" ${PG_CONF}
sed -i "s/#effective_cache_size = .*/effective_cache_size = $((MEMORY_MB / 2))MB/" ${PG_CONF}
sed -i "s/#max_connections = .*/max_connections = 100/" ${PG_CONF}
sed -i "s/#wal_buffers = .*/wal_buffers = 16MB/" ${PG_CONF}
sed -i "s/#synchronous_commit = .*/synchronous_commit = off/" ${PG_CONF}
sed -i "s/#checkpoint_timeout = .*/checkpoint_timeout = 10min/" ${PG_CONF}
sed -i "s/#random_page_cost = .*/random_page_cost = 1.1/" ${PG_CONF}

# Restart PostgreSQL to apply changes
systemctl restart postgresql

# --- Install and configure Nginx ---
log "Installing Nginx..."
apt-get install -y nginx

# --- Set up Firewall ---
log "Configuring firewall..."
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
# Allow PostgreSQL only from localhost
# ufw allow from 127.0.0.1 to any port 5432
# Enable firewall
echo "y" | ufw enable

# --- Install and configure Certbot for Let's Encrypt SSL ---
log "Installing Certbot for SSL..."
snap install core
snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

# --- Create application user ---
log "Creating application user..."
useradd -m -d /home/${APP_USER} -s /bin/bash ${APP_USER}
mkdir -p /var/www/${APP_NAME}
chown -R ${APP_USER}:${APP_USER} /var/www/${APP_NAME}

# --- Set up automatic security updates ---
log "Setting up automatic security updates..."
apt-get install -y unattended-upgrades apt-listchanges
cat > /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}";
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
Unattended-Upgrade::Package-Blacklist {
};
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

# --- Setup fail2ban ---
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 86400
findtime = 3600
maxretry = 5

[sshd]
enabled = true
EOF

systemctl restart fail2ban

# --- Set up log rotation ---
log "Setting up log rotation..."
cat > /etc/logrotate.d/${APP_NAME} << EOF
/var/www/${APP_NAME}/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ${APP_USER} ${APP_USER}
    sharedscripts
    postrotate
        [ -s /var/www/${APP_NAME}/logs/pm2.pid ] && kill -USR1 \`cat /var/www/${APP_NAME}/logs/pm2.pid\`
    endscript
}
EOF

mkdir -p /var/www/${APP_NAME}/logs
chown -R ${APP_USER}:${APP_USER} /var/www/${APP_NAME}/logs

# --- Setup PM2 for Node.js process management ---
log "Setting up PM2..."
env PATH=$PATH:/usr/bin pm2 startup systemd -u ${APP_USER} --hp /home/${APP_USER}
systemctl enable pm2-${APP_USER}

# --- Create Nginx configuration ---
log "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/${APP_NAME} << EOF
# Rate limiting zone
limit_req_zone \$binary_remote_addr zone=app_limit:10m rate=20r/s;

# Proxy cache setup
proxy_cache_path /var/cache/nginx/${APP_NAME} levels=1:2 keys_zone=${APP_NAME}_cache:10m inactive=60m max_size=500m;

# Upstream server definition
upstream ${APP_NAME}_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    # SSL configuration will be added by Certbot

    # Logs
    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log /var/log/nginx/${APP_NAME}_error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self';";
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Assets cache
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root /var/www/${APP_NAME}/public;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
        try_files \$uri @proxy;
    }

    # Next.js static files
    location /_next/static/ {
        alias /var/www/${APP_NAME}/.next/static/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
    }

    # Rate limiting for API routes
    location /api/ {
        limit_req zone=app_limit burst=10 nodelay;
        proxy_pass http://${APP_NAME}_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Proxy everything else to Next.js
    location / {
        proxy_pass http://${APP_NAME}_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache ${APP_NAME}_cache;
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_bypass \$http_upgrade;
    }

    # Error pages
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }

    # Deny access to .git, .env, etc.
    location ~ /\.(?!well-known) {
        deny all;
    }
}
EOF

# Enable site configuration
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/${APP_NAME}
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t || error "Nginx configuration test failed"

# Reload Nginx
systemctl reload nginx

# --- Output summary ---
log "Server setup completed successfully!"
log "Configuration summary:"
log "- Application: ${APP_NAME}"
log "- Domain: ${DOMAIN}"
log "- Node.js version: ${NODE_VERSION}"
log "- PostgreSQL version: ${POSTGRES_VERSION}"
log "- Database name: ${DB_NAME}"
log "- Database user: ${DB_USER}"
log "- Database password: ${DB_PASSWORD}"
log ""
log "Next steps:"
log "1. Set up DNS records for ${DOMAIN} pointing to this server"
log "2. Run: certbot --nginx -d ${DOMAIN} to configure SSL"
log "3. Deploy your application code to /var/www/${APP_NAME}"
log "4. Configure environment variables in the deployment script"
log "5. Run the deployment script"
log ""
log "Database connection string for your .env file:"
log "DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"
log ""
log "All configuration details have been saved to /root/app-setup/${APP_NAME}_config.txt"