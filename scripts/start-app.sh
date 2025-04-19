#!/bin/bash

# Start the Next.js application without database requirements
# This script is useful for testing the UI without a real database

# Exit on error
set -e

echo "Starting Rep Dashboard without database migration..."

# Directory setup
APP_DIR="/var/www/rep-dash"
cd $APP_DIR

# Update .env file for testing
cat > $APP_DIR/.env << EOL
# Database (using a fake URL since we'll mock the database)
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres?schema=public"

# NextAuth
NEXTAUTH_SECRET="G0BeWs2NxnLN5TrFK4fDut7cvthd1/otzJDCY5zi/qo="
NEXTAUTH_URL="http://go.svrnpro.com"

# App Config
NODE_ENV="development"

# App Version
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Mock mode for testing
NEXT_PUBLIC_MOCK_API=true
EOL

# Create Nginx configuration (without requiring sudo)
cat > $APP_DIR/nginx.conf << EOL
server {
    listen 80;
    server_name go.svrnpro.com;

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

echo "Configuration created at $APP_DIR/nginx.conf"
echo "You'll need to manually apply this configuration to Nginx"

# Start the development server with API mocking
echo "Starting Next.js development server..."
npm run dev