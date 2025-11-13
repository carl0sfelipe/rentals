# 🚀 Setup: sslip.io + Let's Encrypt (HTTPS Grátis!)

## 🎯 Solução Perfeita!

Usar **sslip.io** (DNS grátis) + **Let's Encrypt** (SSL grátis) = HTTPS sem comprar domínio!

```
Seu domínio será: https://api-45-55-95-48.sslip.io
                           ↓
                  Resolve para: 45.55.95.48
                           ↓
                  Com SSL grátis! ✅
```

---

## ⚡ Setup Rápido (20 minutos)

### **Passo 1: SSH no Servidor**

```bash
ssh seu-usuario@45.55.95.48
cd /var/www/rentals
```

---

### **Passo 2: Definir Domínio sslip.io**

Seu IP é `45.55.95.48`, então seus domínios serão:

```bash
# Produção
export DOMAIN_PROD="api-45-55-95-48.sslip.io"

# Dev (opcional)
export DOMAIN_DEV="api-dev-45-55-95-48.sslip.io"

# Mostrar para confirmar
echo "Domínio PROD: $DOMAIN_PROD"
echo "Domínio DEV: $DOMAIN_DEV"
```

---

### **Passo 3: Testar se sslip.io Resolve**

```bash
# Testar resolução DNS
nslookup $DOMAIN_PROD

# Ou
ping $DOMAIN_PROD

# Deve mostrar: 45.55.95.48
```

✅ Se resolver, podemos continuar!

---

### **Passo 4: Instalar Certbot**

```bash
# Atualizar sistema
sudo apt update

# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Verificar instalação
certbot --version
```

---

### **Passo 5: Parar NGINX Temporariamente**

```bash
# Parar NGINX para Certbot usar porta 80
docker compose -f docker-compose.production.yml stop nginx
```

---

### **Passo 6: Obter Certificado SSL**

```bash
# Para PRODUÇÃO
sudo certbot certonly --standalone -d api-45-55-95-48.sslip.io

# Se quiser DEV também:
# sudo certbot certonly --standalone -d api-dev-45-55-95-48.sslip.io
```

**Certbot vai perguntar:**
1. Email (para renovações) → digite seu email
2. Aceitar termos → (Y)es
3. Compartilhar email → (N)o

**Se der certo, verá:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/api-45-55-95-48.sslip.io/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/api-45-55-95-48.sslip.io/privkey.pem
```

✅ **SSL obtido!**

---

### **Passo 7: Configurar NGINX com SSL**

Criar novo nginx.conf com SSL:

```bash
cd /var/www/rentals

# Backup do atual
cp nginx.conf nginx.conf.backup

# Criar novo com SSL
nano nginx.conf
```

**Cole este conteúdo:**

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Upstream
    upstream api_prod {
        server api-prod:3000;
    }

    # ========================================================================
    # PRODUÇÃO - HTTPS com sslip.io
    # ========================================================================
    server {
        listen 443 ssl http2;
        server_name api-45-55-95-48.sslip.io;

        # Certificados SSL
        ssl_certificate /etc/letsencrypt/live/api-45-55-95-48.sslip.io/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api-45-55-95-48.sslip.io/privkey.pem;

        # Configurações SSL
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_session_cache shared:SSL:10m;

        # CORS para Vercel
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        # Responder OPTIONS (preflight)
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        location / {
            proxy_pass http://api_prod;
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
        server_name api-45-55-95-48.sslip.io;
        return 301 https://$server_name$request_uri;
    }

    # Servidor padrão (acesso via IP)
    server {
        listen 80 default_server;

        location / {
            return 200 'Use https://api-45-55-95-48.sslip.io';
            add_header Content-Type text/plain;
        }
    }
}
```

**Salvar:** Ctrl+X, Y, Enter

---

### **Passo 8: Atualizar docker-compose.production.yml**

Precisamos montar os certificados no container NGINX:

```bash
nano docker-compose.production.yml
```

Encontre a seção do `nginx:` e adicione o volume dos certificados:

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

**Salvar:** Ctrl+X, Y, Enter

---

