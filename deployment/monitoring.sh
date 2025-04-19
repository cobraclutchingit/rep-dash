#!/bin/bash

# Rep Dashboard - Monitoring and Performance Optimization Script
# This script installs and configures monitoring tools for the application

set -e  # Exit on any error

# --- Color output for better readability ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Configuration variables ---
APP_NAME="rep-dash"
APP_DIR="/var/www/${APP_NAME}"
DOMAIN="rep-dashboard.example.com"  # Change to your actual domain
PROMETHEUS_VERSION="2.48.1"
NODE_EXPORTER_VERSION="1.7.0"

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

# --- Install required packages ---
log "Installing required packages..."
apt-get update
apt-get install -y jq htop iotop sysstat net-tools nload vnstat gzip curl wget

# --- Install Node.js monitoring tools ---
log "Installing Node.js monitoring tools..."
npm install -g pm2 pm2-logrotate clinic

# --- Configure pm2 log rotation ---
log "Configuring PM2 log rotation..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:workerInterval 30

# --- Install and configure Prometheus ---
log "Installing Prometheus for monitoring metrics..."
useradd --no-create-home --shell /bin/false prometheus
mkdir -p /etc/prometheus /var/lib/prometheus
chown prometheus:prometheus /etc/prometheus /var/lib/prometheus

cd /tmp
wget https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz
tar -xvf prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz
cd prometheus-${PROMETHEUS_VERSION}.linux-amd64

cp prometheus /usr/local/bin/
cp promtool /usr/local/bin/
chown prometheus:prometheus /usr/local/bin/prometheus
chown prometheus:prometheus /usr/local/bin/promtool

cp -r consoles /etc/prometheus
cp -r console_libraries /etc/prometheus
chown -R prometheus:prometheus /etc/prometheus/consoles
chown -R prometheus:prometheus /etc/prometheus/console_libraries

# --- Configure Prometheus ---
cat > /etc/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'nextjs-app'
    static_configs:
      - targets: ['localhost:3000']
EOF

chown prometheus:prometheus /etc/prometheus/prometheus.yml

# --- Create Prometheus systemd service ---
cat > /etc/systemd/system/prometheus.service << EOF
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
    --config.file /etc/prometheus/prometheus.yml \
    --storage.tsdb.path /var/lib/prometheus/ \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries

[Install]
WantedBy=multi-user.target
EOF

# --- Install and configure Node Exporter ---
log "Installing Node Exporter..."
useradd --no-create-home --shell /bin/false node_exporter
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
tar -xvf node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
cd node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64
cp node_exporter /usr/local/bin/
chown node_exporter:node_exporter /usr/local/bin/node_exporter

# --- Create Node Exporter systemd service ---
cat > /etc/systemd/system/node_exporter.service << EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

# --- Start and enable services ---
log "Starting monitoring services..."
systemctl daemon-reload
systemctl enable prometheus
systemctl enable node_exporter
systemctl start prometheus
systemctl start node_exporter

# --- Configure Nginx for Prometheus (optional) ---
log "Configuring Nginx for Prometheus (with basic auth)..."

# Create password file for basic authentication
apt-get install -y apache2-utils
PROMETHEUS_PASSWORD=$(openssl rand -base64 12)
htpasswd -bc /etc/nginx/.htpasswd admin "${PROMETHEUS_PASSWORD}"

# Create Nginx config for Prometheus
cat > /etc/nginx/sites-available/prometheus << EOF
server {
    listen 80;
    server_name prometheus.${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name prometheus.${DOMAIN};

    # SSL configuration will be added by Certbot

    # Basic authentication
    auth_basic "Prometheus";
    auth_basic_user_file /etc/nginx/.htpasswd;

    # Logs
    access_log /var/log/nginx/prometheus_access.log;
    error_log /var/log/nginx/prometheus_error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    location / {
        proxy_pass http://localhost:9090;
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
ln -sf /etc/nginx/sites-available/prometheus /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# --- Create performance optimization script ---
log "Creating database optimization script..."
cat > ${APP_DIR}/optimize_db.sh << EOF
#!/bin/bash

# Script to optimize PostgreSQL database
# Run this monthly or as needed

set -e

# Vacuum and analyze the database
echo "Running VACUUM ANALYZE on the database..."
sudo -u postgres psql -c "VACUUM ANALYZE;"

# Reindex the database
echo "Reindexing the database..."
sudo -u postgres psql -c "REINDEX DATABASE rep_dash_prod;"

# Update statistics
echo "Updating statistics..."
sudo -u postgres psql -c "ANALYZE;"

echo "Database optimization completed."
EOF

chmod +x ${APP_DIR}/optimize_db.sh

# --- Add to crontab ---
log "Setting up cron jobs..."
(crontab -l 2>/dev/null || echo "") | \
{ cat; echo "0 2 1 * * ${APP_DIR}/optimize_db.sh >> /var/log/optimize_db.log 2>&1"; } | \
crontab -

# --- Create basic monitoring dashboard script ---
log "Creating basic monitoring script..."
cat > ${APP_DIR}/check_status.sh << EOF
#!/bin/bash

# Script to check system and application status

echo "==== System Status at \$(date) ===="
echo
echo "=== CPU Usage ==="
top -bn1 | head -n 5

echo
echo "=== Memory Usage ==="
free -h

echo
echo "=== Disk Usage ==="
df -h

echo
echo "=== Application Status ==="
pm2 list

echo
echo "=== PostgreSQL Status ==="
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

echo
echo "=== Nginx Status ==="
systemctl status nginx | grep "Active:"

echo
echo "=== Last 5 Error Log Entries ==="
tail -n 5 ${APP_DIR}/logs/error.log

echo
echo "==== Status Check Complete ===="
EOF

chmod +x ${APP_DIR}/check_status.sh

# --- Output summary ---
log "Monitoring setup completed successfully!"
log ""
log "Prometheus is available at: https://prometheus.${DOMAIN}"
log "Username: admin"
log "Password: ${PROMETHEUS_PASSWORD}"
log ""
log "Monitoring tools installed:"
log "- PM2 for Node.js process management"
log "- Prometheus for metrics collection"
log "- Node Exporter for system metrics"
log "- Various system tools (htop, iotop, sysstat, etc.)"
log ""
log "Database optimization script: ${APP_DIR}/optimize_db.sh"
log "System status check script: ${APP_DIR}/check_status.sh"
log ""
log "Next steps:"
log "1. Set up DNS records for prometheus.${DOMAIN} pointing to this server"
log "2. Run: certbot --nginx -d prometheus.${DOMAIN} to configure SSL"
log "3. Consider setting up Grafana for better visualization"
log "4. Add application-specific metrics to your Next.js app"
log ""
log "To check system status, run: ${APP_DIR}/check_status.sh"