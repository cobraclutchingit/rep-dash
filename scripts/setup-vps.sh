#!/bin/bash

# Rep Dashboard VPS Setup Script
# This script sets up the database and configures Nginx for the Rep Dashboard application

# Exit on error
set -e

echo "Setting up Rep Dashboard on VPS..."

# Database details
DB_NAME="salesapp"
DB_USER="salesappuser"
DB_PASSWORD="your_secure_password"

# Domain details
DOMAIN="go.svrnpro.com"
APP_DIR="/var/www/rep-dash"

# Note: In this environment, we'll skip the database creation
# You'll need to manually create the database:
# 1. sudo -u postgres psql
# 2. CREATE USER salesappuser WITH PASSWORD 'your_secure_password';
# 3. CREATE DATABASE salesapp WITH OWNER salesappuser;
# 4. GRANT ALL PRIVILEGES ON DATABASE salesapp TO salesappuser;
echo "NOTE: Please create the PostgreSQL database manually."
echo "See comments in this script for instructions."

# Update .env file
echo "Updating .env file..."
cat > $APP_DIR/.env << EOL
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"

# NextAuth
NEXTAUTH_SECRET="G0BeWs2NxnLN5TrFK4fDut7cvthd1/otzJDCY5zi/qo="
NEXTAUTH_URL="https://$DOMAIN"

# App Config
NODE_ENV="production"

# App Version
NEXT_PUBLIC_APP_VERSION="1.0.0"
EOL

# Generate Prisma client
echo "Generating Prisma client..."
cd $APP_DIR
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Create Nginx configuration
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/rep-dash << EOL
server {
    listen 80;
    server_name $DOMAIN;

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
}
EOL

# Enable the site
sudo ln -sf /etc/nginx/sites-available/rep-dash /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Build the Next.js application
echo "Building the Next.js application..."
cd $APP_DIR
npm run build

# Setup PM2 for process management
echo "Setting up PM2..."
npm install -g pm2
pm2 delete rep-dash 2>/dev/null || true
pm2 start npm --name rep-dash -- start
pm2 save
pm2 startup | sed "s/\\[PM2\\] Init System found: systemd//" | sed -n '2p' | sudo bash

echo "Setup complete!"
echo "Rep Dashboard should now be accessible at https://$DOMAIN"
echo "If you're using HTTP instead of HTTPS, update the NEXTAUTH_URL in .env accordingly"