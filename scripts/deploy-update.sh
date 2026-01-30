#!/bin/bash
#
# Script para atualizar o backend no Droplet após git pull
# Uso: ./deploy-update.sh [dev|test|prod]
#
# Este script automatiza todo o processo de deploy para evitar erros comuns:
# - Para processos Node órfãos
# - Para containers antigos
# - Rebuilda a aplicação
# - Roda migrations do Prisma
# - Valida que tudo está funcionando

set -e  # Para na primeira falha

ENV=${1:-dev}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENV" = "test" ]; then
    COMPOSE_FILE="docker-compose.test.yml"
elif [ "$ENV" = "prod" ]; then
    COMPOSE_FILE="docker-compose.production.yml"
fi

echo "🚀 Deploy/Update Script - Ambiente: $ENV"
echo "=================================================="

# 1. Matar processos Node órfãos (fora do Docker)
echo ""
echo "🔪 1. Limpando processos Node órfãos..."
if pgrep -f "node dist/main.js" > /dev/null; then
    echo "   Encontrados processos Node fora do Docker, matando..."
    sudo pkill -9 -f "node dist/main.js" || true
    sleep 2
else
    echo "   ✅ Nenhum processo órfão encontrado"
fi

# 2. Parar containers
echo ""
echo "🛑 2. Parando containers..."
if [ "$ENV" = "dev" ]; then
    docker compose -f docker-compose.yml down
else
    docker compose -f $COMPOSE_FILE down
fi

# 3. Remover containers antigos de TODOS os ambientes (evita conflito de portas)
echo ""
echo "🧹 3. Removendo containers antigos de outros ambientes..."
docker ps -a | grep "rentals_" | awk '{print $1}' | xargs -r docker rm -f || true

# 4. Rebuildar e subir
echo ""
echo "🔨 4. Rebuilding e iniciando containers..."
docker compose -f $COMPOSE_FILE up -d --build

# 5. Aguardar banco ficar healthy
echo ""
echo "⏳ 5. Aguardando banco de dados ficar pronto..."
sleep 10

MAX_RETRIES=30
RETRY_COUNT=0
DB_SERVICE="db_${ENV}"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose -f $COMPOSE_FILE ps | grep "$DB_SERVICE" | grep "healthy" > /dev/null; then
        echo "   ✅ Banco de dados está pronto!"
        break
    fi
    echo "   Aguardando... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "   ❌ Timeout aguardando banco de dados"
    exit 1
fi

# 6. Rodar migrations
echo ""
echo "📊 6. Rodando migrations do Prisma..."
API_SERVICE="api"
if [ "$ENV" != "dev" ]; then
    API_SERVICE="api-${ENV}"
fi

docker compose -f $COMPOSE_FILE exec -T $API_SERVICE npx prisma migrate deploy || {
    echo "   ⚠️  Migrate deploy falhou, tentando db push..."
    docker compose -f $COMPOSE_FILE exec -T $API_SERVICE npx prisma db push
}

# 7. Verificar tabelas criadas
echo ""
echo "🔍 7. Verificando tabelas no banco..."
docker compose -f $COMPOSE_FILE exec -T $DB_SERVICE psql -U user -d rentals_${ENV} -c "\dt" | grep -E "users|properties|bookings" > /dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Tabelas encontradas no banco!"
else
    echo "   ❌ Tabelas não encontradas! Algo deu errado."
    exit 1
fi

# 8. Reiniciar API para garantir conexão fresca
echo ""
echo "🔄 8. Reiniciando API..."
docker compose -f $COMPOSE_FILE restart $API_SERVICE
sleep 5

# 9. Testar endpoints
echo ""
echo "🧪 9. Testando endpoints..."

PORT=3000
if [ "$ENV" = "test" ]; then
    PORT=3001
elif [ "$ENV" = "prod" ]; then
    PORT=3002
fi

# Testar health
if curl -sf http://localhost:$PORT > /dev/null; then
    echo "   ✅ API respondendo em http://localhost:$PORT"
else
    echo "   ❌ API não está respondendo!"
    echo ""
    echo "📋 Logs da API:"
    docker compose -f $COMPOSE_FILE logs --tail=50 $API_SERVICE
    exit 1
fi

# 10. Mostrar status final
echo ""
echo "=================================================="
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=================================================="
echo ""
echo "📊 Status dos containers:"
docker compose -f $COMPOSE_FILE ps
echo ""
echo "🌐 API disponível em: http://localhost:$PORT"
if [ "$ENV" = "dev" ]; then
    echo "🌐 Nginx HTTPS: https://dev-3000-45-55-95-48.sslip.io"
fi
echo ""
echo "📋 Para ver logs ao vivo:"
echo "   docker compose -f $COMPOSE_FILE logs -f $API_SERVICE"
echo ""
echo "🛑 Para parar tudo:"
echo "   docker compose -f $COMPOSE_FILE down"
echo ""
