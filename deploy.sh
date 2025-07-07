#!/bin/bash
# DeepSeaGuard Dashboard Deployment Script
# This script deploys the DeepSeaGuard dashboard to production

# Exit on error
set -e

# Configuration
APP_NAME="deepseaguard"
DEPLOY_DIR="/var/www/deepseaguard"
BACKUP_DIR="/var/www/backups"
LOG_FILE="./deploy.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Log function
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a $LOG_FILE
}

# Create log file
touch $LOG_FILE
log "Starting DeepSeaGuard deployment..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
  log "Please run as root or with sudo"
  exit 1
fi

# Create directories if they don't exist
log "Creating deployment directories..."
mkdir -p $DEPLOY_DIR
mkdir -p $BACKUP_DIR

# Backup existing deployment if it exists
if [ -d "$DEPLOY_DIR/dist" ]; then
  log "Backing up existing deployment..."
  tar -czf "$BACKUP_DIR/$APP_NAME-$TIMESTAMP.tar.gz" -C $DEPLOY_DIR .
  log "Backup created at $BACKUP_DIR/$APP_NAME-$TIMESTAMP.tar.gz"
fi

# Build the application
log "Building application..."
npm install
npm run build

# Check if build was successful
if [ ! -d "./dist" ]; then
  log "Build failed! Deployment aborted."
  exit 1
fi

# Deploy to production directory
log "Deploying to $DEPLOY_DIR..."
rm -rf $DEPLOY_DIR/*
cp -r ./dist/* $DEPLOY_DIR/

# Set proper permissions
log "Setting permissions..."
chown -R www-data:www-data $DEPLOY_DIR
chmod -R 755 $DEPLOY_DIR

# Configure web server (example for Nginx)
if [ -d "/etc/nginx/sites-available" ]; then
  log "Configuring Nginx..."
  
  # Create Nginx configuration
  cat > /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name deepseaguard.tritoncorp.com;
    root $DEPLOY_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /ws/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

  # Enable site if not already enabled
  if [ ! -f "/etc/nginx/sites-enabled/$APP_NAME" ]; then
    ln -s /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
  fi

  # Test Nginx configuration
  nginx -t
  
  # Reload Nginx
  systemctl reload nginx
  
  log "Nginx configured successfully"
fi

# Start or restart API server
log "Starting API server..."
if [ -f "/etc/systemd/system/$APP_NAME-api.service" ]; then
  systemctl restart $APP_NAME-api
else
  # Create systemd service for API
  cat > /etc/systemd/system/$APP_NAME-api.service <<EOF
[Unit]
Description=DeepSeaGuard API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$DEPLOY_DIR/server
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

  # Enable and start service
  systemctl daemon-reload
  systemctl enable $APP_NAME-api
  systemctl start $APP_NAME-api
  
  log "API service created and started"
fi

# Start or restart WebSocket server
log "Starting WebSocket server..."
if [ -f "/etc/systemd/system/$APP_NAME-ws.service" ]; then
  systemctl restart $APP_NAME-ws
else
  # Create systemd service for WebSocket
  cat > /etc/systemd/system/$APP_NAME-ws.service <<EOF
[Unit]
Description=DeepSeaGuard WebSocket Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$DEPLOY_DIR/server
ExecStart=/usr/bin/node websocket.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF

  # Enable and start service
  systemctl daemon-reload
  systemctl enable $APP_NAME-ws
  systemctl start $APP_NAME-ws
  
  log "WebSocket service created and started"
fi

# Verify deployment
log "Verifying deployment..."
if curl -s http://localhost | grep -q "DeepSeaGuard"; then
  log "Deployment verification successful"
else
  log "Warning: Deployment verification failed. Please check manually."
fi

# Run post-deployment tests
log "Running post-deployment tests..."
node ./src/tests/run_tests.js || log "Warning: Some tests failed. Please check test report."

log "Deployment completed successfully!"
log "DeepSeaGuard dashboard is now available at http://deepseaguard.tritoncorp.com"