### **Passo 9: Reiniciar NGINX**

```bash
# Subir NGINX com nova configuração
docker compose -f docker-compose.production.yml up -d nginx

# Ver logs
docker compose -f docker-compose.production.yml logs nginx

# Deve mostrar: "started successfully"
```

---

### **Passo 10: Testar HTTPS**

```bash
# Testar SSL
curl https://api-45-55-95-48.sslip.io/health

# Deve retornar: {"status":"ok"}
```

✅ **Se funcionou, HTTPS está ativo!**

---

### **Passo 11: Configurar Vercel**

Na Vercel, altere `VITE_API_URL`:

```
❌ Antigo: http://45.55.95.48:3002
✅ Novo:   https://api-45-55-95-48.sslip.io
```

**Faça Redeploy!**

---

### **Passo 12: Testar no Frontend**

1. Abra seu site da Vercel
2. Abra Console (F12)
3. Publique um anúncio
4. **Verifique:**
   - ✅ Sem erro de Mixed Content
   - ✅ Sem erro de CORS
   - ✅ Requisições vão para `https://api-45-55-95-48.sslip.io`

---

## 🔄 Renovação Automática do Certificado

Certificados Let's Encrypt expiram em 90 dias. Configurar renovação automática:

```bash
# Testar renovação (dry-run)
sudo certbot renew --dry-run

# Se funcionou, criar cron job
sudo crontab -e
```

Adicionar esta linha (renovar diariamente):

```
0 0 * * * certbot renew --quiet && docker compose -f /var/www/rentals/docker-compose.production.yml restart nginx
```

---

## ✅ Checklist Final

- [ ] Certbot instalado
- [ ] Certificado SSL obtido para `api-45-55-95-48.sslip.io`
- [ ] nginx.conf configurado com SSL
- [ ] docker-compose.yml montando `/etc/letsencrypt`
- [ ] NGINX reiniciado
- [ ] Teste `curl https://api-45-55-95-48.sslip.io/health` funciona
- [ ] Vercel configurada com `https://api-45-55-95-48.sslip.io`
- [ ] Frontend testado (sem mixed content)
- [ ] Renovação automática configurada

---

## 🚨 Troubleshooting

### Erro: "Failed authorization procedure"

Certifique-se que:
- Porta 80 está aberta no firewall
- NGINX está parado durante certificação
- sslip.io está resolvendo para seu IP

```bash
# Verificar DNS
nslookup api-45-55-95-48.sslip.io

# Verificar porta 80
sudo netstat -tlnp | grep :80
```

### Erro: "nginx: certificate file not found"

```bash
# Verificar certificados
sudo ls -la /etc/letsencrypt/live/

# Se não existir, obter novamente
sudo certbot certonly --standalone -d api-45-55-95-48.sslip.io
```

### Erro: "SSL handshake failed"

```bash
# Testar configuração NGINX
docker compose -f docker-compose.production.yml exec nginx nginx -t

# Ver logs detalhados
docker compose -f docker-compose.production.yml logs nginx | tail -50
```

---

## 🎉 Resultado Final

```
✅ Frontend: https://seu-app.vercel.app (HTTPS)
✅ Backend:  https://api-45-55-95-48.sslip.io (HTTPS)
✅ Sem Mixed Content!
✅ Sem erros CORS!
✅ SSL Grátis!
✅ Domínio Grátis!
```

---

## 📊 Vantagens

- ✅ **100% Grátis** (sem custos)
- ✅ **HTTPS Real** (certificado válido)
- ✅ **Sem comprar domínio**
- ✅ **Renovação automática**
- ✅ **Funciona com IP fixo ou dinâmico**

---

## 🔗 Links

- sslip.io: https://sslip.io
- Let's Encrypt: https://letsencrypt.org
- Certbot: https://certbot.eff.org

---

## 💡 Alternativas

Se sslip.io estiver fora do ar (raro), use:

- **nip.io**: `api-45-55-95-48.nip.io`
- **xip.io**: `api.45.55.95.48.xip.io`
- **traefik.me**: `api-45-55-95-48.traefik.me`

Todos funcionam da mesma forma!
