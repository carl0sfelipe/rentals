# 🛡️ Como Prevenir Erros de CORS e 503

## ⚠️ IMPORTANTE: Leia ANTES de fazer qualquer mudança

Este documento explica como evitar os erros que causaram perda de tempo em dev e prod.

---

## 📋 Checklist ANTES de Subir para Produção

Execute **SEMPRE** antes de fazer deploy:

```bash
./validate-environment.sh
```

Se houver erros, **NÃO suba** os containers até corrigir.

---

## 🚨 Regras de Ouro para NUNCA Mais Ter Problemas

### 1. **CORS: UMA ÚNICA FONTE DE VERDADE**

❌ **NUNCA faça:**
- Adicionar headers `Access-Control-*` no nginx.conf
- Configurar CORS em dois lugares (nginx E backend)

✅ **SEMPRE faça:**
- CORS gerenciado **APENAS** no backend NestJS (`src/main.ts`)
- nginx.conf **SEM headers CORS**

**Por quê?**
- Duplicar headers CORS causa conflito
- Browser rejeita com erro "CORS request did not succeed"
- Parece erro de CORS, mas é erro de configuração

**Configuração correta do nginx.conf:**
```nginx
location / {
    # CORS é gerenciado pelo backend NestJS
    # Não adicionar headers aqui para evitar duplicação

    proxy_pass http://api_prod;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

### 2. **SSL Ciphers: Use APENAS os Compatíveis**

❌ **NUNCA use:**
```nginx
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
```

✅ **SEMPRE use:**
```nginx
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
```

**Por quê?**
- SHA512 ciphers não são suportados no OpenSSL 3.x (nginx:alpine)
- Causa erro: `SSL_CTX_set_cipher_list failed`
- nginx não inicia → backend não recebe requests → erro 503

---

### 3. **Variáveis de Ambiente: SEMPRE Configure**

❌ **NUNCA:**
- Subir containers sem arquivo `.env`
- Deixar `JWT_SECRET` com valor padrão em produção
- Esquecer de mapear `CORS_ORIGINS` no docker-compose

✅ **SEMPRE:**
- Criar `.env` baseado em `.env.production`
- Gerar JWT_SECRET único: `openssl rand -base64 32`
- Verificar mapeamento no docker-compose.production.yml

**Exemplo .env correto:**
```bash
# PRODUÇÃO
JWT_SECRET_PROD=<GERE-UM-NOVO-SECRETO-AQUI>
FRONTEND_URL_PROD=https://rentals-amber.vercel.app
CORS_ORIGINS_PROD=https://rentals-amber.vercel.app,https://rentals-mtzfcuplh-carl0sfelipes-projects.vercel.app

# DESENVOLVIMENTO
JWT_SECRET_DEV=dev-jwt-secret-unique
FRONTEND_URL_DEV=https://rentals-amber.vercel.app

# TEST
JWT_SECRET_TEST=test-jwt-secret-unique
FRONTEND_URL_TEST=https://rentals-amber.vercel.app
```

---

### 4. **Healthchecks: Configure Corretamente**

Healthchecks melhorados detectam problemas mais cedo:

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://localhost:3000/health || exit 1"]
  interval: 15s    # Verifica a cada 15s (era 30s)
  timeout: 5s      # Timeout mais curto
  retries: 5       # Mais tentativas antes de marcar unhealthy
  start_period: 40s
```

---

## 🔍 Diagnóstico Rápido de Problemas

### Erro: "CORS request did not succeed"

**Causa raiz:** Backend não está respondendo (503)

**Diagnóstico:**
```bash
# 1. Verificar se backend está rodando
docker compose -f docker-compose.production.yml ps

# 2. Testar endpoint diretamente
curl https://api-45-55-95-48.sslip.io/health

# 3. Ver logs do nginx
docker compose -f docker-compose.production.yml logs nginx

# 4. Ver logs do backend
docker compose -f docker-compose.production.yml logs api-prod
```

**Soluções comuns:**
1. nginx não inicia → verificar ssl_ciphers
2. Backend não inicia → verificar DATABASE_URL e JWT_SECRET
3. Headers duplicados → remover CORS do nginx.conf

---

### Erro: "SSL_CTX_set_cipher_list failed"

**Causa raiz:** Ciphers incompatíveis com OpenSSL 3.x

