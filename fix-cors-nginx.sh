#!/bin/bash

# Script para corrigir CORS duplicado no Nginx
# Remove headers CORS do Nginx (deixa apenas o backend gerenciar)

echo "🔧 Corrigindo configuração CORS do Nginx..."

# Backup da configuração atual
sudo cp /etc/nginx/sites-available/dev-api /etc/nginx/sites-available/dev-api.backup
echo "✅ Backup criado: /etc/nginx/sites-available/dev-api.backup"

# Criar nova configuração sem CORS
sudo tee /etc/nginx/sites-available/dev-api > /dev/null << 'EOF'
# Nginx Configuration for Development Environment (sslip.io)
# Domain: dev-3000-45-55-95-48.sslip.io → http://localhost:3000

# HTTP → HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name dev-3000-45-55-95-48.sslip.io;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server Block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dev-3000-45-55-95-48.sslip.io;

    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/dev-3000-45-55-95-48.sslip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev-3000-45-55-95-48.sslip.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers (sem CORS - deixa o backend gerenciar)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/dev-api-access.log;
    error_log /var/log/nginx/dev-api-error.log;

    # Max body size for uploads
    client_max_body_size 10M;

    # Proxy configuration to Node.js application on port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;

        # Error handling
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    }

    # Health check endpoint (optional)
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

echo "✅ Nova configuração criada (sem CORS duplicado)"

# Testar configuração
echo ""
echo "🧪 Testando configuração do Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração válida!"
    echo ""
    echo "🔄 Reiniciando Nginx..."
    sudo systemctl restart nginx

    if [ $? -eq 0 ]; then
        echo "✅ Nginx reiniciado com sucesso!"
        echo ""
        echo "=================================================="
        echo "✅ CORS CORRIGIDO!"
        echo "=================================================="
        echo ""
        echo "O Nginx agora NÃO adiciona headers CORS."
        echo "Apenas o backend (NestJS) gerencia CORS."
        echo ""
        echo "🧪 Teste agora no navegador:"
        echo "   https://rentals-dev-zeta.vercel.app"
        echo ""
        echo "Deve funcionar sem erros! 🎉"
        echo "=================================================="
    else
        echo "❌ Erro ao reiniciar Nginx"
        echo "Restaurando backup..."
        sudo cp /etc/nginx/sites-available/dev-api.backup /etc/nginx/sites-available/dev-api
        sudo systemctl restart nginx
        exit 1
    fi
else
    echo "❌ Configuração inválida!"
    echo "Restaurando backup..."
    sudo cp /etc/nginx/sites-available/dev-api.backup /etc/nginx/sites-available/dev-api
    exit 1
fi
