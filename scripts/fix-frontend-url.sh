#!/bin/bash
# Script para configurar FRONTEND_URL_PROD e reiniciar api-prod

echo "🔧 Configurando FRONTEND_URL_PROD..."

# Verificar se arquivo .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    touch .env
fi

# Adicionar/atualizar variáveis de ambiente
echo ""
echo "📝 Adicionando variáveis ao .env..."

# Remover linhas antigas se existirem
sed -i '/^FRONTEND_URL_PROD=/d' .env
sed -i '/^JWT_SECRET_PROD=/d' .env
sed -i '/^FRONTEND_URL_DEV=/d' .env
sed -i '/^JWT_SECRET_DEV=/d' .env
sed -i '/^FRONTEND_URL_TEST=/d' .env
sed -i '/^JWT_SECRET_TEST=/d' .env

# Adicionar novas variáveis
cat >> .env << 'EOF'

# URLs do Frontend
FRONTEND_URL_PROD=https://rentals-amber.vercel.app
FRONTEND_URL_DEV=http://localhost:5173
FRONTEND_URL_TEST=http://localhost:5173

# JWT Secrets (gerar secrets seguros em produção)
JWT_SECRET_PROD=prod_secret_change_this_in_production_$(openssl rand -hex 32)
JWT_SECRET_DEV=dev_secret_$(openssl rand -hex 16)
JWT_SECRET_TEST=test_secret_$(openssl rand -hex 16)
EOF

echo "✅ Variáveis adicionadas ao .env"
echo ""
echo "📋 Conteúdo do .env:"
cat .env
echo ""

echo "🔄 Reiniciando container api-prod..."
docker compose -f docker-compose.production.yml up -d api-prod

echo ""
echo "⏳ Aguardando container inicializar..."
sleep 10

echo ""
echo "🧪 Testando variáveis de ambiente no container..."
docker compose -f docker-compose.production.yml exec -T api-prod printenv | grep FRONTEND_URL

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "🧪 Teste agora:"
echo "1. Acesse https://rentals-amber.vercel.app"
echo "2. Crie uma propriedade"
echo "3. Publique o anúncio"
echo "4. A URL deve ser: https://rentals-amber.vercel.app/public/..."
