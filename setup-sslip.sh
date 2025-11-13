#!/bin/bash
# setup-sslip.sh
# Script automático para configurar sslip.io + Let's Encrypt

set -e

echo "🚀 Setup: sslip.io + Let's Encrypt HTTPS"
echo "========================================"
echo ""

# Detectar IP público
echo "🔍 Detectando IP público..."
PUBLIC_IP=$(curl -s ifconfig.me)

if [ -z "$PUBLIC_IP" ]; then
    echo "❌ Não foi possível detectar o IP público"
    read -p "Digite seu IP manualmente: " PUBLIC_IP
fi

echo "✅ IP detectado: $PUBLIC_IP"
echo ""

# Converter IP para formato sslip.io
SSLIP_FORMAT=$(echo $PUBLIC_IP | tr '.' '-')
DOMAIN_PROD="api-${SSLIP_FORMAT}.sslip.io"
DOMAIN_DEV="api-dev-${SSLIP_FORMAT}.sslip.io"

echo "📝 Seus domínios serão:"
echo "   PROD: https://$DOMAIN_PROD"
echo "   DEV:  https://$DOMAIN_DEV"
echo ""

read -p "Continuar com esses domínios? (s/n): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo "❌ Cancelado pelo usuário"
    exit 0
fi

echo ""
echo "🧪 Testando resolução DNS..."
if nslookup $DOMAIN_PROD | grep -q "$PUBLIC_IP"; then
    echo "✅ DNS resolvendo corretamente!"
else
    echo "⚠️  DNS pode não estar resolvendo ainda"
    echo "   Aguardando 5 segundos..."
    sleep 5
fi

echo ""
read -p "Digite seu email para Let's Encrypt: " EMAIL

if [ -z "$EMAIL" ]; then
    echo "❌ Email é obrigatório"
    exit 1
fi

echo ""
echo "📦 Instalando dependências..."
sudo apt update
sudo apt install -y certbot

echo ""
echo "🛑 Parando NGINX..."
cd /var/www/rentals
docker compose -f docker-compose.production.yml stop nginx

echo ""
echo "🔐 Obtendo certificado SSL para PROD..."
sudo certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN_PROD"

if [ $? -eq 0 ]; then
    echo "✅ Certificado SSL obtido para $DOMAIN_PROD"
else
    echo "❌ Falha ao obter certificado"
    echo "   Verifique se a porta 80 está acessível"
    exit 1
fi

echo ""
read -p "Obter certificado para DEV também? (s/n): " GET_DEV

if [ "$GET_DEV" = "s" ] || [ "$GET_DEV" = "S" ]; then
    echo "🔐 Obtendo certificado SSL para DEV..."
    sudo certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN_DEV"

    if [ $? -eq 0 ]; then
        echo "✅ Certificado SSL obtido para $DOMAIN_DEV"
    fi
fi

echo ""
echo "📝 Criando nginx.conf com SSL..."

# Backup
cp nginx.conf nginx.conf.backup.$(date +%Y%m%d-%H%M%S)

# Criar nginx.conf com SSL
cat > nginx.conf << NGINX_EOF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    upstream api_prod {
        server api-prod:3000;
    }

    # PRODUÇÃO - HTTPS
    server {
        listen 443 ssl http2;
        server_name $DOMAIN_PROD;

        ssl_certificate /etc/letsencrypt/live/$DOMAIN_PROD/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_PROD/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # CORS
        add_header 'Access-Control-Allow-Origin' '\$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '\$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            return 204;
        }

        location / {
            proxy_pass http://api_prod;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }

    # Redirecionar HTTP → HTTPS
    server {
        listen 80;
        server_name $DOMAIN_PROD;
        return 301 https://\$server_name\$request_uri;
    }

    # Servidor padrão
    server {
        listen 80 default_server;
        location / {
            return 200 'Use https://$DOMAIN_PROD';
            add_header Content-Type text/plain;
        }
    }
}
NGINX_EOF

echo "✅ nginx.conf criado"

echo ""
echo "🐳 Atualizando docker-compose.production.yml..."

# Verificar se já tem o volume do letsencrypt
if grep -q "/etc/letsencrypt:/etc/letsencrypt" docker-compose.production.yml; then
    echo "✅ Volume letsencrypt já configurado"
else
    echo "⚠️  Adicionando volume letsencrypt manualmente..."
    echo "   Edite docker-compose.production.yml e adicione na seção nginx:"
    echo "   - /etc/letsencrypt:/etc/letsencrypt:ro"
    read -p "Pressione Enter após adicionar..."
fi

echo ""
echo "🚀 Iniciando NGINX..."
docker compose -f docker-compose.production.yml up -d nginx

sleep 3

echo ""
echo "🧪 Testando HTTPS..."
if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN_PROD/health" | grep -q "200"; then
    echo "✅ HTTPS funcionando!"
else
    echo "⚠️  HTTPS pode não estar funcionando ainda"
    echo "   Verifique logs: docker compose -f docker-compose.production.yml logs nginx"
fi

echo ""
echo "🔄 Configurando renovação automática..."
(sudo crontab -l 2>/dev/null; echo "0 0 * * * certbot renew --quiet && docker compose -f /var/www/rentals/docker-compose.production.yml restart nginx") | sudo crontab -

echo ""
echo "🎉 SETUP CONCLUÍDO!"
echo "==================="
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Na Vercel, configure:"
echo "   VITE_API_URL=https://$DOMAIN_PROD"
echo ""
echo "2. Faça redeploy na Vercel"
echo ""
echo "3. Teste seu site:"
echo "   - Abra console (F12)"
echo "   - Publique um anúncio"
echo "   - Verifique que não há erros de Mixed Content"
echo ""
echo "📝 Suas URLs:"
echo "   PROD: https://$DOMAIN_PROD"
if [ "$GET_DEV" = "s" ] || [ "$GET_DEV" = "S" ]; then
    echo "   DEV:  https://$DOMAIN_DEV"
fi
echo ""
echo "✅ Tudo pronto!"
