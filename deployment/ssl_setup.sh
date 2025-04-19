#!/bin/bash

# Rep Dashboard - SSL Configuration Script with Let's Encrypt
# This script automates the setup of SSL certificates for your domain

set -e  # Exit on any error

# --- Color output for better readability ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Configuration variables ---
DOMAIN="rep-dashboard.example.com"  # Change to your actual domain
EMAIL="admin@example.com"  # Change to your email for Let's Encrypt notifications
NGINX_CONF="/etc/nginx/sites-available/rep-dash"

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

# --- Check if domain is configured ---
if [ "$DOMAIN" = "rep-dashboard.example.com" ]; then
  warn "Default domain detected. You should update this script with your real domain."
  read -p "Do you want to continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Script aborted. Please update the DOMAIN variable."
  fi
fi

# --- Check if email is configured ---
if [ "$EMAIL" = "admin@example.com" ]; then
  warn "Default email detected. You should update this script with your real email."
  read -p "Do you want to continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Script aborted. Please update the EMAIL variable."
  fi
fi

# --- Check DNS setup ---
log "Checking DNS configuration for ${DOMAIN}..."
HOST_IP=$(dig +short A ${DOMAIN})
SERVER_IP=$(curl -s ifconfig.me)

if [ -z "$HOST_IP" ]; then
  warn "Could not resolve ${DOMAIN}. DNS might not be properly configured."
  read -p "Do you want to continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Script aborted. Please check your DNS configuration."
  fi
elif [ "$HOST_IP" != "$SERVER_IP" ]; then
  warn "DNS for ${DOMAIN} points to ${HOST_IP}, but this server's IP is ${SERVER_IP}."
  read -p "Do you want to continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Script aborted. Please check your DNS configuration."
  fi
else
  log "DNS for ${DOMAIN} correctly points to this server (${SERVER_IP})."
fi

# --- Check if Certbot is installed ---
log "Checking Certbot installation..."
if ! command -v certbot &> /dev/null; then
  log "Installing Certbot..."
  snap install core
  snap refresh core
  snap install --classic certbot
  ln -sf /snap/bin/certbot /usr/bin/certbot
else
  log "Certbot is already installed."
fi

# --- Set up strong SSL parameters ---
log "Setting up strong SSL parameters..."
mkdir -p /etc/nginx/ssl
cat > /etc/nginx/ssl/ssl-params.conf << EOF
# SSL Parameters for enhanced security

# Protocols and Ciphers
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

# Performance optimizations
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Diffie-Hellman parameters
ssl_dhparam /etc/nginx/ssl/dhparam.pem;

# HSTS
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
EOF

# --- Generate Diffie-Hellman parameters ---
log "Generating Diffie-Hellman parameters (2048 bits) - this may take a while..."
if [ ! -f "/etc/nginx/ssl/dhparam.pem" ]; then
  openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
else
  log "Diffie-Hellman parameters already exist."
fi

# --- Check Nginx configuration ---
log "Checking Nginx configuration..."
if [ ! -f "$NGINX_CONF" ]; then
  warn "Nginx configuration file not found: $NGINX_CONF"
  log "Creating a basic Nginx configuration..."
  
  cat > $NGINX_CONF << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    
    location / {
        return 301 https://\$host\$request_uri;
    }
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    
    # SSL configuration will be added by Certbot
    
    # SSL parameters
    include /etc/nginx/ssl/ssl-params.conf;
    
    # Logs
    access_log /var/log/nginx/rep-dash_access.log;
    error_log /var/log/nginx/rep-dash_error.log;
    
    # Root directory
    root /var/www/rep-dash/current/public;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline'; frame-ancestors 'self';";
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()";
    
    # Next.js proxy
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

  # Create symlink to enable site
  ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
  
  # Disable default site if it exists
  if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm -f /etc/nginx/sites-enabled/default
  fi
fi

# --- Prepare for Let's Encrypt verification ---
log "Preparing for Let's Encrypt verification..."
mkdir -p /var/www/html/.well-known/acme-challenge
chmod -R 755 /var/www/html

# Reload Nginx to apply changes
log "Reloading Nginx configuration..."
nginx -t || error "Nginx configuration test failed"
systemctl reload nginx

# --- Obtain SSL certificate ---
log "Obtaining SSL certificate from Let's Encrypt..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

# --- Verify SSL configuration ---
log "Verifying SSL configuration..."
if openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} -tlsextdebug 2>/dev/null | grep -q "Protocol.*TLSv1.2"; then
  log "SSL is properly configured with TLSv1.2/TLSv1.3"
else
  warn "SSL verification failed. Check your configuration."
fi

# --- Set up auto-renewal ---
log "Setting up certificate auto-renewal..."
echo "0 3 * * * certbot renew --quiet" | crontab -

# --- Test auto-renewal ---
log "Testing certificate renewal process..."
certbot renew --dry-run

# --- Set up certificate deployment hook ---
log "Setting up post-renewal hook to reload Nginx..."
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << EOF
#!/bin/sh
systemctl reload nginx
EOF
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# --- Output summary ---
log "SSL setup completed successfully!"
log ""
log "Summary:"
log "1. SSL certificate obtained for: ${DOMAIN}"
log "2. Strong SSL parameters configured in /etc/nginx/ssl/ssl-params.conf"
log "3. Certificate will auto-renew via cron job"
log "4. Nginx will reload automatically after renewal"
log ""
log "Your site is now accessible at: https://${DOMAIN}"
log ""
log "Certificate details:"
certbot certificates

# --- Check SSL score (if online) ---
log ""
log "You can test your SSL configuration at: https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}"
log ""
log "Recommended next steps:"
log "1. Verify that your site works correctly with HTTPS"
log "2. Consider enabling HSTS preloading: https://hstspreload.org/"
log "3. Monitor certificate expiration dates"