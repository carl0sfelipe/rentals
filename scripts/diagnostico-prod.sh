#!/bin/bash
# Script de diagnóstico para ambiente de produção
# Execute no servidor via SSH: bash diagnostico-prod.sh

echo "🔍 DIAGNÓSTICO DO AMBIENTE DE PRODUÇÃO"
echo "======================================"
echo ""

# Verificar se está no diretório correto
echo "📁 1. Verificando diretório..."
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Erro: docker-compose.production.yml não encontrado"
    echo "   Execute este script em /var/www/rentals"
    exit 1
fi
echo "✅ Diretório correto"
echo ""

# Verificar status dos containers
echo "🐳 2. Status dos containers..."
docker compose -f docker-compose.production.yml ps
echo ""

# Verificar se api-prod está rodando
echo "🔍 3. Verificando api-prod..."
API_PROD_STATUS=$(docker compose -f docker-compose.production.yml ps -q api-prod)
if [ -z "$API_PROD_STATUS" ]; then
    echo "❌ Container api-prod NÃO está rodando!"
    echo "   Execute: docker compose -f docker-compose.production.yml up -d api-prod"
else
    echo "✅ Container api-prod está rodando"
fi
echo ""

# Verificar variáveis de ambiente
echo "🔧 4. Verificando variáveis de ambiente..."
echo "   Arquivo .env:"
if [ -f ".env" ]; then
    grep -E "^FRONTEND_URL" .env || echo "   ⚠️  FRONTEND_URL não encontrada no .env"
    grep -E "^JWT_SECRET_PROD" .env || echo "   ⚠️  JWT_SECRET_PROD não encontrada no .env"
else
    echo "   ❌ Arquivo .env não encontrado!"
fi
echo ""

# Verificar variáveis dentro do container
echo "🐳 5. Variáveis carregadas no container api-prod..."
if [ ! -z "$API_PROD_STATUS" ]; then
    echo "   NODE_ENV:"
    docker compose -f docker-compose.production.yml exec -T api-prod env | grep "NODE_ENV" || echo "   ❌ Não encontrada"

    echo "   FRONTEND_URL:"
    docker compose -f docker-compose.production.yml exec -T api-prod env | grep "FRONTEND_URL" || echo "   ❌ Não encontrada"

    echo "   PORT:"
    docker compose -f docker-compose.production.yml exec -T api-prod env | grep "^PORT=" || echo "   ❌ Não encontrada"
else
    echo "   ⚠️  Container não está rodando - não é possível verificar"
fi
echo ""

# Testar health check
echo "🏥 6. Testando health check..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health 2>/dev/null)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ API PROD respondendo (HTTP 200)"
    echo "   URL: http://localhost:3002/health"
else
    echo "❌ API PROD não está respondendo (HTTP $HEALTH_RESPONSE)"
    echo "   Esperado: 200, Recebido: $HEALTH_RESPONSE"
fi
echo ""

# Verificar últimos logs
echo "📋 7. Últimos logs do api-prod (últimas 20 linhas)..."
if [ ! -z "$API_PROD_STATUS" ]; then
    docker compose -f docker-compose.production.yml logs --tail=20 api-prod
else
    echo "   ⚠️  Container não está rodando"
fi
echo ""

# Verificar branch git
echo "🌿 8. Verificando branch Git..."
CURRENT_BRANCH=$(git branch --show-current)
LAST_COMMIT=$(git log -1 --oneline)
echo "   Branch atual: $CURRENT_BRANCH"
echo "   Último commit: $LAST_COMMIT"
echo ""

# Resumo
echo "📊 RESUMO DO DIAGNÓSTICO"
echo "======================="

ISSUES=0

if [ -z "$API_PROD_STATUS" ]; then
    echo "❌ Container api-prod não está rodando"
    ISSUES=$((ISSUES + 1))
fi

if ! grep -q "FRONTEND_URL_PROD" .env 2>/dev/null; then
    echo "❌ FRONTEND_URL_PROD não configurada no .env"
    ISSUES=$((ISSUES + 1))
fi

if [ "$HEALTH_RESPONSE" != "200" ]; then
    echo "❌ API não está respondendo no health check"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo "✅ Nenhum problema crítico detectado!"
    echo ""
    echo "🔍 Próximos passos de investigação:"
    echo "   1. Verifique os logs completos: docker compose -f docker-compose.production.yml logs -f api-prod"
    echo "   2. Tente publicar um anúncio e veja o que é gerado"
    echo "   3. Verifique se o frontend (Vercel) tem o vercel.json"
else
    echo ""
    echo "🔧 AÇÕES RECOMENDADAS:"
    echo ""

    if [ -z "$API_PROD_STATUS" ]; then
        echo "1. Iniciar container api-prod:"
        echo "   docker compose -f docker-compose.production.yml up -d api-prod"
        echo ""
    fi

    if ! grep -q "FRONTEND_URL_PROD" .env 2>/dev/null; then
        echo "2. Configurar FRONTEND_URL_PROD no .env:"
        echo "   echo 'FRONTEND_URL_PROD=https://seu-dominio.vercel.app' >> .env"
        echo ""
        echo "3. Reiniciar container após configurar:"
        echo "   docker compose -f docker-compose.production.yml restart api-prod"
        echo ""
    fi

    if [ "$HEALTH_RESPONSE" != "200" ]; then
        echo "4. Verificar logs para erros:"
        echo "   docker compose -f docker-compose.production.yml logs api-prod | tail -50"
        echo ""
    fi
fi

echo ""
echo "💡 Para mais detalhes, execute:"
echo "   docker compose -f docker-compose.production.yml logs -f api-prod"
