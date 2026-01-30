#!/bin/bash
#
# Script para setup inicial do projeto no Droplet
# Uso: ./setup-fresh-install.sh
#
# Este script configura tudo do zero:
# - Instala dependências necessárias
# - Configura Docker
# - Configura Nginx + HTTPS
# - Inicia aplicação

set -e

echo "🎉 Setup Inicial - Rentals Backend"
echo "=================================================="

# 1. Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Por favor rode como root: sudo ./setup-fresh-install.sh"
    exit 1
fi

# 2. Atualizar sistema
echo ""
echo "📦 1. Atualizando sistema..."
apt-get update -qq

# 3. Instalar Docker se não tiver
echo ""
echo "🐳 2. Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "   Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "   ✅ Docker instalado!"
else
    echo "   ✅ Docker já instalado"
fi

# 4. Verificar Docker Compose
echo ""
echo "🐳 3. Verificando Docker Compose..."
if ! docker compose version &> /dev/null; then
    echo "   ❌ Docker Compose não encontrado!"
    echo "   Instale com: apt-get install docker-compose-plugin"
    exit 1
else
    echo "   ✅ Docker Compose disponível"
fi

# 5. Criar arquivo .env se não existir
echo ""
echo "⚙️  4. Configurando variáveis de ambiente..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Portas dos bancos de dados
DB_HOST_PORT=5433

# Secrets (MUDE EM PRODUÇÃO!)
JWT_SECRET=$(openssl rand -base64 32)
EOF
    echo "   ✅ Arquivo .env criado"
else
    echo "   ✅ .env já existe"
fi

# 6. Limpar volumes antigos se existirem
echo ""
echo "🧹 5. Limpando volumes antigos (se houver)..."
docker volume ls | grep rentals && {
    read -p "   Encontrados volumes antigos. Remover? (isso apaga dados!) [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose down -v
        docker volume prune -f
        echo "   ✅ Volumes removidos"
    fi
} || echo "   ✅ Nenhum volume antigo encontrado"

# 7. Build e start
echo ""
echo "🔨 6. Building aplicação..."
docker compose up -d --build

# 8. Aguardar banco
echo ""
echo "⏳ 7. Aguardando banco de dados..."
sleep 15

# 9. Rodar migrations
echo ""
echo "📊 8. Criando tabelas do banco..."
docker compose exec -T api npx prisma db push

# 10. Verificar se API subiu
echo ""
echo "🧪 9. Testando API..."
sleep 5
if curl -sf http://localhost:3000 > /dev/null; then
    echo "   ✅ API funcionando!"
else
    echo "   ❌ API não respondeu. Veja os logs:"
    docker compose logs api
    exit 1
fi

# 11. Configurar Nginx + HTTPS
echo ""
echo "🔐 10. Configurar Nginx com HTTPS?"
read -p "   Deseja configurar Nginx + Let's Encrypt agora? [Y/n]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    if [ -f ./setup-nginx-https.sh ]; then
        chmod +x ./setup-nginx-https.sh
        ./setup-nginx-https.sh
    else
        echo "   ⚠️  Script setup-nginx-https.sh não encontrado"
        echo "   Configure manualmente depois"
    fi
fi

# 12. Sucesso!
echo ""
echo "=================================================="
echo "✅ SETUP CONCLUÍDO!"
echo "=================================================="
echo ""
echo "🌐 API rodando em: http://localhost:3000"
echo "📊 Status: docker compose ps"
echo "📋 Logs: docker compose logs -f api"
echo ""
echo "📚 Próximos passos:"
echo "   1. Configure Nginx com HTTPS (se não fez ainda)"
echo "   2. Configure suas variáveis de ambiente em .env"
echo "   3. Crie um usuário via POST /auth/register"
echo ""
echo "🔄 Para atualizar o código depois:"
echo "   git pull origin main"
echo "   ./deploy-update.sh dev"
echo ""
