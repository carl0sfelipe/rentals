# 🚨 Troubleshooting: Produção Não Funciona

## Diagnóstico Rápido

Execute este comando **no servidor** via SSH:

```bash
cd /var/www/rentals
bash diagnostico-prod.sh
```

O script vai verificar automaticamente todos os problemas comuns.

---

## Problemas Mais Comuns

### ❌ Problema 1: FRONTEND_URL_PROD não configurada

**Sintoma**: URLs geradas ainda têm `localhost`

**Verificar:**
```bash
# SSH no servidor
cd /var/www/rentals
cat .env | grep FRONTEND_URL
```

**Solução:**
```bash
# Adicionar variável
echo "FRONTEND_URL_PROD=https://seu-dominio-producao.vercel.app" >> .env

# Reiniciar container
docker compose -f docker-compose.production.yml restart api-prod

# Verificar se carregou
docker compose -f docker-compose.production.yml exec api-prod env | grep FRONTEND_URL
```

---

### ❌ Problema 2: Container api-prod não está rodando

**Verificar:**
```bash
docker compose -f docker-compose.production.yml ps | grep api-prod
```

**Solução:**
```bash
# Verificar logs para ver por que parou
docker compose -f docker-compose.production.yml logs api-prod | tail -50

# Reiniciar
docker compose -f docker-compose.production.yml up -d api-prod

# Verificar health
curl http://localhost:3002/health
```

---

### ❌ Problema 3: GitHub Actions falhou

**Verificar:**
- Acesse: https://github.com/carl0sfelipe/rentals/actions
- Veja se o workflow está vermelho (falhou)

**Logs no GitHub Actions podem mostrar:**
- Erro de SSH (secrets incorretos)
- Erro de build
- Erro de migrations

**Solução:**
```bash
# Se o GitHub Actions falhou, execute manualmente no servidor
cd /var/www/rentals
git fetch origin
git checkout main
git pull origin main

# Rebuild e restart
docker compose -f docker-compose.production.yml build api-prod
docker compose -f docker-compose.production.yml up -d api-prod

# Migrations
docker compose -f docker-compose.production.yml exec -T api-prod npx prisma migrate deploy
```

---

### ❌ Problema 4: vercel.json não foi deployed no frontend

**Sintoma**: Acesso a `/public/ad-xxx` retorna 404 da Vercel

**Verificar:**
```bash
# No seu repositório local
ls -la frontend/vercel.json

# Deve existir com este conteúdo:
# {"rewrites":[{"source":"/(.*)", "destination":"/index.html"}]}
```

**Solução:**
```bash
# Se não existir, está em outra branch
# Fazer merge ou criar o arquivo:
cat > frontend/vercel.json << 'EOF'
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
EOF

# Commit e push
git add frontend/vercel.json
git commit -m "fix: adicionar vercel.json para routing SPA"
git push

# Fazer redeploy na Vercel
cd frontend
vercel --prod
```

---

### ❌ Problema 5: Variável carregada mas ainda gera localhost

**Causa**: Cache ou código antigo

**Solução:**
```bash
# Rebuild forçado
docker compose -f docker-compose.production.yml build --no-cache api-prod
docker compose -f docker-compose.production.yml up -d api-prod

# Verificar versão do código
docker compose -f docker-compose.production.yml exec api-prod cat package.json | grep version
```

---

## Verificação Completa Passo a Passo

### 1. Verificar Backend

```bash
# SSH no servidor
ssh usuario@servidor

cd /var/www/rentals

# Ver status
docker compose -f docker-compose.production.yml ps

# Ver logs (tempo real)
docker compose -f docker-compose.production.yml logs -f api-prod

# Testar health
curl http://localhost:3002/health

# Deve retornar: {"status":"ok"}
```

### 2. Verificar Variáveis

