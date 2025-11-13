#!/bin/bash
# validate-environment.sh
# Script para validar ambiente antes de subir containers
# Previne erros de CORS, 503 e problemas de configuração

set -e

echo "🔍 Validando ambiente de produção..."
echo ""

ERRORS=0
WARNINGS=0

# Cores para output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

error() {
    echo -e "${RED}❌ ERRO:${NC} $1"
    ((ERRORS++))
}

warning() {
    echo -e "${YELLOW}⚠️  AVISO:${NC} $1"
    ((WARNINGS++))
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

# ============================================================================
# 1. Verificar se .env existe e tem variáveis necessárias
# ============================================================================
echo "1️⃣ Verificando arquivo .env..."

if [ ! -f .env ]; then
    error "Arquivo .env não encontrado na raiz do projeto"
    echo "   Crie o arquivo .env baseado em .env.production"
else
    success "Arquivo .env encontrado"

    # Verificar variáveis críticas
    required_vars=("JWT_SECRET_PROD" "FRONTEND_URL_PROD" "CORS_ORIGINS_PROD")

    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            error "Variável ${var} não encontrada no .env"
        elif grep -q "^${var}=\s*$" .env; then
            error "Variável ${var} está vazia no .env"
        else
            success "Variável ${var} configurada"
        fi
    done

    # Avisar sobre JWT_SECRET padrão
    if grep -q "your-super-secret-jwt-key-for-production-change-this" .env; then
        warning "JWT_SECRET_PROD está usando valor padrão. ALTERE para produção!"
    fi
fi

echo ""

# ============================================================================
# 2. Verificar nginx.conf
# ============================================================================
echo "2️⃣ Verificando nginx.conf..."

if [ ! -f nginx.conf ]; then
    error "Arquivo nginx.conf não encontrado"
else
    # Verificar se tem headers CORS duplicados (não deve ter!)
    if grep -q "Access-Control-Allow-Origin" nginx.conf; then
        error "nginx.conf contém headers CORS! Isso causa conflito com o backend."
        echo "   CORS deve ser gerenciado APENAS pelo backend NestJS."
    else
        success "nginx.conf sem headers CORS (correto!)"
    fi

    # Verificar SSL ciphers problemáticos
    if grep -q "AES256-GCM-SHA512\|AES256-GCM-SHA512" nginx.conf; then
        error "nginx.conf contém ciphers incompatíveis com OpenSSL 3.x"
        echo "   Ciphers SHA512 não são suportados. Use SHA256/SHA384."
    else
        success "SSL ciphers compatíveis"
    fi

    # Verificar se tem upstream configurado
    if ! grep -q "upstream api_prod" nginx.conf; then
        error "nginx.conf não tem upstream api_prod configurado"
    else
        success "Upstream api_prod configurado"
    fi
fi

echo ""

# ============================================================================
# 3. Verificar docker-compose.production.yml
# ============================================================================
echo "3️⃣ Verificando docker-compose.production.yml..."

if [ ! -f docker-compose.production.yml ]; then
    error "Arquivo docker-compose.production.yml não encontrado"
else
    # Verificar se variáveis de ambiente estão mapeadas
    if ! grep -q "CORS_ORIGINS=\${CORS_ORIGINS_PROD" docker-compose.production.yml; then
        warning "CORS_ORIGINS não está mapeada no docker-compose para api-prod"
    else
        success "CORS_ORIGINS mapeada"
    fi

    # Verificar healthcheck do backend
    if ! grep -q "healthcheck:" docker-compose.production.yml; then
        warning "Sem healthcheck configurado para api-prod"
    else
        success "Healthcheck configurado"
    fi
fi

echo ""

# ============================================================================
# 4. Verificar se Docker Compose está instalado
# ============================================================================
echo "4️⃣ Verificando Docker Compose..."

if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
    success "docker-compose (V1) encontrado"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
    success "docker compose (V2) encontrado"
else
    error "Docker Compose não encontrado! Instale com: sudo apt install docker-compose-plugin"
fi

echo ""

# ============================================================================
# 5. Verificar portas em uso
# ============================================================================
echo "5️⃣ Verificando portas..."

check_port() {
    local port=$1
    local service=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || ss -tulpn | grep -q ":$port " 2>/dev/null; then
        warning "Porta $port já está em uso (esperado para $service)"
    else
        success "Porta $port disponível para $service"
    fi
}

check_port 80 "nginx (HTTP)"
check_port 443 "nginx (HTTPS)"
check_port 3002 "api-prod"
check_port 5434 "db-prod"

echo ""

# ============================================================================
# 6. Verificar certificados SSL (se aplicável)
# ============================================================================
echo "6️⃣ Verificando certificados SSL..."

if [ -d "/etc/letsencrypt/live" ]; then
    if [ -f "/etc/letsencrypt/live/api-45-55-95-48.sslip.io/fullchain.pem" ]; then
        success "Certificado SSL encontrado para api-45-55-95-48.sslip.io"

        # Verificar validade
        expiry=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/api-45-55-95-48.sslip.io/fullchain.pem 2>/dev/null | cut -d= -f2)
        if [ ! -z "$expiry" ]; then
            echo "   Expira em: $expiry"
        fi
    else
        warning "Certificado SSL não encontrado em /etc/letsencrypt/"
    fi
else
    warning "Diretório /etc/letsencrypt/ não encontrado"
fi

echo ""

# ============================================================================
# 7. Verificar backend (src/main.ts) - CORS configurado corretamente
# ============================================================================
echo "7️⃣ Verificando configuração de CORS no backend..."

if [ -f "src/main.ts" ]; then
    if grep -q "app.enableCors" src/main.ts; then
        success "CORS habilitado no backend"

        if grep -q ".vercel.app" src/main.ts; then
            success "CORS aceita subdomínios .vercel.app"
        else
            warning "CORS pode não estar configurado para aceitar Vercel"
        fi
    else
        error "CORS não está habilitado no backend src/main.ts!"
    fi
else
    warning "Arquivo src/main.ts não encontrado (pulando verificação)"
fi

echo ""

# ============================================================================
# RESUMO
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DA VALIDAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Tudo OK! Ambiente pronto para produção.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS aviso(s) encontrado(s), mas pode continuar.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erro(s) crítico(s) encontrado(s)!${NC}"
    echo -e "${YELLOW}   $WARNINGS aviso(s) adicional(is).${NC}"
    echo ""
    echo "Corrija os erros antes de subir os containers!"
    exit 1
fi
