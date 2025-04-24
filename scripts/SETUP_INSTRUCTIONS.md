# Rep Dashboard Production Setup Instructions

This document provides step-by-step instructions for setting up the Rep Dashboard application in a production environment on Ubuntu.

## Prerequisites

- Ubuntu 24.04 server (should also work on Ubuntu 20.04/22.04)
- Domain name pointing to your server (e.g., go.svrnpro.com)
- Sudo access

## Quick Setup (Automated)

For automated setup, use the provided setup script:

```bash
# Make the script executable
chmod +x /var/www/rep-dash/scripts/production-setup.sh

# Run the script with sudo
sudo /var/www/rep-dash/scripts/production-setup.sh
```

The script will guide you through the setup process and prompt for optional steps like database seeding and SSL configuration.

## Manual Setup

If you prefer to set up the application manually or need to customize specific components, follow these steps:

### 1. Database Setup

Create PostgreSQL user and database:

```bash
# Create user and database
sudo -u postgres psql -c "CREATE USER salesappuser WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE salesapp WITH OWNER salesappuser;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE salesapp TO salesappuser;"
```

### 2. Nginx Configuration

Create and enable Nginx configuration:

```bash
# Create configuration file
sudo tee /etc/nginx/sites-available/rep-dash << EOF
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
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/rep-dash /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default  # Remove default site if needed
sudo systemctl reload nginx
```

### 3. Environment Configuration

Set up environment variables:

```bash
# Create or update .env file
cat > /var/www/rep-dash/.env << EOF
# Database
DATABASE_URL="postgresql://salesappuser:your_secure_password@localhost:5432/salesapp?schema=public"

# NextAuth
NEXTAUTH_SECRET="G0BeWs2NxnLN5TrFK4fDut7cvthd1/otzJDCY5zi/qo="
NEXTAUTH_URL="http://go.svrnpro.com"

# App Config
NODE_ENV="production"

# App Version
NEXT_PUBLIC_APP_VERSION="1.0.0"
EOF
```

### 4. Database Migrations

Generate Prisma client and run migrations:

```bash
# Navigate to app directory
cd /var/www/rep-dash

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: Seed the database
npx prisma db seed
```

### 5. Build and Start the Application

Build and start the Next.js application:

```bash
# Build the application
cd /var/www/rep-dash
npm run build

# Install PM2 globally if not already installed
sudo npm install -g pm2

# Start the application with PM2
pm2 delete rep-dash 2>/dev/null || true
pm2 start npm --name rep-dash -- start

# Save PM2 configuration and set up auto-restart
pm2 save
pm2 startup
```

### 6. SSL Configuration (Optional)

Set up SSL with Let's Encrypt:

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain and install SSL certificate
sudo certbot --nginx -d go.svrnpro.com

# Update NEXTAUTH_URL to use HTTPS
sudo sed -i 's|http://go.svrnpro.com|https://go.svrnpro.com|' /var/www/rep-dash/.env

# Restart the application to apply changes
pm2 restart rep-dash
```

## Testing the Application

After setup, verify that everything is working:

1. Open your domain in a web browser (http://go.svrnpro.com or https://go.svrnpro.com)
2. Register a new account
3. Test the various features:
   - Dashboard overview
   - Training modules
   - Calendar functionality
   - Leaderboard
   - Communication features

## Troubleshooting

### Application Won't Start

Check PM2 logs:

```bash
pm2 logs rep-dash
```

### Database Connection Issues

Verify database connection:

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
psql -U salesappuser -h localhost -d salesapp
```

### Nginx Issues

Check Nginx configuration and logs:

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Maintenance

### Updating the Application

To update the application:

```bash
# Pull latest changes
cd /var/www/rep-dash
git pull

# Install dependencies
npm install

# Update database schema if needed
npx prisma migrate deploy

# Rebuild the application
npm run build

# Restart the application
pm2 restart rep-dash
```

### Backup Strategy

See the comprehensive backup scripts in `/var/www/rep-dash/monitoring/backup/`.

### Monitoring

See the monitoring setup in `/var/www/rep-dash/monitoring/` for details on setting up Prometheus, Grafana, and alerting.

## Security Considerations

1. Regularly update your system and dependencies
2. Consider setting up a firewall (UFW)
3. Run regular security audits using the provided script:
   ```bash
   sudo bash /var/www/rep-dash/monitoring/maintenance/security-audit.sh
   ```
4. Ensure proper file permissions

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
