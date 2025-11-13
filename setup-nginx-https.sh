#!/bin/bash

# Script de Instalação Nginx + HTTPS para Ambiente Dev
# Domain: dev-3000-45-55-95-48.sslip.io
# IP: 45.55.95.48
# Backend Port: 3000

set -e  # Exit on error

echo "=================================================="
echo "🚀 Setup Nginx + HTTPS para Ambiente Dev"
echo "=================================================="
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Por favor, execute como root (sudo)"
    exit 1
fi

echo "✅ Executando como root"
echo ""

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
apt update -qq
apt upgrade -y -qq
echo "✅ Sistema atualizado"
echo ""

# 2. Instalar Nginx
echo "📦 Instalando Nginx..."
apt install nginx -y -qq
systemctl enable nginx
systemctl start nginx
echo "✅ Nginx instalado e iniciado"
echo ""

# 3. Configurar Firewall
echo "🔥 Configurando Firewall (UFW)..."
ufw --force enable
ufw allow 22/tcp  # SSH
ufw allow 80/tcp  # HTTP
ufw allow 443/tcp # HTTPS
echo "✅ Firewall configurado"
echo ""

# 4. Instalar Certbot
echo "🔐 Instalando Certbot..."
apt install certbot python3-certbot-nginx -y -qq
echo "✅ Certbot instalado"
echo ""

# 5. Criar configuração do Nginx
echo "📝 Criando configuração do Nginx..."
cat > /etc/nginx/sites-available/dev-api << 'EOF'
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

    # SSL Certificate Configuration (will be managed by Certbot)
    # ssl_certificate /etc/letsencrypt/live/dev-3000-45-55-95-48.sslip.io/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/dev-3000-45-55-95-48.sslip.io/privkey.pem;
    # include /etc/letsencrypt/options-ssl-nginx.conf;
    # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS Configuration for Vercel frontend
    add_header Access-Control-Allow-Origin "https://rentals-dev-zeta.vercel.app" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        return 204;
    }

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
echo "✅ Configuração criada em /etc/nginx/sites-available/dev-api"
echo ""

# 6. Ativar site
echo "🔗 Ativando site..."
ln -sf /etc/nginx/sites-available/dev-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
echo "✅ Site ativado"
echo ""

# 7. Testar configuração
echo "🧪 Testando configuração do Nginx..."
nginx -t
echo "✅ Configuração válida"
echo ""

# 8. Reiniciar Nginx
echo "🔄 Reiniciando Nginx..."
systemctl restart nginx
echo "✅ Nginx reiniciado"
echo ""

# 9. Verificar se backend está rodando
echo "🔍 Verificando se backend está rodando na porta 3000..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Backend está respondendo na porta 3000"
else
    echo "⚠️  ATENÇÃO: Backend não está respondendo na porta 3000!"
    echo "   Certifique-se de iniciar sua aplicação Node.js antes de continuar."
    echo ""
fi

# 10. Obter certificado SSL
echo "🔐 Obtendo certificado SSL com Let's Encrypt..."
echo ""
echo "⚠️  IMPORTANTE: Você precisará fornecer um e-mail válido."
echo ""
certbot --nginx -d dev-3000-45-55-95-48.sslip.io --non-interactive --agree-tos --register-unsafely-without-email || {
    echo ""
    echo "⚠️  Certbot automático falhou. Vamos tentar manualmente..."
    echo "Execute: sudo certbot --nginx -d dev-3000-45-55-95-48.sslip.io"
    exit 1
}
echo ""
echo "✅ Certificado SSL obtido com sucesso!"
echo ""

# 11. Testar renovação automática
echo "🔄 Testando renovação automática..."
certbot renew --dry-run
echo "✅ Renovação automática configurada"
echo ""

echo "=================================================="
echo "✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=================================================="
echo ""
echo "🎉 Sua API agora está disponível em:"
echo "   https://dev-3000-45-55-95-48.sslip.io"
echo ""
echo "🔧 Configurações:"
echo "   - Nginx rodando nas portas 80 e 443"
echo "   - Proxy para http://localhost:3000"
echo "   - SSL válido (Let's Encrypt)"
echo "   - CORS configurado para: https://rentals-dev-zeta.vercel.app"
echo ""
echo "📝 Próximos passos:"
echo "   1. Acesse: https://dev-3000-45-55-95-48.sslip.io no navegador"
echo "   2. Verifique o cadeado verde 🔒"
echo "   3. Atualize sua URL no front-end Vercel para:"
echo "      https://dev-3000-45-55-95-48.sslip.io"
echo ""
echo "🐛 Troubleshooting:"
echo "   - Logs do Nginx: sudo tail -f /var/log/nginx/dev-api-error.log"
echo "   - Status do Nginx: sudo systemctl status nginx"
echo "   - Testar backend: curl http://localhost:3000"
echo ""
echo "=================================================="
