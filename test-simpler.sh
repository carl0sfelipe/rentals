#!/bin/bash

echo "🧪 Executando testes (versão super simples)..."

# Para o banco de dev se estiver rodando
docker compose down > /dev/null 2>&1

# Sobe só o banco de testes
echo "🐘 Subindo banco de teste..."
docker compose -f docker-compose.test.yml up -d

echo "⏳ Aguardando banco..."
sleep 5

# Executa as migrações
echo "🔄 Migrações..."
DATABASE_URL="postgresql://user:pass@localhost:5435/rentals_test" npx prisma migrate deploy

# Roda os testes forçando as variáveis de ambiente
echo "🧪 Rodando testes..."
NODE_ENV=test DATABASE_URL="postgresql://user:pass@localhost:5435/rentals_test" npm run test:unit

echo "✅ Testes finalizados!"
