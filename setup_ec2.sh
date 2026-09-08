#!/usr/bin/env bash
# ==============================================================================
# Ultra-Fast Lightweight Deployment Script for KIOT-CDT on AWS EC2
# ==============================================================================
set -e

echo "=========================================="
echo " Starting KIOT-CDT Deployment on AWS EC2 "
echo "=========================================="

# 1. Free up disk space on EC2 instance
echo "--> Cleaning package caches & temp files to maximize disk space..."
sudo apt-get clean -y || true
sudo rm -rf /tmp/* /var/cache/apt/archives/* || true

# 2. Update and install minimal prerequisites
echo "--> Installing lightweight prerequisites..."
sudo apt-get update -y
sudo apt-get install -y curl wget unzip nginx libicu-dev

# 3. Install lightweight ASP.NET Core 9.0 Runtime (~30MB)
if ! command -v dotnet &> /dev/null || [[ "$(dotnet --version 2>&1)" != 9.* ]]; then
    echo "--> Installing lightweight ASP.NET Core 9.0 Runtime..."
    wget https://dot.net/v1/dotnet-install.sh -O /tmp/dotnet-install.sh
    chmod +x /tmp/dotnet-install.sh
    sudo /tmp/dotnet-install.sh --channel 9.0 --runtime aspnetcore --install-dir /usr/share/dotnet
    sudo ln -sf /usr/share/dotnet/dotnet /usr/bin/dotnet
    rm -f /tmp/dotnet-install.sh
fi

echo "--> .NET Runtime ready: $(dotnet --info | grep 'Host:' -A 4 || echo 'OK')"

# 4. Deploy pre-compiled full-stack package
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "--> Deploying pre-compiled release to /var/www/cdt_project..."
sudo mkdir -p /var/www/cdt_project
sudo rm -rf /var/www/cdt_project/*

if [ -d "$SCRIPT_DIR/publish" ]; then
    sudo cp -r "$SCRIPT_DIR/publish/"* /var/www/cdt_project/
else
    echo "Error: publish directory not found in repository."
    exit 1
fi

# Ensure seed_data.json is present
if [ -f "$SCRIPT_DIR/backend/seed_data.json" ] && [ ! -f /var/www/cdt_project/seed_data.json ]; then
    sudo cp "$SCRIPT_DIR/backend/seed_data.json" /var/www/cdt_project/seed_data.json
fi

# Fix permissions
sudo chown -R www-data:www-data /var/www/cdt_project
sudo chmod -R 755 /var/www/cdt_project

# 5. Configure systemd service
echo "--> Configuring background service (cdt.service)..."
cat << 'EOF' | sudo tee /etc/systemd/system/cdt.service > /dev/null
[Unit]
Description=KIOT CDT Placement & Training Portal
After=network.target

[Service]
WorkingDirectory=/var/www/cdt_project
ExecStart=/usr/bin/dotnet /var/www/cdt_project/backend.dll --urls=http://0.0.0.0:5000
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=cdt-portal
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false
Environment=DOTNET_ROOT=/usr/share/dotnet

[Install]
WantedBy=multi-user.target
EOF

# 6. Configure Nginx Reverse Proxy
echo "--> Configuring Nginx on Port 80..."
cat << 'EOF' | sudo tee /etc/nginx/sites-available/default > /dev/null
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
EOF

# 7. Start and verify services
echo "--> Starting services..."
sudo systemctl daemon-reload
sudo systemctl restart nginx
sudo systemctl enable --now cdt.service
sudo systemctl restart cdt.service

sleep 2

# Clean temporary files again
sudo apt-get clean -y || true
sudo rm -rf /tmp/* || true

echo ""
echo "============================================================"
echo " 🎉 Deployment Completed Successfully! "
echo " Public Portal URL: http://$(curl -s http://checkip.amazonaws.com || curl -s ifconfig.me)"
echo " Service Status:    sudo systemctl status cdt.service"
echo " View Live Logs:    sudo journalctl -u cdt.service -f"
echo "============================================================"
