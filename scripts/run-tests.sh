#!/bin/bash

# Script para executar testes de forma automática
# Uso: ./scripts/run-tests.sh [unit|e2e|all]

set -e

TEST_TYPE=${1:-all}
PROJECT_ROOT=$(dirname $(dirname $(realpath $0)))
cd $PROJECT_ROOT

echo "🧪 Iniciando execução de testes..."
echo "📁 Diretório: $PROJECT_ROOT"
echo "🎯 Tipo: $TEST_TYPE"

# Função para limpar ambiente de teste
cleanup_test_env() {
    echo "🧹 Limpando ambiente de teste..."
    docker compose -f docker-compose.test.yml down -v 2>/dev/null || true
    docker volume rm rentals_pgdata_test 2>/dev/null || true
}

# Função para iniciar banco de teste
start_test_db() {
    echo "🐘 Iniciando banco de dados de teste..."
    docker compose -f docker-compose.test.yml up -d db_test
    
    echo "⏳ Aguardando banco ficar pronto..."
    timeout 60 bash -c 'until docker compose -f docker-compose.test.yml exec db_test pg_isready -U user; do sleep 2; done'
}

# Função para executar migrações
run_migrations() {
    echo "🔄 Executando migrações..."
    DATABASE_URL="postgresql://user:password@localhost:5435/rentals_test" npx prisma migrate deploy
}

# Função para executar testes unitários
run_unit_tests() {
    echo "🧪 Executando testes unitários..."
    DATABASE_URL="postgresql://user:password@localhost:5435/rentals_test" npm run test:unit
}

# Função para executar testes E2E
run_e2e_tests() {
    echo "🎭 Executando testes E2E..."
    DATABASE_URL="postgresql://user:password@localhost:5435/rentals_test" npm run test:e2e
}

# Cleanup no início
cleanup_test_env

# Iniciar banco de teste
start_test_db

# Executar migrações
run_migrations

# Executar testes baseado no parâmetro
case $TEST_TYPE in
    "unit")
        run_unit_tests
        ;;
    "e2e")
        run_e2e_tests
        ;;
    "all")
        echo "🧪 Executando todos os testes..."
        run_unit_tests
        echo ""
        run_e2e_tests
        ;;
    *)
        echo "❌ Tipo de teste inválido: $TEST_TYPE"
        echo "📖 Uso: $0 [unit|e2e|all]"
        exit 1
        ;;
esac

echo "✅ Testes concluídos!"

# Cleanup no final
cleanup_test_env

echo "🎉 Todos os testes executados com sucesso!"
