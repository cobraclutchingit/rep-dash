# Rep Dashboard - Monitoring and Maintenance System

This directory contains the complete monitoring and maintenance system for the Rep Dashboard application. It includes error tracking, performance monitoring, server monitoring, alerting, backup/recovery, and regular maintenance processes.

## 📋 Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Setup Instructions](#setup-instructions)
- [Monitoring Components](#monitoring-components)
- [Maintenance Processes](#maintenance-processes)
- [Backup and Recovery](#backup-and-recovery)
- [Alerting System](#alerting-system)
- [Dashboards](#dashboards)

## 🔍 Overview

The monitoring and maintenance system provides comprehensive observability and upkeep for the Rep Dashboard application. It covers:

1. **Application Monitoring**: Error tracking, performance metrics, and user behavior analytics
2. **Server Monitoring**: Resource usage, logs, uptime, and database performance
3. **Alerting**: Notifications for critical issues and performance problems
4. **Backup/Recovery**: Regular backups and disaster recovery procedures
5. **Maintenance**: Scheduled maintenance tasks for optimal performance

## 📂 Directory Structure

```
/var/www/rep-dash/monitoring/
├── sentry-setup.js              # Application error tracking
├── sentry.server.config.js      # Server-side error tracking
├── analytics-setup.js           # User behavior analytics
├── performance-monitoring.js    # Web Vitals and custom performance tracking
├── prometheus/                  # Prometheus configuration
│   ├── prometheus.yml
│   └── rules/                   # Alert rules
│       ├── app_rules.yml
│       ├── node_rules.yml
│       ├── postgres_rules.yml
│       └── nginx_rules.yml
├── alertmanager/                # AlertManager configuration
│   └── alertmanager.yml
├── backup/                      # Backup scripts and procedures
│   ├── backup-config.sh
│   ├── database-backup.sh
│   ├── application-backup.sh
│   ├── backup-verify.sh
│   └── disaster-recovery-plan.md
├── maintenance/                 # Maintenance scripts
│   ├── database-maintenance.sh
│   ├── app-maintenance.sh
│   ├── security-audit.sh
│   └── maintenance-schedule.md
└── README.md                    # This file
```

## 🚀 Setup Instructions

### 1. Application Monitoring Setup

#### Error Tracking with Sentry

1. Create a Sentry account and project at https://sentry.io/
2. Copy your DSN to environment variables:

```bash
# In your .env file
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
SENTRY_DSN=https://your-sentry-dsn
```

3. Integrate Sentry in your Next.js application:

```bash
# Install dependencies
npm install @sentry/nextjs

# Configure Sentry
npx @sentry/wizard@latest -i nextjs
```

4. Copy the Sentry setup files to your project:

```bash
cp /var/www/rep-dash/monitoring/sentry-setup.js /var/www/rep-dash/lib/
cp /var/www/rep-dash/monitoring/sentry.server.config.js /var/www/rep-dash/lib/
```

5. Import and initialize in your application:

```js
// In _app.tsx or equivalent
import initSentry from '@/lib/sentry-setup';
initSentry();
```

#### Performance Monitoring with Web Vitals

1. Copy the performance monitoring file:

```bash
cp /var/www/rep-dash/monitoring/performance-monitoring.js /var/www/rep-dash/lib/
```

2. Set up environment variables:

```bash
# In your .env file
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

3. Import and initialize in your application:

```js
// In _app.tsx or equivalent
import { useWebVitals, initPerformanceMonitoring } from '@/lib/performance-monitoring';

// Initialize in component
useEffect(() => {
  initPerformanceMonitoring();
}, []);

// Use hook to track Web Vitals
useWebVitals();
```

#### User Behavior Analytics with PostHog

1. Create a PostHog account at https://posthog.com/
2. Copy your API key to environment variables:

```bash
# In your .env file
NEXT_PUBLIC_POSTHOG_API_KEY=your-api-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

3. Copy the analytics setup file:

```bash
cp /var/www/rep-dash/monitoring/analytics-setup.js /var/www/rep-dash/lib/
```

4. Import and initialize in your application:

```js
// In _app.tsx or equivalent
import { initAnalytics, usePageViewTracking } from '@/lib/analytics-setup';

// Initialize in component
useEffect(() => {
  initAnalytics();
}, []);

// Track page views
usePageViewTracking();

// Track authenticated user
useEffect(() => {
  if (session?.user) {
    identifyUser(session.user);
  }
}, [session]);
```

### 2. Server Monitoring Setup

#### Prometheus and Grafana

1. Install Prometheus:

```bash
sudo apt update
sudo apt install -y prometheus prometheus-alertmanager
```

2. Copy Prometheus configuration:

```bash
sudo cp /var/www/rep-dash/monitoring/prometheus/prometheus.yml /etc/prometheus/
sudo cp -r /var/www/rep-dash/monitoring/prometheus/rules /etc/prometheus/
```

3. Install AlertManager:

```bash
sudo apt install -y prometheus-alertmanager
```

4. Copy AlertManager configuration:

```bash
sudo cp /var/www/rep-dash/monitoring/alertmanager/alertmanager.yml /etc/alertmanager/
```

5. Install Grafana:

```bash
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y grafana
```

6. Start services:

```bash
sudo systemctl enable prometheus
sudo systemctl start prometheus
sudo systemctl enable prometheus-alertmanager
sudo systemctl start prometheus-alertmanager
sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

7. Install exporters:

```bash
# Node exporter
sudo apt install -y prometheus-node-exporter

# PostgreSQL exporter
sudo apt install -y prometheus-postgres-exporter

# NGINX exporter
sudo apt install -y prometheus-nginx-exporter
```

### 3. Metrics API Endpoint

1. Copy the metrics API endpoint:

```bash
mkdir -p /var/www/rep-dash/app/api/metrics
cp /var/www/rep-dash/monitoring/api/metrics/route.ts /var/www/rep-dash/app/api/metrics/
```

2. Install required dependencies:

```bash
npm install prom-client
```

### 4. Backup System Setup

1. Create necessary directories:

```bash
sudo mkdir -p /var/backups/rep-dash/{database,files,logs}
sudo chown -R node-app:node-app /var/backups/rep-dash
```

2. Set up environment variables:

```bash
# Example for AWS S3 backups
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
```

3. Set up cron jobs:

```bash
# Add database backup daily at midnight
0 0 * * * /var/www/rep-dash/monitoring/backup/database-backup.sh > /var/log/rep-dash/db-backup.log 2>&1

# Add application backup daily at 1 AM
0 1 * * * /var/www/rep-dash/monitoring/backup/application-backup.sh > /var/log/rep-dash/app-backup.log 2>&1

# Add backup verification weekly on Mondays at 4 AM
0 4 * * 1 /var/www/rep-dash/monitoring/backup/backup-verify.sh > /var/log/rep-dash/backup-verify.log 2>&1
```

### 5. Maintenance System Setup

1. Set up maintenance cron jobs:

```bash
# Database maintenance weekly on Sundays at 2 AM
0 2 * * 0 /var/www/rep-dash/monitoring/maintenance/database-maintenance.sh > /var/log/rep-dash/db-maintenance.log 2>&1

# Application maintenance weekly on Saturdays at 1 AM
0 1 * * 6 /var/www/rep-dash/monitoring/maintenance/app-maintenance.sh > /var/log/rep-dash/app-maintenance.log 2>&1

# Security audit monthly on the 1st at 3 AM
0 3 1 * * /var/www/rep-dash/monitoring/maintenance/security-audit.sh > /var/log/rep-dash/security-audit.log 2>&1
```

## 📊 Monitoring Components

### Application Monitoring

- **Error Tracking**: Sentry tracks application errors, exceptions, and crashes
- **Performance Monitoring**: Web Vitals and custom performance metrics
- **User Behavior Analytics**: PostHog tracks user interactions and events
- **Custom Event Tracking**: Business-specific events tracked for analytics

### Server Monitoring

- **Resource Monitoring**: CPU, memory, disk, and network usage
- **Log Aggregation**: Centralized logging and analysis
- **Uptime Monitoring**: Blackbox exporter for endpoint availability
- **Database Monitoring**: PostgreSQL metrics and query performance

## 🔧 Maintenance Processes

See [Maintenance Schedule](./maintenance/maintenance-schedule.md) for a detailed overview of all maintenance tasks, frequencies, and procedures.

### Regular Tasks

- **Database Optimization**: VACUUM, ANALYZE, REINDEX operations
- **Application Maintenance**: Cache cleanup, memory leak checks
- **Security Auditing**: Regular security scans and updates
- **Dependency Updates**: Keeping libraries and frameworks updated
- **Performance Tuning**: Database query optimization, code profiling

## 💾 Backup and Recovery

See [Disaster Recovery Plan](./backup/disaster-recovery-plan.md) for detailed backup and recovery procedures.

### Backup Strategy

- **Database Backups**: Daily full backups with WAL archiving
- **Application State Backups**: Daily application file backups
- **Configuration Backups**: Nginx, PM2, and environment variables
- **Backup Verification**: Weekly test restores to ensure integrity
- **Remote Storage**: S3 or other cloud storage for off-site backups

## 🚨 Alerting System

### Alert Channels

- **Email Alerts**: For non-urgent issues
- **Slack Notifications**: For team-wide awareness
- **PagerDuty**: For critical issues requiring immediate attention

### Alert Rules

- **System Alerts**: CPU, memory, disk space, etc.
- **Application Alerts**: Error rates, response times, etc.
- **Database Alerts**: Connection pools, query times, etc.
- **Security Alerts**: Failed logins, unexpected access patterns

## 📈 Dashboards

### Grafana Dashboards

1. **System Overview**: CPU, memory, disk, network metrics
2. **Application Performance**: Response times, error rates, request counts
3. **Database Performance**: Query times, connection counts, table sizes
4. **User Activity**: Active users, page views, business metrics

### How to Access

- Grafana: http://localhost:3000 (default credentials: admin/admin)
- Prometheus: http://localhost:9090
- AlertManager: http://localhost:9093

## 📝 Documentation

- [Maintenance Schedule](./maintenance/maintenance-schedule.md)
- [Disaster Recovery Plan](./backup/disaster-recovery-plan.md)
- [Security Audit Procedures](./maintenance/security-audit.sh)

## 🔍 Further Information

For more information, refer to the individual component documentation or contact the DevOps team.