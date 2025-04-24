# Rep Dashboard - Disaster Recovery Plan

This document outlines the complete disaster recovery procedures for the Rep Dashboard application.

## Overview

This disaster recovery plan provides a structured approach for recovering the Rep Dashboard application in the event of a catastrophic failure or data loss. It covers both partial recovery scenarios (such as restoring specific data) and full system recovery.

## Recovery Team Contacts

| Role                   | Name   | Contact       | Responsibility                    |
| ---------------------- | ------ | ------------- | --------------------------------- |
| System Administrator   | [Name] | [Email/Phone] | Server infrastructure, Deployment |
| Database Administrator | [Name] | [Email/Phone] | Database recovery, Data integrity |
| Lead Developer         | [Name] | [Email/Phone] | Application code, Configuration   |
| DevOps Engineer        | [Name] | [Email/Phone] | CI/CD, Monitoring, Automation     |
| Security Officer       | [Name] | [Email/Phone] | Security audits, Access control   |

## Recovery Time Objectives (RTO)

| System Component | Recovery Time Objective |
| ---------------- | ----------------------- |
| Website frontend | 1 hour                  |
| API services     | 2 hours                 |
| Database         | 4 hours                 |
| Complete system  | 8 hours                 |

## Recovery Point Objectives (RPO)

| Data Type            | Recovery Point Objective |
| -------------------- | ------------------------ |
| User data            | 24 hours                 |
| System configuration | 24 hours                 |
| Logs and analytics   | 72 hours                 |

## Required Resources

- Backup server access credentials
- Cloud provider (AWS/Azure/GCP) access credentials
- Domain registrar access
- SSL certificate private keys
- Database administrator credentials
- Server SSH keys
- Environment configuration files (.env)

## Backup Location

The backups are stored in multiple locations:

1. Local server backups: `/var/backups/rep-dash/`
2. Remote backups: AWS S3 bucket `rep-dash-backups`
3. Off-site physical backup (if applicable): [Location information]

## Recovery Procedures

### 1. Database Recovery

#### 1.1. Full Database Restore

```bash
# 1. Log in to the database server
ssh user@database-server

# 2. Stop the application to prevent writes
sudo systemctl stop rep-dash

# 3. Navigate to the backup directory
cd /var/backups/rep-dash/database

# 4. Find the most recent backup or use latest symlink
BACKUP_FILE=/var/backups/rep-dash/database/latest.sql.gz

# 5. If the backup is encrypted, decrypt it
gpg --decrypt $BACKUP_FILE > /tmp/database_backup.sql.gz

# 6. Drop and recreate the database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS rep_dash_prod;"
sudo -u postgres psql -c "CREATE DATABASE rep_dash_prod OWNER rep_dash_user;"

# 7. Restore the database
gunzip -c /tmp/database_backup.sql.gz | sudo -u postgres psql rep_dash_prod

# 8. Verify the restoration
sudo -u postgres psql -c "SELECT count(*) FROM users;" rep_dash_prod

# 9. Restart the application
sudo systemctl start rep-dash

# 10. Clean up temporary files
rm /tmp/database_backup.sql.gz
```

#### 1.2. Partial Data Recovery

```bash
# Example: Restore specific table(s)
# 1. Create a temporary database
sudo -u postgres psql -c "CREATE DATABASE temp_restore;"

# 2. Restore backup to temporary database
gunzip -c /tmp/database_backup.sql.gz | sudo -u postgres psql temp_restore

# 3. Copy specific data
sudo -u postgres psql -c "INSERT INTO rep_dash_prod.users SELECT * FROM temp_restore.users WHERE id='specific-id';" rep_dash_prod

# 4. Drop temporary database
sudo -u postgres psql -c "DROP DATABASE temp_restore;"
```

### 2. Application Recovery

#### 2.1. Full Application Restore

```bash
# 1. Log in to the application server
ssh user@app-server

# 2. Stop the current application
sudo systemctl stop rep-dash

# 3. Navigate to the backup directory
cd /var/backups/rep-dash/files

# 4. Find the most recent backup or use latest symlink
BACKUP_FILE=/var/backups/rep-dash/files/latest.tar.gz

# 5. If the backup is encrypted, decrypt it
gpg --decrypt $BACKUP_FILE > /tmp/app_backup.tar.gz

# 6. Create a clean directory
sudo rm -rf /var/www/rep-dash.old
sudo mv /var/www/rep-dash /var/www/rep-dash.old
sudo mkdir -p /var/www/rep-dash

# 7. Extract the backup
sudo tar -xzf /tmp/app_backup.tar.gz -C /var/www

# 8. Restore configuration files
sudo cp /var/backups/rep-dash/env_latest.txt /var/www/rep-dash/shared/.env

# 9. Set proper ownership
sudo chown -R node-app:node-app /var/www/rep-dash

# 10. Install dependencies
cd /var/www/rep-dash/current
sudo -u node-app npm install --production

# 11. Apply database migrations
sudo -u node-app npx prisma migrate deploy

# 12. Restart the application
sudo systemctl start rep-dash

# 13. Clean up temporary files
rm /tmp/app_backup.tar.gz
```

#### 2.2. Configuration-Only Recovery

```bash
# Restore only environment variables and configuration
sudo cp /var/backups/rep-dash/env_latest.txt /var/www/rep-dash/shared/.env
sudo cp /var/backups/rep-dash/nginx_latest.conf /etc/nginx/sites-available/rep-dash
sudo cp /var/backups/rep-dash/pm2_latest.js /var/www/rep-dash/ecosystem.config.js

# Reload configuration
sudo systemctl reload nginx
sudo -u node-app pm2 reload ecosystem.config.js
```

### 3. Full System Recovery

For a complete server rebuild, follow these steps:

```bash
# 1. Provision a new server
# Follow infrastructure-as-code scripts in /var/www/rep-dash/deployment

# 2. Install required packages
sudo apt update && sudo apt upgrade -y
sudo bash /var/www/rep-dash/deployment/server_setup.sh

# 3. Restore application
# Follow the Application Recovery steps above

# 4. Restore database
# Follow the Database Recovery steps above

# 5. Verify system integrity
sudo bash /var/www/rep-dash/monitoring/verify-system.sh

# 6. Update DNS if server IP has changed
# Log in to domain registrar and update A records
```

## Post-Recovery Tasks

1. **Verify System Functionality**

   ```bash
   # Run system validation tests
   npm run test:e2e
   ```

2. **Check Monitoring and Alerts**

   ```bash
   # Ensure all monitoring is operational
   systemctl status prometheus alertmanager node_exporter
   ```

3. **Perform Security Audit**

   ```bash
   # Run security checks
   sudo bash /var/www/rep-dash/monitoring/security-audit.sh
   ```

4. **Update Documentation**

   - Record details of the recovery process
   - Update this document with any lessons learned

5. **Notify Stakeholders**
   - Inform all relevant parties that recovery is complete
   - Provide summary of any data loss or remaining issues

## Testing Schedule

This disaster recovery plan should be tested on the following schedule:

| Test Type            | Frequency   | Last Tested | Next Test Due |
| -------------------- | ----------- | ----------- | ------------- |
| Database restore     | Monthly     | [Date]      | [Date]        |
| Application restore  | Quarterly   | [Date]      | [Date]        |
| Full system recovery | Bi-annually | [Date]      | [Date]        |

## Document History

| Version | Date   | Author | Changes                              |
| ------- | ------ | ------ | ------------------------------------ |
| 1.0     | [Date] | [Name] | Initial version                      |
| 1.1     | [Date] | [Name] | Updated backup encryption procedures |
