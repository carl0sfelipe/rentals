# 🔐 Solução: Configurar HTTPS no Backend

## 🚨 Problema: Mixed Content Blocked

```
❌ Frontend (Vercel): HTTPS
❌ Backend (Digital Ocean): HTTP
→ Navegador BLOQUEIA por segurança!
```

## ✅ Soluções (Escolha uma)

### 🎯 **Solução 1: HTTPS com Domínio + Let's Encrypt** (RECOMENDADA)

Use um domínio e configure SSL gratuito.

### ⚡ **Solução 2: Proxy via Vercel Rewrites** (RÁPIDA)

Use a Vercel como proxy - sem precisar configurar SSL.

---

# 🚀 Solução 1: HTTPS com Domínio (Melhor para Produção)

## Pré-requisitos

1. **Ter um domínio** (ex: seudominio.com)
2. **Configurar DNS** apontando para seu servidor:
   ```
   A    api.seudominio.com       → 45.55.95.48
   A    api-dev.seudominio.com   → 45.55.95.48
   ```

## Passo 1: Instalar Certbot (SSL Gratuito)

SSH no servidor:

```bash
ssh seu-usuario@45.55.95.48

# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

## Passo 2: Obter Certificado SSL

```bash
# Parar NGINX temporariamente
docker compose -f docker-compose.production.yml stop nginx

# Obter certificado
sudo certbot certonly --standalone -d api.seudominio.com

# Seguir instruções (email, aceitar termos, etc)
```

Certificados serão salvos em:
```
/etc/letsencrypt/live/api.seudominio.com/fullchain.pem
/etc/letsencrypt/live/api.seudominio.com/privkey.pem
```

## Passo 3: Configurar NGINX com HTTPS

Edite `nginx.conf`:

```bash
cd /var/www/rentals
nano nginx.conf
```

Adicione o bloco HTTPS para PRODUÇÃO:

```nginx
# ========================================================================
# SERVIDOR PRODUÇÃO - HTTPS
# ========================================================================
server {
    listen 443 ssl http2;
    server_name api.seudominio.com;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/api.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.seudominio.com/privkey.pem;

    # Configurações SSL (segurança)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    location / {
        proxy_pass http://api-prod:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirecionar HTTP → HTTPS
server {
    listen 80;
    server_name api.seudominio.com;
    return 301 https://$server_name$request_uri;
}
```

## Passo 4: Montar Certificados no Docker

Edite `docker-compose.production.yml`:

```yaml
nginx:
  container_name: rentals_nginx
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro  # ← ADICIONAR ESTA LINHA
    - ./ssl:/etc/nginx/ssl:ro
  depends_on:
    - api-dev
    - api-test
    - api-prod
  restart: always
```

## Passo 5: Reiniciar NGINX

```bash
docker compose -f docker-compose.production.yml up -d nginx
```

## Passo 6: Atualizar Vercel

Na Vercel, altere `VITE_API_URL`:

```
❌ Antigo: http://45.55.95.48:3002
✅ Novo:   https://api.seudominio.com
```

Faça redeploy!

## Passo 7: Testar

```bash
# Testar HTTPS
curl https://api.seudominio.com/health

# Deve retornar: {"status":"ok"}
```

---

# ⚡ Solução 2: Proxy via Vercel Rewrites (Mais Rápido)

Se você não quer configurar domínio/SSL agora, use a Vercel como proxy.

## Passo 1: Configurar Vercel Rewrites

Edite `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://45.55.95.48:3002/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Passo 2: Atualizar Frontend

No `frontend/App.jsx`, altere:

```javascript
// ❌ Antigo:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ✅ Novo:
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

## Passo 3: Remover VITE_API_URL da Vercel

1. Vá em Settings → Environment Variables
2. **Delete** a variável `VITE_API_URL`
3. Ou mude para: `VITE_API_URL=/api`

## Passo 4: Commit e Deploy

```bash
cd frontend
git add vercel.json
git commit -m "fix: usar proxy da Vercel para evitar mixed content"
git push origin main

# Fazer redeploy
vercel --prod
```

## Como Funciona

```
Requisição: https://seu-dominio.vercel.app/api/auth/login
           ↓
Vercel rewrites para: http://45.55.95.48:3002/auth/login
           ↓
Browser recebe resposta via HTTPS ✅
```

**Vantagens:**
- ✅ Não precisa configurar SSL no backend
- ✅ Rápido de implementar
- ✅ Sem mixed content

**Desvantagens:**
- ⚠️  Todas as requisições passam pela Vercel
- ⚠️  Pode ter latência adicional
- ⚠️  Limites de bandwidth da Vercel

---

# 📊 Comparação das Soluções

| Aspecto | HTTPS + Domínio | Vercel Proxy |
|---------|----------------|--------------|
| **Complexidade** | Média | Baixa |
| **Tempo setup** | 30-60 min | 5-10 min |
| **Performance** | Melhor | Boa |
| **Custo domínio** | Sim (~$10/ano) | Não |
| **Profissional** | Sim | Moderado |
| **Escalabilidade** | Melhor | Limitada |

---

# 🎯 Recomendação

- **Para Produção Real**: Solução 1 (HTTPS + Domínio)
- **Para Testar Rápido**: Solução 2 (Vercel Proxy)

---

# 🚨 CORS: Configurar no Backend

Independente da solução, atualize o CORS no backend.

Edite `src/main.ts`:

```typescript
app.enableCors({
  origin: [
    'https://seu-dominio.vercel.app',
    'https://api.seudominio.com', // Se usar Solução 1
    'http://localhost:5173', // Dev local
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

Commit e push:

```bash
git add src/main.ts
git commit -m "fix: atualizar CORS para domínios de produção"
git push origin main

# Deploy automático via GitHub Actions
```

---

# ✅ Checklist

## Solução 1 (HTTPS):
- [ ] Domínio configurado (DNS A record)
- [ ] Certbot instalado
- [ ] Certificado SSL obtido
- [ ] nginx.conf atualizado com bloco HTTPS
- [ ] docker-compose.yml montando /etc/letsencrypt
- [ ] NGINX reiniciado
- [ ] VITE_API_URL na Vercel atualizada para https://api.seudominio.com
- [ ] CORS atualizado no backend
- [ ] Redeploy frontend
- [ ] Teste: abrir site e verificar requisições (F12)

## Solução 2 (Proxy):
- [ ] vercel.json com rewrites configurado
- [ ] App.jsx usando `/api` ao invés de URL completa
- [ ] VITE_API_URL removida ou setada como `/api`
- [ ] Commit e push
- [ ] Redeploy na Vercel
- [ ] Teste: verificar requisições vão para /api

---

# 🆘 Problemas?

### Erro: SSL Certificate not found

```bash
# Verificar certificados
sudo ls -la /etc/letsencrypt/live/

# Se não existir, obter novamente
sudo certbot certonly --standalone -d api.seudominio.com
```

### Erro: NGINX não inicia

```bash
# Ver logs
docker compose -f docker-compose.production.yml logs nginx

# Testar configuração
docker compose -f docker-compose.production.yml exec nginx nginx -t
```

### Erro: Still mixed content

Verifique no console (F12) qual URL está sendo chamada:
- Se ainda mostra `http://`, a variável não foi atualizada
- Limpe cache da Vercel e faça redeploy

---

# 📞 Qual Solução Você Vai Usar?

Me diga qual solução você prefere e eu te ajudo a implementar! 🚀
