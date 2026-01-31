# 🚀 Aplicar Correção no Servidor - Guia Rápido

Você já está no servidor. Siga estes passos:

## 1️⃣ Verificar Git Pull (já foi feito?)

```bash
# Ver branch atual
git branch

# Fazer pull das correções
git pull origin claude/fix-cors-auth-errors-01USjgHDHupfiBKQzrZ9XfK5
```

## 2️⃣ Criar arquivo .env (IMPORTANTE!)

```bash
cat > .env << 'EOF'
# PRODUÇÃO
JWT_SECRET_PROD=seu-jwt-secret-super-secreto-aqui-mude-isso
FRONTEND_URL_PROD=https://rentals-amber.vercel.app
CORS_ORIGINS_PROD=https://rentals-amber.vercel.app,https://rentals-mtzfcuplh-carl0sfelipes-projects.vercel.app

# DESENVOLVIMENTO
JWT_SECRET_DEV=dev-jwt-secret-change-me
FRONTEND_URL_DEV=https://rentals-amber.vercel.app

# TEST
JWT_SECRET_TEST=test-jwt-secret-change-me
FRONTEND_URL_TEST=https://rentals-amber.vercel.app
EOF
```

**⚠️ IMPORTANTE:** Mude `seu-jwt-secret-super-secreto-aqui-mude-isso` para algo seguro!

## 3️⃣ Rodar script de diagnóstico

```bash
# Tornar executável (caso não seja)
chmod +x fix-503-error.sh

# Executar
./fix-503-error.sh
```

O script vai:
- ✅ Detectar automaticamente docker compose V1 ou V2
- 📋 Mostrar status dos containers
- 📝 Mostrar logs recentes
- 🔄 Perguntar se quer reiniciar

## 4️⃣ Ou aplicar correção manualmente

### Opção A: Reiniciar apenas nginx e backend

```bash
docker compose -f docker-compose.production.yml restart nginx api-prod
```

### Opção B: Rebuild completo (se containers não existirem)

```bash
docker compose -f docker-compose.production.yml up -d --build
```

## 5️⃣ Verificar se funcionou

```bash
# Teste 1: Health check
curl https://api-45-55-95-48.sslip.io/health

# Deve retornar algo como: {"status":"ok"}
# NÃO deve retornar 503!

# Teste 2: Ver status dos containers
docker compose -f docker-compose.production.yml ps

# Todos devem estar "Up"

# Teste 3: Ver logs em tempo real
docker compose -f docker-compose.production.yml logs -f api-prod
# Ctrl+C para sair
```

## 6️⃣ Verificar variáveis de ambiente (se ainda não funcionar)

```bash
docker compose -f docker-compose.production.yml exec api-prod env | grep -E 'FRONTEND_URL|CORS_ORIGINS|NODE_ENV'
```

Deve mostrar:
```
NODE_ENV=production
FRONTEND_URL=https://rentals-amber.vercel.app
CORS_ORIGINS=https://rentals-amber.vercel.app,...
```

## ❌ Se ainda não funcionar

### Container não inicia?

```bash
# Ver logs completos
docker compose -f docker-compose.production.yml logs api-prod

# Comum: erro no DATABASE_URL ou JWT_SECRET não configurado
```

### Database não conecta?

```bash
# Verificar se banco está rodando
docker compose -f docker-compose.production.yml ps db-prod

# Deve estar "Up (healthy)"

# Testar conexão
docker compose -f docker-compose.production.yml exec db-prod pg_isready -U rentals_user
```

### Rebuild do zero

```bash
# Parar tudo
docker compose -f docker-compose.production.yml down

# Reconstruir e iniciar
docker compose -f docker-compose.production.yml up -d --build

# Aguardar 30s para containers iniciarem
sleep 30

# Verificar
docker compose -f docker-compose.production.yml ps
curl https://api-45-55-95-48.sslip.io/health
```

## 📋 Checklist

- [ ] Git pull feito
- [ ] Arquivo `.env` criado na raiz do projeto
- [ ] Container api-prod está "Up"
- [ ] Container db-prod está "Up (healthy)"
- [ ] `curl https://api-45-55-95-48.sslip.io/health` retorna 200
- [ ] Frontend consegue fazer login sem erro CORS

## 🆘 Comandos de emergência

```bash
# Ver TUDO que está rodando
docker ps -a

# Ver logs de TUDO
docker compose -f docker-compose.production.yml logs --tail=100

# Parar e remover TUDO (cuidado!)
docker compose -f docker-compose.production.yml down -v

# Iniciar do zero
docker compose -f docker-compose.production.yml up -d --build
```

## ✅ Teste final no frontend

Abra o navegador em `https://rentals-amber.vercel.app` e tente fazer login.

**Não deve mais aparecer:**
- ❌ "CORS request did not succeed"
- ❌ Status code: (null)

**Deve funcionar:**
- ✅ Login completa normalmente
- ✅ Feature flags carregam
- ✅ Sem erros no console
