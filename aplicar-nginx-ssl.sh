#!/bin/bash
# Script para aplicar nginx.conf com SSL sem conflitos de merge

set -e

echo "🚀 Aplicando nginx.conf com SSL para sslip.io"
echo "=============================================="
echo ""

# Backup do nginx.conf atual
if [ -f nginx.conf ]; then
    echo "📦 Fazendo backup do nginx.conf atual..."
    cp nginx.conf nginx.conf.backup.$(date +%Y%m%d-%H%M%S)
    echo "✅ Backup criado"
fi

# Baixar nginx.conf do branch com SSL
echo ""
echo "📥 Baixando nginx.conf com SSL configurado..."
git fetch origin claude/fix-professional-listing-click-011CV5DcbiN1LxmqJcrKU4Hi

# Aplicar apenas o nginx.conf do branch
git checkout origin/claude/fix-professional-listing-click-011CV5DcbiN1LxmqJcrKU4Hi -- nginx.conf

echo "✅ nginx.conf atualizado com SSL"

# Verificar se docker-compose tem volume do letsencrypt
echo ""
echo "🔍 Verificando docker-compose.production.yml..."

if grep -q "/etc/letsencrypt:/etc/letsencrypt" docker-compose.production.yml; then
    echo "✅ Volume letsencrypt já configurado"
else
    echo "⚠️  ATENÇÃO: Você precisa adicionar o volume letsencrypt!"
    echo ""
    echo "Edite docker-compose.production.yml e adicione na seção nginx:"
    echo "  volumes:"
    echo "    - /etc/letsencrypt:/etc/letsencrypt:ro"
    echo ""
    read -p "Pressione Enter quando tiver adicionado..."
fi

# Reiniciar NGINX
echo ""
echo "🔄 Reiniciando NGINX..."
docker compose -f docker-compose.production.yml restart nginx

echo ""
echo "⏳ Aguardando NGINX iniciar..."
sleep 5

# Verificar status
echo ""
echo "📊 Status do NGINX:"
docker compose -f docker-compose.production.yml ps nginx

# Testar HTTPS
echo ""
echo "🧪 Testando HTTPS..."
if curl -k -s https://api-45-55-95-48.sslip.io/health | grep -q "ok"; then
    echo "✅ HTTPS funcionando!"
    echo ""
    echo "🎉 SUCESSO!"
    echo "=========="
    echo ""
    echo "Sua API está rodando em:"
    echo "  https://api-45-55-95-48.sslip.io"
    echo ""
    echo "📝 Próximos passos:"
    echo ""
    echo "1. Configurar na Vercel:"
    echo "   VITE_API_URL=https://api-45-55-95-48.sslip.io"
    echo ""
    echo "2. Adicionar ao .env do servidor:"
    echo "   echo 'FRONTEND_URL_PROD=https://rentals-amber.vercel.app' >> .env"
    echo ""
    echo "3. Reiniciar api-prod:"
    echo "   docker compose -f docker-compose.production.yml restart api-prod"
    echo ""
else
    echo "❌ HTTPS não está respondendo"
    echo ""
    echo "🔍 Diagnóstico:"
    echo ""
    echo "1. Ver logs do NGINX:"
    echo "   docker compose -f docker-compose.production.yml logs nginx"
    echo ""
    echo "2. Verificar certificados SSL:"
    echo "   sudo ls -la /etc/letsencrypt/live/api-45-55-95-48.sslip.io/"
    echo ""
    echo "3. Se não tem certificados, rode:"
    echo "   bash setup-sslip.sh"
fi
