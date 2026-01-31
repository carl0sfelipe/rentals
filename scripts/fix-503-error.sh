#!/bin/bash
# fix-503-error.sh
# Script para diagnosticar e corrigir erro 503 (backend não está respondendo)

set -e

echo "🔍 Diagnóstico do erro 503..."
echo ""

# Detectar se é docker-compose (V1) ou docker compose (V2)
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
    echo "✅ Usando docker-compose (V1)"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
    echo "✅ Usando docker compose (V2)"
else
    echo "❌ Docker Compose não encontrado!"
    echo "Instale com: sudo apt install docker-compose-plugin"
    exit 1
fi

echo ""
echo "1️⃣ Verificando status dos containers..."
$DOCKER_COMPOSE -f docker-compose.production.yml ps

echo ""
echo "2️⃣ Verificando logs do backend (api-prod)..."
echo "Últimas 30 linhas:"
$DOCKER_COMPOSE -f docker-compose.production.yml logs --tail=30 api-prod

echo ""
echo "3️⃣ Verificando logs do nginx..."
echo "Últimas 20 linhas:"
$DOCKER_COMPOSE -f docker-compose.production.yml logs --tail=20 nginx

echo ""
echo "4️⃣ Verificando conectividade interna..."
# Testar se o nginx consegue acessar o backend
$DOCKER_COMPOSE -f docker-compose.production.yml exec -T nginx wget -q -O- http://api-prod:3000 || echo "❌ Nginx não consegue acessar api-prod:3000"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 CORREÇÕES SUGERIDAS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

read -p "Reiniciar containers? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔄 Reiniciando containers..."
    $DOCKER_COMPOSE -f docker-compose.production.yml restart api-prod

    echo "⏳ Aguardando 10 segundos..."
    sleep 10

    echo ""
    echo "✅ Testando novamente..."
    curl -I https://api-45-55-95-48.sslip.io/ || echo "Ainda com problema"

    echo ""
    echo "📋 Status atual:"
    $DOCKER_COMPOSE -f docker-compose.production.yml ps
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 COMANDOS ÚTEIS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "# Ver logs em tempo real:"
echo "$DOCKER_COMPOSE -f docker-compose.production.yml logs -f api-prod"
echo ""
echo "# Reiniciar apenas o backend:"
echo "$DOCKER_COMPOSE -f docker-compose.production.yml restart api-prod"
echo ""
echo "# Rebuild completo:"
echo "$DOCKER_COMPOSE -f docker-compose.production.yml up -d --build api-prod"
echo ""
echo "# Verificar variáveis de ambiente:"
echo "$DOCKER_COMPOSE -f docker-compose.production.yml exec api-prod env | grep -E 'DATABASE_URL|FRONTEND_URL|NODE_ENV'"
echo ""
