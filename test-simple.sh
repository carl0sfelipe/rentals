#!/bin/bash

# Script simples para rodar testes
set -e

echo "🧪 Executando TODOS os testes..."

# Parar qualquer container anterior
echo "🛑 Parando containers anteriores..."
docker compose down > /dev/null 2>&1 || true
docker compose -f docker-compose.test.yml down > /dev/null 2>&1 || true

# Subir banco de teste
echo "🐘 Subindo banco de teste..."
docker compose -f docker-compose.test.yml up -d db_test

# Aguardar banco estar saudável
echo "⏳ Aguardando banco estar pronto..."
timeout=60
counter=0
until docker compose -f docker-compose.test.yml exec db_test pg_isready -U user > /dev/null 2>&1; do
  sleep 2
  counter=$((counter + 2))
  if [ $counter -ge $timeout ]; then
    echo "❌ Timeout aguardando banco de dados"
    exit 1
  fi
done
echo "✅ Banco de dados pronto!"

# Executar migrações
echo "🔄 Migrações..."
DATABASE_URL="postgresql://user:password@localhost:5435/rentals_test" npx prisma migrate deploy

# Executar testes
echo "🧪 Rodando TODOS os testes..."
DATABASE_URL="postgresql://user:password@localhost:5435/rentals_test" NODE_ENV=test npm run test:unit

echo "✅ TODOS os testes concluídos!"
