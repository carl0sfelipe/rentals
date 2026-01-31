# ✅ Checklist: Verificar Status de Produção

## 🎯 Merge Feito! Próximos Passos

Commit: `6ff6d93a` - Merge de dev → main realizado!

---

## 📋 Checklist Pós-Deploy

### 1️⃣ **Verificar GitHub Actions**

```
https://github.com/carl0sfelipe/rentals/actions
```

**O que verificar:**
- [ ] Workflow "Deploy PROD Environment" executou?
- [ ] Status: Verde ✅ ou Vermelho ❌?
- [ ] Se vermelho, ver logs do erro

---

### 2️⃣ **SSH no Servidor - Verificar Deploy**

```bash
ssh seu-usuario@45.55.95.48
cd /var/www/rentals

# Ver branch atual
git branch --show-current

# Ver último commit
git log --oneline -1

# Deve mostrar: 6ff6d93a Merge pull request #13
```

---

### 3️⃣ **Verificar Container PROD**

```bash
# Status do container
docker ps | grep api-prod

# Ver logs recentes
docker compose -f docker-compose.production.yml logs api-prod --tail=50

# Health check
curl http://localhost:3002/health

# Deve retornar: {"status":"ok"}
```

---

### 4️⃣ **Verificar Variáveis de Ambiente**

```bash
# Ver variáveis carregadas no container
docker compose -f docker-compose.production.yml exec api-prod env | grep FRONTEND_URL

# Deve mostrar algo como:
# FRONTEND_URL_PROD=https://seu-dominio.vercel.app
# ou
# FRONTEND_URL=https://seu-dominio.vercel.app
```

**⚠️ Se estiver vazio ou com localhost:**
```bash
# Adicionar ao .env
echo "FRONTEND_URL_PROD=https://seu-dominio-prod.vercel.app" >> .env

# Reiniciar
docker compose -f docker-compose.production.yml restart api-prod

# Verificar novamente
docker compose -f docker-compose.production.yml exec api-prod env | grep FRONTEND_URL
```

---

### 5️⃣ **Verificar Vercel PROD**

**Configurações → Environment Variables**

Verificar `VITE_API_URL`:

**Opção A: Usando IP direto**
```
VITE_API_URL=http://45.55.95.48:3002
```
⚠️ Vai dar Mixed Content! Precisa de solução.

**Opção B: Usando sslip.io com HTTPS** (RECOMENDADO)
```
VITE_API_URL=https://api-45-55-95-48.sslip.io
```
✅ Sem Mixed Content!

**Opção C: Usando Proxy Vercel**
```
VITE_API_URL=/api
```
✅ Sem Mixed Content!

---

### 6️⃣ **Testar Publicação de Anúncio**

1. **Acesse dashboard de produção**
2. **Publique um anúncio**
3. **Verificar logs do backend:**

```bash
# Ver logs em tempo real
docker compose -f docker-compose.production.yml logs -f api-prod
```

**Deve aparecer:**
```
🔍 [DEBUG] Gerando URL pública:
   - NODE_ENV: production
   - FRONTEND_URL: https://seu-dominio.vercel.app
   - URL pública gerada: https://seu-dominio.vercel.app/public/ad-xxx
```

4. **Clicar em "Publicado"**
   - ✅ Deve abrir a URL correta
   - ❌ Se abrir localhost, variável não está configurada

---

### 7️⃣ **Testar no Browser**

1. Abra o site de produção
2. Abra Console (F12)
3. Vá para Network tab
4. Publique um anúncio

**Verificar:**
- [ ] Sem erro de Mixed Content
- [ ] Sem erro de CORS
- [ ] Requisições vão para a URL correta
- [ ] Status 200 nas requisições

---

## 🚨 Problemas Comuns

### Problema 1: Mixed Content Blocked

**Erro no console:**
```
Mixed Content: The page at 'https://...' was loaded over HTTPS,
but requested an insecure resource 'http://45.55.95.48:3002'
```

**Soluções:**

**A) Proxy Vercel (5 min - RÁPIDO)**

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

E use `VITE_API_URL=/api` na Vercel.

**B) sslip.io + SSL (20 min - PROFISSIONAL)**

Execute no servidor:
```bash
cd /var/www/rentals
bash setup-sslip.sh
```

Depois configure na Vercel:
```
VITE_API_URL=https://api-45-55-95-48.sslip.io
```

---

### Problema 2: Variável FRONTEND_URL não carregada

**Sintoma:** Logs mostram localhost ou variável vazia

**Solução:**
```bash
# SSH no servidor
cd /var/www/rentals

# Verificar .env
cat .env | grep FRONTEND_URL

# Se não tiver, adicionar:
nano .env

# Adicionar linha:
FRONTEND_URL_PROD=https://seu-dominio-prod.vercel.app

# Salvar (Ctrl+X, Y, Enter)

# Reiniciar PROD
docker compose -f docker-compose.production.yml restart api-prod

# Verificar se carregou
docker compose -f docker-compose.production.yml exec api-prod env | grep FRONTEND
```

---

### Problema 3: GitHub Actions Falhou

**Verificar logs:**
```
https://github.com/carl0sfelipe/rentals/actions
```

**Erros comuns:**
- SSH falhou → Verificar secrets
- Build falhou → Ver erro nos logs
- Health check falhou → Container não subiu

**Deploy manual:**
```bash
# SSH no servidor
cd /var/www/rentals
git fetch origin
git checkout main
git pull origin main

# Rebuild
docker compose -f docker-compose.production.yml build api-prod

# Restart
docker compose -f docker-compose.production.yml up -d api-prod

# Migrations
docker compose -f docker-compose.production.yml exec -T api-prod npx prisma migrate deploy
```

---

## 📊 Resumo de Diagnóstico Rápido

Execute este comando no servidor para diagnóstico completo:

```bash
cd /var/www/rentals
bash diagnostico-prod.sh
```

---

## ✅ Se Tudo Estiver OK

Você deve ter:
- ✅ Commit 6ff6d93a em main
- ✅ GitHub Actions verde
- ✅ Container api-prod rodando
- ✅ FRONTEND_URL configurada
- ✅ Vercel com VITE_API_URL correta
- ✅ Anúncios gerando URLs corretas
- ✅ URLs públicas abrindo sem erro

---

## 💬 Relate o Status

Me diga o que você encontrou:

1. **GitHub Actions está verde ou vermelho?**
2. **Container api-prod está rodando?**
3. **FRONTEND_URL está configurada no servidor?**
4. **VITE_API_URL na Vercel é qual?**
5. **O que acontece ao publicar um anúncio?**

Com essas respostas, eu identifico exatamente o problema! 🎯
