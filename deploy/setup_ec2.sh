#!/bin/bash
set -e

# 1. System update + dependencies
sudo dnf update -y
sudo dnf install -y python3.11 python3.11-pip git nginx

# 2. Certbot (Let's Encrypt)
sudo dnf install -y augeas-libs
sudo python3 -m venv /opt/certbot
sudo /opt/certbot/bin/pip install certbot certbot-nginx
sudo ln -sf /opt/certbot/bin/certbot /usr/bin/certbot

# 3. App setup
cd /home/ec2-user/langgraph-bedrock-demo
python3.11 -m venv venv
venv/bin/pip install -r requirements.txt

# 4. FastAPI systemd service
sudo tee /etc/systemd/system/phsolutions-api.service > /dev/null <<EOF
[Unit]
Description=PH Solutions Chat API
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/langgraph-bedrock-demo
EnvironmentFile=/home/ec2-user/langgraph-bedrock-demo/.env
ExecStart=/home/ec2-user/langgraph-bedrock-demo/venv/bin/uvicorn src.api:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable phsolutions-api
sudo systemctl start phsolutions-api

# 5. Nginx config
sudo tee /etc/nginx/conf.d/phsolutions.conf > /dev/null <<EOF
server {
    listen 80;
    server_name ai.api.phsolutions.hu;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;

        # SSE streaming support
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        chunked_transfer_encoding on;
    }
}
EOF

sudo systemctl enable nginx
sudo systemctl start nginx

# 6. SSL certificate
sudo certbot --nginx -d ai.api.phsolutions.hu --non-interactive --agree-tos -m info@phsolutions.hu

echo ""
echo "Done. API available at https://ai.api.phsolutions.hu"
