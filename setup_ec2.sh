#!/usr/bin/env bash
# ==============================================================================
# Automated Setup & Deployment Script for KIOT-CDT on AWS EC2 (Ubuntu 22.04 / 24.04)
# ==============================================================================
set -e

echo "=========================================="
echo " Starting KIOT-CDT Deployment on AWS EC2 "
echo "=========================================="

# 1. Update system packages
echo "--> Updating system packages..."
sudo apt-get update -y
sudo apt-get install -y curl wget git unzip libicu-dev

# 2. Install Node.js LTS (v20 or v22)
if ! command -v node &> /dev/null; then
    echo "--> Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "--> Node.js already installed: $(node -v)"
fi

# 3. Install .NET 9.0 SDK
if ! command -v dotnet &> /dev/null; then
    echo "--> Installing .NET 9.0 SDK..."
    sudo apt-get install -y dotnet-sdk-9.0 || {
        # Fallback for Ubuntu versions requiring Microsoft package repo
        wget https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
        sudo dpkg -i packages-microsoft-prod.deb
        rm packages-microsoft-prod.deb
        sudo apt-get update -y
        sudo apt-get install -y dotnet-sdk-9.0
    }
else
    echo "--> .NET SDK already installed: $(dotnet --version)"
fi

# 4. Install & Build Frontend
echo "--> Building React Frontend Bundle..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

npm install
npm run build

# 5. Prepare backend wwwroot and publish release
echo "--> Packaging and Publishing Full-Stack Backend..."
rm -rf "$SCRIPT_DIR/backend/wwwroot"
mkdir -p "$SCRIPT_DIR/backend/wwwroot"
cp -r "$SCRIPT_DIR/dist/"* "$SCRIPT_DIR/backend/wwwroot/"

sudo mkdir -p /var/www/cdt_project
cd "$SCRIPT_DIR/backend"
dotnet publish -c Release -o /var/www/cdt_project

# Ensure seed_data.json exists in published output
if [ -f "$SCRIPT_DIR/backend/seed_data.json" ]; then
    sudo cp "$SCRIPT_DIR/backend/seed_data.json" /var/www/cdt_project/seed_data.json
fi

# Fix permissions
sudo chown -R www-data:www-data /var/www/cdt_project
sudo chmod -R 755 /var/www/cdt_project

# 6. Create systemd service for ASP.NET Core
echo "--> Configuring systemd service (cdt.service)..."
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

[Install]
WantedBy=multi-user.target
EOF

# 7. Install & Configure Nginx Reverse Proxy
echo "--> Installing & Configuring Nginx on Port 80..."
sudo apt-get install -y nginx

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

# 8. Reload & Start Services
echo "--> Starting services..."
sudo systemctl daemon-reload
sudo systemctl restart nginx
sudo systemctl enable --now cdt.service
sudo systemctl restart cdt.service

echo ""
echo "============================================================"
echo " 🎉 Deployment Completed Successfully! "
echo " Public IP / DNS: http://$(curl -s http://checkip.amazonaws.com || curl -s ifconfig.me)"
echo " Service Status: sudo systemctl status cdt.service"
echo " View Logs:      sudo journalctl -u cdt.service -f"
echo "============================================================"
