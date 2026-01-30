#!/bin/bash

# Script de deploy para Digital Ocean com múltiplos ambientes

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se o .env existe
if [ ! -f .env ]; then
    error "Arquivo .env não encontrado!"
    exit 1
fi

# Função para deploy de um ambiente específico
deploy_environment() {
    local ENV=$1
    log "Iniciando deploy do ambiente: $ENV"
    
    # Pull das imagens
    log "Baixando imagens Docker..."
    docker compose -f docker-compose.production.yml pull api-$ENV db-$ENV
    
    # Build da imagem da API
    log "Construindo imagem da API..."
    docker compose -f docker-compose.production.yml build api-$ENV
    
    # Subir containers
    log "Iniciando containers..."
    docker compose -f docker-compose.production.yml up -d db-$ENV
    
    # Aguardar banco estar pronto
    log "Aguardando banco de dados ficar pronto..."
    sleep 10
    
    # Subir API
    docker compose -f docker-compose.production.yml up -d api-$ENV
    
    # Aguardar API iniciar
    log "Aguardando API iniciar..."
    sleep 5
    
    # Executar migrations
    log "Executando migrations..."
    docker compose -f docker-compose.production.yml exec -T api-$ENV npx prisma migrate deploy
    
    # Health check
    local PORT
    case $ENV in
        dev) PORT=3000 ;;
        test) PORT=3001 ;;
        prod) PORT=3002 ;;
    esac
    
    log "Verificando saúde da API..."
    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
        log "✅ Ambiente $ENV deployado com sucesso!"
    else
        warning "⚠️  API $ENV pode não estar respondendo corretamente"
    fi
}

# Main
case "$1" in
    dev|test|prod)
        deploy_environment $1
        ;;
    all)
        log "Deployando todos os ambientes..."
        deploy_environment dev
        deploy_environment test
        deploy_environment prod
        log "✅ Deploy de todos os ambientes concluído!"
        ;;
    *)
        echo "Uso: $0 {dev|test|prod|all}"
        exit 1
        ;;
esac
