#!/bin/bash
# deploy-digitalocean.sh
# Script de deploy automatizado para Digital Ocean
# Autor: Claude Code
# Uso: ./deploy-digitalocean.sh [dev|test|prod|all]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para printar com cores
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║     🚀 DEPLOY RENTALS APP - DIGITAL OCEAN 🚀         ║"
echo "║          3 Ambientes: DEV | TEST | PROD              ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se .env existe
if [ ! -f .env ]; then
    print_warning "Arquivo .env não encontrado!"
    print_info "Copiando .env.production.digitalocean para .env..."
    cp .env.production.digitalocean .env
    print_warning "ATENÇÃO: Configure as variáveis no arquivo .env antes de continuar!"
    exit 1
fi

# Verificar argumento
ENVIRONMENT=$1
if [ -z "$ENVIRONMENT" ]; then
    print_error "Uso: ./deploy-digitalocean.sh [dev|test|prod|all]"
    exit 1
fi

# Função para fazer deploy de um ambiente
deploy_environment() {
    local ENV=$1
    print_info "Iniciando deploy do ambiente: $ENV"

    # Build da imagem
    print_info "Building Docker image..."
    docker-compose -f docker-compose.production.yml build api-$ENV

    # Restart do serviço
    print_info "Restarting services..."
    docker-compose -f docker-compose.production.yml up -d api-$ENV db-$ENV

    # Aguardar o serviço ficar pronto
    print_info "Aguardando serviço ficar pronto..."
    sleep 10

    # Executar migrations
    print_info "Running database migrations..."
    docker-compose -f docker-compose.production.yml exec -T api-$ENV npx prisma migrate deploy

    # Verificar health
    print_info "Verificando health do serviço..."
    local PORT
    case $ENV in
        dev) PORT=3000 ;;
        test) PORT=3001 ;;
        prod) PORT=3002 ;;
    esac

    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
        print_success "Deploy do ambiente $ENV concluído com sucesso!"
    else
        print_error "Falha no health check do ambiente $ENV"
        exit 1
    fi
}

# Deploy baseado no argumento
case $ENVIRONMENT in
    dev)
        deploy_environment "dev"
        ;;
    test)
        deploy_environment "test"
        ;;
    prod)
        print_warning "Deploy de PRODUÇÃO! Tem certeza? (y/N)"
        read -r confirmation
        if [ "$confirmation" = "y" ] || [ "$confirmation" = "Y" ]; then
            deploy_environment "prod"
        else
            print_info "Deploy cancelado."
            exit 0
        fi
        ;;
    all)
        print_warning "Deploy de TODOS os ambientes! Tem certeza? (y/N)"
        read -r confirmation
        if [ "$confirmation" = "y" ] || [ "$confirmation" = "Y" ]; then
            deploy_environment "dev"
            deploy_environment "test"
            deploy_environment "prod"

            # Restart nginx
            print_info "Restarting NGINX..."
            docker-compose -f docker-compose.production.yml restart nginx

            print_success "Deploy de todos os ambientes concluído!"
        else
            print_info "Deploy cancelado."
            exit 0
        fi
        ;;
    *)
        print_error "Ambiente inválido! Use: dev, test, prod ou all"
        exit 1
        ;;
esac

echo ""
print_success "Deploy concluído!"
echo ""
print_info "URLs de acesso:"
echo "  • DEV:  http://seu-ip:3000  ou  http://dev.seudominio.com"
echo "  • TEST: http://seu-ip:3001  ou  http://test.seudominio.com"
echo "  • PROD: http://seu-ip:3002  ou  http://seudominio.com"
echo ""
print_info "Logs: docker-compose -f docker-compose.production.yml logs -f api-$ENVIRONMENT"
