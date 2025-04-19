#!/bin/bash

# Rep Dashboard - Production Setup Script
# This script sets up the complete production environment for the Rep Dashboard application on Ubuntu

# Exit on error
set -e

# --- Color output for better readability ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Configuration variables (customize these) ---
APP_NAME="rep-dash"
APP_DIR="/var/www/${APP_NAME}"
DOMAIN="go.svrnpro.com"
DB_NAME="salesapp"
DB_USER="salesappuser"
DB_PASSWORD="your_secure_password" # Change this to a secure password

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
  error "This script must be run as root (sudo)."
fi

# --- Start setup ---
log "Starting production setup for ${APP_NAME} on ${DOMAIN}..."

# --- 1. Database Setup ---
log "Setting up PostgreSQL database..."

# Create user and database
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';" || log "User ${DB_USER} may already exist"
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} WITH OWNER ${DB_USER};" || log "Database ${DB_NAME} may already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

log "Database setup completed!"

# --- 2. Nginx Configuration ---
log "Setting up Nginx..."

# Create Nginx configuration
cat > /etc/nginx/sites-available/${APP_NAME} << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Application proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Rate limiting for API routes
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

# Rate limiting configuration at the server level
limit_req_zone \$binary_remote_addr zone=api:10m rate=5r/s;
EOF

# Create the rate limiting configuration
if ! grep -q "limit_req_zone" /etc/nginx/nginx.conf; then
    # Add rate limiting configuration to http block
    sed -i '/http {/a \    # Rate limiting configuration\n    limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;' /etc/nginx/nginx.conf
fi

# Enable the site
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/

# Remove default site if it exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm -f /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

log "Nginx configuration completed!"

# --- 3. Environment Setup ---
log "Setting up environment variables..."

# Create .env file
cat > ${APP_DIR}/.env << EOF
# Database
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

# NextAuth
NEXTAUTH_SECRET="G0BeWs2NxnLN5TrFK4fDut7cvthd1/otzJDCY5zi/qo="
NEXTAUTH_URL="http://${DOMAIN}"

# App Config
NODE_ENV="production"

# App Version
NEXT_PUBLIC_APP_VERSION="1.0.0"
EOF

# Set proper permissions
chown -R www-data:www-data ${APP_DIR}

log "Environment setup completed!"

# --- 4. Application Setup ---
log "Setting up the application..."

# Navigate to application directory
cd ${APP_DIR}

# Generate Prisma client
log "Generating Prisma client..."
npx prisma generate

# Run database migrations
log "Running database migrations..."
npx prisma migrate deploy

# Build the Next.js application
log "Building the application..."
npm run build

log "Application setup completed!"

# --- 5. Process Management ---
log "Setting up PM2 process manager..."

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Delete existing process if it exists
pm2 delete ${APP_NAME} 2>/dev/null || true

# Start the application with PM2
pm2 start npm --name ${APP_NAME} -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup | grep -v "sudo env PATH" | grep -v '\[PM2\]' | tail -n 1 | bash

log "PM2 setup completed!"

# --- 6. Seed Database (Optional) ---
log "Would you like to seed the database with initial data? (y/n)"
read -p "Seed database? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Seeding database..."
    cd ${APP_DIR}
    npx prisma db seed
    log "Database seeding completed!"
fi

# --- 7. SSL Setup (Optional) ---
log "Would you like to set up SSL with Let's Encrypt? (y/n)"
read -p "Setup SSL? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Setting up SSL with Let's Encrypt..."
    
    # Install Certbot if not already installed
    if ! command -v certbot &> /dev/null; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Obtain and install SSL certificate
    certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}
    
    # Update NEXTAUTH_URL to use HTTPS
    sed -i "s|http://${DOMAIN}|https://${DOMAIN}|" ${APP_DIR}/.env
    
    log "SSL setup completed!"
fi

# --- Summary ---
log "==========================================================="
log "Rep Dashboard Production Setup Complete!"
log "==========================================================="
log "Application URL: http://${DOMAIN}"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Secure URL: https://${DOMAIN}"
fi
log "Database: ${DB_NAME}"
log "Database User: ${DB_USER}"
log ""
log "Next steps:"
log "1. Access your application at http://${DOMAIN} (or https://${DOMAIN} if SSL is enabled)"
log "2. Complete initial setup and test all features"
log "3. Set up regular backups (see /var/www/rep-dash/monitoring/backup)"
log "4. Configure monitoring (see /var/www/rep-dash/monitoring)"
log "==========================================================="