**Solução:**
```bash
# Editar nginx.conf e usar ciphers compatíveis (ver seção 2)
vim nginx.conf

# Reiniciar nginx
docker compose -f docker-compose.production.yml restart nginx
```

---

### Erro: "host not found in upstream"

**Causa raiz:** Container referenciado não existe ou não está rodando

**Solução:**
```bash
# Ver quais containers estão rodando
docker compose -f docker-compose.production.yml ps

# Se api-dev não deve existir, remover do nginx.conf
# Ou iniciar o container:
docker compose -f docker-compose.production.yml up -d api-dev
```

---

## 🚀 Workflow Recomendado

### Antes de fazer qualquer mudança em produção:

1. **Validar ambiente:**
   ```bash
   ./validate-environment.sh
   ```

2. **Testar em dev primeiro:**
   ```bash
   docker compose -f docker-compose.yml up -d
   # Testar todas as funcionalidades
   ```

3. **Fazer backup da configuração:**
   ```bash
   cp nginx.conf nginx.conf.backup
   cp .env .env.backup
   ```

4. **Aplicar mudanças gradualmente:**
   ```bash
   # Apenas um serviço por vez
   docker compose -f docker-compose.production.yml up -d --no-deps nginx
   ```

5. **Monitorar logs:**
   ```bash
   docker compose -f docker-compose.production.yml logs -f
   ```

---

## 📝 Scripts Úteis

### Validar ambiente antes de subir
```bash
./validate-environment.sh
```

### Diagnosticar erro 503
```bash
./fix-503-error.sh
```

### Verificar saúde dos containers
```bash
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml exec api-prod wget -qO- http://localhost:3000/health
```

### Ver configuração de CORS do backend
```bash
docker compose -f docker-compose.production.yml exec api-prod env | grep -E 'FRONTEND_URL|CORS_ORIGINS'
```

---

## 🎯 Resumo: O Que Causou os Problemas

### Problema 1: CORS duplicado
- **O que aconteceu:** nginx.conf tinha headers `Access-Control-*` E backend também
- **Sintoma:** "CORS request did not succeed"
- **Solução:** Remover headers do nginx.conf, deixar apenas no backend

### Problema 2: SSL ciphers inválidos
- **O que aconteceu:** Ciphers SHA512 não suportados pelo OpenSSL 3.x
- **Sintoma:** nginx não inicia, retorna 503
- **Solução:** Usar apenas ciphers SHA256/SHA384

### Problema 3: Variáveis de ambiente não configuradas
- **O que aconteceu:** Faltava .env ou variáveis estavam vazias
- **Sintoma:** Backend não conecta ao DB, erros de autenticação
- **Solução:** Criar .env com todas as variáveis necessárias

---

## 🔐 Segurança: Checklist Adicional

- [ ] JWT_SECRET único e forte (não usar valor padrão)
- [ ] CORS configurado apenas para domínios confiáveis
- [ ] Certificados SSL válidos e não expirados
- [ ] Senhas do banco de dados fortes
- [ ] Portas expostas apenas as necessárias
- [ ] Firewall configurado (80, 443, 3002, 5434)

---

## 📞 Troubleshooting Rápido

| Sintoma | Causa Provável | Solução Rápida |
|---------|---------------|----------------|
| CORS error | Backend 503 | `./fix-503-error.sh` |
| 503 Service Unavailable | nginx ou backend down | `docker compose -f docker-compose.production.yml ps` |
| SSL error | Ciphers inválidos | Verificar `ssl_ciphers` no nginx.conf |
| Backend unhealthy | DB não conecta | Verificar `DATABASE_URL` |
| Container restart loop | Healthcheck falha | Ver logs: `docker compose logs api-prod` |

---

## ✅ Validação Final

Antes de considerar o ambiente estável, teste:

```bash
# 1. Health check
curl https://api-45-55-95-48.sslip.io/health
# Deve retornar: {"status":"ok"}

# 2. Feature flags (teste de CORS)
curl https://api-45-55-95-48.sslip.io/config/feature-flags
# Deve retornar JSON

# 3. Login no frontend
# Abrir: https://rentals-amber.vercel.app
# Fazer login - não deve ter erro CORS

# 4. Containers saudáveis
docker compose -f docker-compose.production.yml ps
# Todos devem estar "Up (healthy)"
```

Se **TODOS** os testes passarem, ambiente está OK! ✅

---

**Última atualização:** $(date)
**Mantenha este documento atualizado com novos problemas e soluções!**
