#!/bin/bash
# fix-cors-nginx.sh
# Script para adicionar headers CORS no NGINX e resolver problema de mixed content

echo "🔧 Fix CORS + Mixed Content para NGINX"
echo "======================================"
echo ""

# Verificar se está no diretório correto
if [ ! -f "nginx.conf" ]; then
    echo "❌ Erro: nginx.conf não encontrado"
    echo "   Execute este script em /var/www/rentals"
    exit 1
fi

# Fazer backup do nginx.conf atual
echo "📦 Fazendo backup de nginx.conf..."
cp nginx.conf nginx.conf.backup.$(date +%Y%m%d-%H%M%S)
echo "✅ Backup criado"
echo ""

# Perguntar qual domínio da Vercel
read -p "📝 Digite o domínio da Vercel (ex: seu-app.vercel.app): " VERCEL_DOMAIN

if [ -z "$VERCEL_DOMAIN" ]; then
    echo "❌ Erro: Domínio não pode ser vazio"
    exit 1
fi

echo ""
echo "🔧 Atualizando nginx.conf com headers CORS..."
echo ""

# Criar novo nginx.conf com CORS
cat > nginx.conf.new << 'NGINX_EOF'
# nginx.conf
# Configuração NGINX com CORS habilitado

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

    # Upstream
    upstream api_dev {
        server api-dev:3000;
    }

    upstream api_test {
        server api-test:3000;
    }

    upstream api_prod {
        server api-prod:3000;
    }

    # ========================================================================
    # PRODUÇÃO (Porta 3002) - COM CORS
    # ========================================================================
    server {
        listen 80;
        server_name _;  # Aceita qualquer host

        # Headers CORS para permitir Vercel
        add_header 'Access-Control-Allow-Origin' 'VERCEL_DOMAIN_PLACEHOLDER' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        # Responder OPTIONS (preflight)
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'VERCEL_DOMAIN_PLACEHOLDER' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        location / {
            proxy_pass http://api_prod;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Não adicionar headers duplicados do proxy
            proxy_hide_header 'Access-Control-Allow-Origin';
            proxy_hide_header 'Access-Control-Allow-Methods';
            proxy_hide_header 'Access-Control-Allow-Headers';
        }
    }

    # ========================================================================
    # Servidor com subpaths (IP:80/prod, IP:80/dev, IP:80/test)
    # ========================================================================
    server {
        listen 8080;

        location /dev {
            add_header 'Access-Control-Allow-Origin' 'VERCEL_DOMAIN_PLACEHOLDER' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

            rewrite ^/dev/(.*) /$1 break;
            proxy_pass http://api_dev;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /test {
            add_header 'Access-Control-Allow-Origin' 'VERCEL_DOMAIN_PLACEHOLDER' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

            rewrite ^/test/(.*) /$1 break;
            proxy_pass http://api_test;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /prod {
            add_header 'Access-Control-Allow-Origin' 'VERCEL_DOMAIN_PLACEHOLDER' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

            rewrite ^/prod/(.*) /$1 break;
            proxy_pass http://api_prod;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location / {
            return 200 'Rentals API - Use /dev, /test ou /prod';
            add_header Content-Type text/plain;
        }
    }
}
NGINX_EOF

# Substituir o placeholder pelo domínio da Vercel
sed "s|VERCEL_DOMAIN_PLACEHOLDER|https://$VERCEL_DOMAIN|g" nginx.conf.new > nginx.conf

rm nginx.conf.new

echo "✅ nginx.conf atualizado com CORS para: https://$VERCEL_DOMAIN"
echo ""

# Verificar se NGINX container está rodando
echo "🐳 Verificando container NGINX..."
if docker compose -f docker-compose.production.yml ps | grep -q nginx; then
    echo "✅ Container NGINX encontrado"
    echo ""

    # Testar configuração
    echo "🧪 Testando configuração NGINX..."
    if docker compose -f docker-compose.production.yml exec -T nginx nginx -t; then
        echo "✅ Configuração válida!"
        echo ""

        # Perguntar se quer reiniciar
        read -p "🔄 Reiniciar NGINX agora? (s/n): " RESTART

        if [ "$RESTART" = "s" ] || [ "$RESTART" = "S" ]; then
            echo "🔄 Reiniciando NGINX..."
            docker compose -f docker-compose.production.yml restart nginx
            echo "✅ NGINX reiniciado!"
            echo ""

            # Testar CORS
            echo "🧪 Testando CORS..."
            sleep 2

            CORS_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
                -H "Origin: https://$VERCEL_DOMAIN" \
                -H "Access-Control-Request-Method: POST" \
                -H "Access-Control-Request-Headers: Content-Type" \
                -X OPTIONS \
                http://localhost/health 2>/dev/null)

            if [ "$CORS_TEST" = "204" ] || [ "$CORS_TEST" = "200" ]; then
                echo "✅ CORS funcionando! (HTTP $CORS_TEST)"
            else
                echo "⚠️  CORS pode não estar funcionando (HTTP $CORS_TEST)"
                echo "   Verifique os logs: docker compose -f docker-compose.production.yml logs nginx"
            fi
        else
            echo "⚠️  Lembre-se de reiniciar o NGINX manualmente:"
            echo "   docker compose -f docker-compose.production.yml restart nginx"
        fi
    else
        echo "❌ Erro na configuração NGINX!"
        echo "   Restaurando backup..."
        mv nginx.conf.backup.* nginx.conf
        echo "✅ Backup restaurado"
        exit 1
    fi
else
    echo "⚠️  Container NGINX não está rodando"
    echo "   Inicie com: docker compose -f docker-compose.production.yml up -d nginx"
fi

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "=================="
echo ""
echo "1. Na Vercel, configure:"
echo "   VITE_API_URL=http://45.55.95.48"
echo "   (Sem porta, NGINX vai rotear para 3002 automaticamente)"
echo ""
echo "2. Faça redeploy na Vercel"
echo ""
echo "3. Teste abrindo o console (F12) e verificando:"
echo "   - Sem erros de CORS"
echo "   - Sem erros de Mixed Content"
echo ""
echo "4. Se ainda tiver Mixed Content, use a Solução 2 (Proxy Vercel)"
echo "   Ver: SOLUCAO_HTTPS.md"
echo ""
echo "📁 Backup salvo em: nginx.conf.backup.*"
echo ""
echo "✅ Configuração concluída!"
