# Rep Dashboard Production Deployment Guide

This guide provides detailed instructions for deploying the Rep Dashboard application to a production environment on Ubuntu 24.04. Follow these steps in order to set up a secure, optimized, and maintainable production system.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Overview](#deployment-overview)
- [Server Setup](#server-setup)
- [Database Configuration](#database-configuration)
- [SSL Configuration](#ssl-configuration)
- [Application Deployment](#application-deployment)
- [Monitoring and Performance](#monitoring-and-performance)
- [Backup and Recovery](#backup-and-recovery)
- [Maintenance Tasks](#maintenance-tasks)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## 🔍 Prerequisites

Before starting the deployment process, ensure you have:

- A server running Ubuntu 24.04 LTS
- A domain name pointed to your server's IP address
- SSH access to the server with sudo privileges
- Your application code in a Git repository
- Basic understanding of Linux, Nginx, Node.js, and PostgreSQL

## 🚀 Deployment Overview

The deployment process consists of these main steps:

1. Server setup: Configure the base Ubuntu server with necessary packages
2. Database setup: Install and configure PostgreSQL
3. SSL setup: Configure HTTPS with Let's Encrypt
4. Application deployment: Deploy the application with zero-downtime updates
5. Monitoring setup: Configure performance monitoring and logging

## 🖥️ Server Setup

The `server_setup.sh` script automates server provisioning. It includes:

- System updates and timezone configuration
- Node.js 20.x installation
- PostgreSQL 16 installation and configuration
- Nginx installation and configuration
- User and directory setup
- Security enhancements (firewall, fail2ban)

### Usage:

```bash
# First, review and customize the script variables
nano deployment/server_setup.sh

# Then run the script
sudo bash deployment/server_setup.sh
```

After running the script, verify the installation:

```bash
# Check Node.js installation
node -v
npm -v

# Check PostgreSQL installation
sudo systemctl status postgresql

# Check Nginx installation
sudo systemctl status nginx
```

## 🗃️ Database Configuration

The PostgreSQL database is configured by the server setup script, but you can further optimize it with the `postgres_optimize.sh` script.

### Performance Optimization:

```bash
# Review and customize the script
nano deployment/postgres_optimize.sh

# Run the optimization script
sudo bash deployment/postgres_optimize.sh
```

This script optimizes PostgreSQL for:

- Memory usage based on server resources
- Query performance with custom indexes
- Automated maintenance functions
- Regular maintenance via cron jobs

### Key Database Details:

- Database name: `rep_dash_prod`
- Default user: `rep_dash_user`
- Password: Generated during setup (check `/root/app-setup/rep-dash_config.txt`)
- Connection string format: `postgresql://rep_dash_user:password@localhost:5432/rep_dash_prod?schema=public`

## 🔒 SSL Configuration

Secure your application with HTTPS using Let's Encrypt:

```bash
# Review and customize the script
nano deployment/ssl_setup.sh

# Run the SSL setup script
sudo bash deployment/ssl_setup.sh
```

The script will:

1. Verify your domain's DNS configuration
2. Install Certbot for Let's Encrypt
3. Configure strong SSL parameters
4. Obtain and install SSL certificates
5. Set up automatic renewal

## 📦 Application Deployment

Deploy the application with zero-downtime using the `deploy.sh` script:

### First Deployment:

```bash
# Review and customize the script
nano deployment/deploy.sh

# Create the environment variables file
cp deployment/env.example /var/www/rep-dash/shared/.env
nano /var/www/rep-dash/shared/.env

# Run the deployment script
sudo -u node-app bash deployment/deploy.sh
```

### Updates and Rollbacks:

For subsequent deployments (zero-downtime):

```bash
sudo -u node-app bash deployment/deploy.sh
```

If you need to rollback to a previous version:

```bash
sudo -u node-app /var/www/rep-dash/rollback.sh /var/www/rep-dash/releases/YYYYMMDDHHMMSS
```

### Deployment Structure:

- `/var/www/rep-dash/current` → Symlink to the current release
- `/var/www/rep-dash/releases/` → Directory containing all releases
- `/var/www/rep-dash/shared/` → Shared files across releases (.env, node_modules, etc.)
- `/var/www/rep-dash/logs/` → Application logs

## 📊 Monitoring and Performance

Set up monitoring and performance tools:

```bash
# Review and customize the script
nano deployment/monitoring.sh

# Run the monitoring setup script
sudo bash deployment/monitoring.sh
```

This script sets up:

- Prometheus for metrics collection
- Node Exporter for system metrics
- PM2 for process management and logs
- Basic performance optimization for Node.js
- Database query optimization

### Accessing Monitoring Tools:

- PM2 dashboard: `pm2 monit`
- Prometheus: `https://prometheus.your-domain.com` (if configured)
- System status: `/var/www/rep-dash/check_status.sh`

## 💾 Backup and Recovery

Regular backups are essential for production systems:

```bash
# Review and customize the script
nano deployment/backup.sh

# Run a backup manually
sudo bash deployment/backup.sh

# Add to crontab for scheduled backups
sudo crontab -e
# Add: 0 2 * * * /var/www/rep-dash/deployment/backup.sh > /var/log/backup.log 2>&1
```

The backup script creates:

- PostgreSQL database dumps
- Application file backups
- Automatic cleanup of old backups
- Optional S3 backup uploads
- Restore scripts for each backup

### Restoring from Backup:

To restore from a backup:

```bash
sudo bash /var/backups/rep-dash/restore_TIMESTAMP.sh
```

## 🧹 Maintenance Tasks

Regular maintenance tasks to keep your system healthy:

### Database Maintenance:

```bash
# Run database optimization
sudo /usr/local/bin/db_maintenance.sh
```

### Log Rotation:

Logs are automatically rotated using logrotate. Configuration is in:
`/etc/logrotate.d/rep-dash`

### Node.js Cleanup:

```bash
# Clean up PM2 logs
pm2 flush

# Check Node.js processes
pm2 list
```

### System Updates:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y
```

## 🔧 Troubleshooting

Common issues and their solutions:

### Application Won't Start:

1. Check PM2 logs: `pm2 logs rep-dash`
2. Verify environment variables: `cat /var/www/rep-dash/shared/.env`
3. Check for file permission issues: `ls -la /var/www/rep-dash/current`

### Database Connection Issues:

1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify database credentials: `sudo -u postgres psql -c "\l"`
3. Test connection: `psql -U rep_dash_user -h localhost -d rep_dash_prod`

### SSL Certificate Issues:

1. Check certificate status: `certbot certificates`
2. Test SSL configuration: `openssl s_client -connect your-domain.com:443`
3. Manual renewal: `sudo certbot renew --force-renewal`

## 🔐 Security Considerations

Additional security measures to consider:

### Regular Security Updates:

```bash
# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Database Security:

- Keep PostgreSQL accessible only from localhost
- Use strong passwords and limit user privileges
- Regularly audit database access logs

### Application Security:

- Keep dependencies updated: `npm audit fix`
- Implement proper input validation and output encoding
- Use environment variables for all sensitive configuration
- Configure proper Content Security Policy

### Server Hardening:

- Use SSH key authentication instead of passwords
- Change default SSH port
- Implement IP-based access restrictions where applicable
- Configure intrusion detection with fail2ban

## 📝 Additional Notes

- All configuration is documented in `/root/app-setup/rep-dash_config.txt`
- Database credentials are securely stored in this file
- Backup scripts create self-contained restore scripts
- Deployment supports rollback to previous versions

## 🆘 Support

For issues with this deployment configuration, contact your system administrator.

---

This deployment guide and associated scripts were created specifically for the Rep Dashboard application. Customize as needed for your specific requirements.