```bash
# Ver .env
cat .env | grep -E "FRONTEND|JWT_SECRET_PROD"

# Ver variáveis no container
docker compose -f docker-compose.production.yml exec api-prod env | grep FRONTEND_URL

# DEVE mostrar algo como:
# FRONTEND_URL_PROD=https://seu-dominio.vercel.app
```

### 3. Testar Publicação

```bash
# Ver logs ao publicar
docker compose -f docker-compose.production.yml logs -f api-prod

# Em outra janela, publique um anúncio no dashboard

# Nos logs deve aparecer:
# 🔍 [DEBUG] Gerando URL pública:
#    - NODE_ENV: production
#    - FRONTEND_URL: https://seu-dominio.vercel.app
#    - URL gerada: https://seu-dominio.vercel.app/public/ad-xxx
```

Se mostrar `localhost`, a variável NÃO está carregada!

### 4. Verificar Frontend

```bash
# Testar acesso direto a uma URL pública
curl -I https://seu-dominio.vercel.app/public/ad-teste

# Deve retornar HTTP 200 (não 404)
```

---

## Checklist de Diagnóstico

Use este checklist para identificar o problema:

```
□ GitHub Actions executou com sucesso (verde)
□ Container api-prod está rodando (docker ps)
□ Health check responde (curl localhost:3002/health)
□ Arquivo .env tem FRONTEND_URL_PROD
□ Container tem a variável (docker exec ... env | grep FRONTEND)
□ Logs mostram URL correta ao publicar
□ frontend/vercel.json existe no repositório
□ Vercel fez deploy recente
□ Acesso a /public/ não dá 404
```

---

## Comandos Úteis

```bash
# Ver todos os containers
docker compose -f docker-compose.production.yml ps

# Ver logs de todos os serviços
docker compose -f docker-compose.production.yml logs

# Restart de serviço específico
docker compose -f docker-compose.production.yml restart api-prod

# Rebuild completo
docker compose -f docker-compose.production.yml build --no-cache api-prod

# Entrar no container (debug)
docker compose -f docker-compose.production.yml exec api-prod sh

# Ver branch e commit
git branch --show-current
git log -1 --oneline

# Verificar se código está atualizado
git fetch origin
git log HEAD..origin/main
```

---

## Se Nada Funcionar

### Solução 1: Restart completo

```bash
cd /var/www/rentals

# Parar tudo
docker compose -f docker-compose.production.yml down

# Rebuild
docker compose -f docker-compose.production.yml build api-prod

# Subir novamente
docker compose -f docker-compose.production.yml up -d

# Verificar
docker compose -f docker-compose.production.yml logs -f api-prod
```

### Solução 2: Rollback para versão anterior

```bash
cd /var/www/rentals

# Ver commits recentes
git log --oneline -5

# Voltar para commit anterior que funcionava
git checkout <commit-hash>

# Rebuild e restart
docker compose -f docker-compose.production.yml build api-prod
docker compose -f docker-compose.production.yml restart api-prod
```

### Solução 3: Verificar se DEV funciona

Se DEV funciona mas PROD não:

```bash
# Comparar variáveis
docker compose -f docker-compose.production.yml exec api-dev env | grep FRONTEND_URL
docker compose -f docker-compose.production.yml exec api-prod env | grep FRONTEND_URL

# Devem ser diferentes:
# DEV:  FRONTEND_URL_DEV=https://rentals-dev.vercel.app
# PROD: FRONTEND_URL_PROD=https://rentals-prod.vercel.app
```

---

## Me diga o que você vê

Para eu te ajudar melhor, me envie:

1. **Output do script de diagnóstico:**
   ```bash
   bash diagnostico-prod.sh
   ```

2. **Logs do api-prod:**
   ```bash
   docker compose -f docker-compose.production.yml logs api-prod | tail -50
   ```

3. **Status do GitHub Actions:**
   - Link do último workflow
   - Se está verde ou vermelho

4. **O que acontece quando você publica um anúncio:**
   - A URL que é gerada
   - Se dá erro ou se abre em localhost

Com essas informações consigo identificar exatamente o problema!
