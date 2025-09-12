#!/bin/bash
# seed-dev.sh
# Script para popular dados iniciais no ambiente de desenvolvimento

echo "🌱 Iniciando seed do ambiente de desenvolvimento..."

# Aguarda o banco estar disponível
echo "⏳ Aguardando banco de dados..."
npx wait-port localhost:5433

# Executa as migrations
echo "🔧 Executando migrations..."
npx prisma migrate dev --name init

# Cria usuário administrador
echo "👤 Criando usuário administrador..."
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rentals.com",
    "password": "admin123",
    "name": "Administrador"
  }'

# Faz login para obter token
echo "🔑 Fazendo login..."
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rentals.com",
    "password": "admin123"
  }' | jq -r '.access_token')

# Cria propriedades de exemplo
echo "🏠 Criando propriedades de exemplo..."

curl -X POST http://localhost:3000/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Casa Moderna no Centro",
    "description": "Casa com 3 quartos, 2 banheiros e garagem",
    "price": 250000,
    "location": "Centro, São Paulo, SP",
    "amenities": ["wifi", "parking", "pool"]
  }'

curl -X POST http://localhost:3000/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Apartamento Vista Mar",
    "description": "Apartamento luxuoso com vista para o mar",
    "price": 180000,
    "location": "Copacabana, Rio de Janeiro, RJ",
    "amenities": ["wifi", "air_conditioning", "gym"]
  }'

curl -X POST http://localhost:3000/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Chalé na Serra",
    "description": "Chalé aconchegante para fins de semana",
    "price": 120000,
    "location": "Campos do Jordão, SP",
    "amenities": ["fireplace", "garden", "bbq"]
  }'

echo "✅ Seed concluído! Dados de desenvolvimento criados."
echo "📧 Admin: admin@rentals.com | 🔑 Senha: admin123"
