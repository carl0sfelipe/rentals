# 🚨 Correção: Erro 503 e CORS

## Problema Identificado

**Erro no frontend:**
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading
the remote resource at https://api-45-55-95-48.sslip.io/auth/login.
(Reason: CORS request did not succeed). Status code: (null).
```

**Causa raiz:** Servidor retornando 503 (Service Unavailable) → backend não está respondendo

## O que foi corrigido

### 1. nginx.conf - Removida duplicação de headers CORS
- ❌ **Antes:** nginx e backend ambos adicionavam headers CORS (conflito)
- ✅ **Agora:** Apenas o backend NestJS gerencia CORS

### 2. Variáveis de ambiente atualizadas
- Adicionado `CORS_ORIGINS` ao docker-compose
- Atualizado `.env.production` com URLs do Vercel

### 3. Script de diagnóstico criado
- `fix-503-error.sh` para verificar e reiniciar containers

## Como aplicar a correção

### No servidor DigitalOcean:

```bash
# 1. SSH no servidor
ssh root@45.55.95.48

# 2. Ir para o diretório do projeto
cd ~/rentals  # ou o caminho correto

# 3. Fazer pull das mudanças
git pull origin claude/fix-cors-auth-errors-01USjgHDHupfiBKQzrZ9XfK5

# 4. Criar arquivo .env na raiz do projeto
cat > .env << 'EOF'
# PRODUÇÃO
JWT_SECRET_PROD=seu-jwt-secret-super-secreto-aqui
FRONTEND_URL_PROD=https://rentals-amber.vercel.app
CORS_ORIGINS_PROD=https://rentals-amber.vercel.app,https://rentals-mtzfcuplh-carl0sfelipes-projects.vercel.app

# DESENVOLVIMENTO
JWT_SECRET_DEV=dev-jwt-secret
FRONTEND_URL_DEV=https://rentals-amber.vercel.app

# TEST
JWT_SECRET_TEST=test-jwt-secret
FRONTEND_URL_TEST=https://rentals-amber.vercel.app
EOF

# 5. Recarregar nginx (para aplicar novo nginx.conf)
docker-compose -f docker-compose.production.yml restart nginx

# 6. Verificar se backend está rodando
docker-compose -f docker-compose.production.yml ps

# 7. Se api-prod não estiver rodando, iniciar:
docker-compose -f docker-compose.production.yml up -d api-prod

# 8. Verificar logs
docker-compose -f docker-compose.production.yml logs -f api-prod
```

### Diagnóstico rápido

Use o script criado:

```bash
chmod +x fix-503-error.sh
./fix-503-error.sh
```

## Verificações

### 1. Verificar se containers estão rodando

```bash
docker-compose -f docker-compose.production.yml ps
```

**Esperado:** Todos os containers (api-prod, db-prod, nginx) devem estar "Up"

### 2. Testar API diretamente

```bash
curl https://api-45-55-95-48.sslip.io/health
```

**Esperado:** `{"status":"ok"}` ou similar (não 503!)

### 3. Testar CORS do frontend

No navegador (console):
```javascript
fetch('https://api-45-55-95-48.sslip.io/config/feature-flags', {
  method: 'GET',
  credentials: 'include'
}).then(r => console.log(r))
```

**Esperado:** Resposta 200 (sem erro CORS)

## Possíveis problemas e soluções

### Problema 1: Container api-prod não inicia

```bash
# Ver logs completos
docker-compose -f docker-compose.production.yml logs api-prod

# Possíveis causas:
# - DATABASE_URL incorreta
# - Porta 3002 já em uso
# - Erro no Dockerfile/build
```

**Solução:** Verificar variáveis de ambiente e rebuild
```bash
docker-compose -f docker-compose.production.yml up -d --build api-prod
```

### Problema 2: Database não conecta

```bash
# Verificar se db-prod está saudável
docker-compose -f docker-compose.production.yml exec db-prod pg_isready -U rentals_user

# Verificar logs do banco
docker-compose -f docker-compose.production.yml logs db-prod
```

### Problema 3: CORS ainda bloqueado

Verificar se variáveis de ambiente estão corretas:

```bash
docker-compose -f docker-compose.production.yml exec api-prod env | grep -E 'FRONTEND_URL|CORS_ORIGINS'
```

Deve mostrar:
```
FRONTEND_URL=https://rentals-amber.vercel.app
CORS_ORIGINS=https://rentals-amber.vercel.app,...
```

Se não aparecer, recriar container:
```bash
docker-compose -f docker-compose.production.yml up -d --force-recreate api-prod
```

## Comandos úteis

```bash
# Reiniciar tudo
docker-compose -f docker-compose.production.yml restart

# Rebuild completo
docker-compose -f docker-compose.production.yml up -d --build

# Ver todos os logs em tempo real
docker-compose -f docker-compose.production.yml logs -f

# Parar tudo
docker-compose -f docker-compose.production.yml down

# Iniciar novamente (limpo)
docker-compose -f docker-compose.production.yml up -d
```

## Checklist final

- [ ] Git pull feito
- [ ] Arquivo `.env` criado com variáveis corretas
- [ ] Container api-prod está "Up"
- [ ] `curl https://api-45-55-95-48.sslip.io/health` retorna 200 (não 503)
- [ ] Login funciona no frontend sem erro CORS
- [ ] Feature flags carregam sem erro

## Mudanças técnicas

### nginx.conf
**Antes:**
```nginx
location / {
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        # ... mais headers
        return 204;
    }
    add_header 'Access-Control-Allow-Origin' '$http_origin' always;
    # ... mais headers
    proxy_pass http://api_prod;
}
```

**Depois:**
```nginx
location / {
    # CORS é gerenciado pelo backend NestJS
    # Não adicionar headers aqui para evitar duplicação
    proxy_pass http://api_prod;
}
```

### docker-compose.production.yml
**Adicionado:**
```yaml
environment:
  - CORS_ORIGINS=${CORS_ORIGINS_PROD:-https://rentals-amber.vercel.app}
```

### src/main.ts (backend)
Já estava correto - gerencia CORS para todos os subdomínios `.vercel.app`:
```typescript
app.enableCors({
  origin: (origin, callback) => {
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    // ... outros checks
  }
});
```

## Se ainda não funcionar

1. Verificar firewall do DigitalOcean (portas 80, 443, 3002)
2. Verificar DNS do sslip.io
3. Verificar certificados SSL (`/etc/letsencrypt`)
4. Considerar recrear containers do zero

```bash
# Último recurso - reset completo
docker-compose -f docker-compose.production.yml down -v
docker-compose -f docker-compose.production.yml up -d --build
```
