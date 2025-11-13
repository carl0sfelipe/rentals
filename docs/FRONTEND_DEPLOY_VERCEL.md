# 🚀 Deploy do Front-end no Vercel com Nova URL HTTPS

## ✅ O Que Foi Atualizado?

1. **`frontend/App.jsx`** - Todas as URLs hardcoded substituídas por `API_BASE_URL`
2. **`frontend/.env`** - Criado com `VITE_API_URL=https://dev-3000-45-55-95-48.sslip.io`
3. **`vercel-dev.json`** - Atualizado com a nova URL HTTPS
4. **`frontend/.gitignore`** - Adicionado .env para não commitar dados sensíveis

---

## 🎯 Como Fazer Deploy no Vercel

### Opção 1: Deploy Automático via Git

Se você já tem o projeto conectado ao Vercel:

1. **Faça push das mudanças:**
   ```bash
   git push origin claude/nginx-https-dev-environment-011CV52shdxTufCktuvYCWSW
   ```

2. **Acesse o Vercel Dashboard:**
   - https://vercel.com/dashboard

3. **Configure a Variável de Ambiente:**
   - Vá em **Settings** → **Environment Variables**
   - Adicione:
     - **Name:** `VITE_API_URL`
     - **Value:** `https://dev-3000-45-55-95-48.sslip.io`
     - **Environments:** Development, Preview, Production (selecione todos)

4. **Faça Redeploy:**
   - Vá em **Deployments**
   - Clique nos 3 pontinhos do último deploy
   - Clique em **Redeploy**

---

### Opção 2: Deploy Manual via CLI

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Deploy (na raiz do projeto)
vercel --prod
```

Quando perguntado, confirme as configurações.

---

## 🧪 Testar o Deploy

1. **Abra o front-end no Vercel:**
   ```
   https://rentals-dev-zeta.vercel.app
   ```

2. **Faça login**

3. **Tente publicar um anúncio**

4. **Verifique no Console do Navegador:**
   - Abra as DevTools (F12)
   - Vá na aba **Network**
   - Veja se as requisições estão indo para `https://dev-3000-45-55-95-48.sslip.io`
   - **NÃO deve ter mais erros de Mixed Content!** ✅

---

## 🔧 Verificar Variáveis de Ambiente no Vercel

### Via Dashboard:

1. Acesse seu projeto no Vercel
2. **Settings** → **Environment Variables**
3. Verifique se `VITE_API_URL` está configurada com:
   ```
   https://dev-3000-45-55-95-48.sslip.io
   ```

### Via CLI:

```bash
vercel env ls
```

---

## 📝 Arquivos Importantes

### `frontend/.env` (Local - NÃO commitado)
```bash
VITE_API_URL=https://dev-3000-45-55-95-48.sslip.io
```

### `frontend/.env.example` (Commitado para documentação)
```bash
# API Configuration
# Para desenvolvimento local:
# VITE_API_URL=http://localhost:3000

# Para desenvolvimento com HTTPS (DigitalOcean):
# VITE_API_URL=https://dev-3000-45-55-95-48.sslip.io

# Para produção:
# VITE_API_URL=https://api.seudominio.com
```

### `vercel-dev.json` (Configuração do Vercel)
```json
{
  "env": {
    "VITE_API_URL": "https://dev-3000-45-55-95-48.sslip.io"
  },
  "build": {
    "env": {
      "VITE_API_URL": "https://dev-3000-45-55-95-48.sslip.io"
    }
  }
}
```

---

## 🐛 Troubleshooting

### Erro: "Mixed Content Blocked"

**Causa:** Variável de ambiente não foi configurada no Vercel.

**Solução:**
1. Vá em **Settings** → **Environment Variables**
2. Adicione `VITE_API_URL` com valor `https://dev-3000-45-55-95-48.sslip.io`
3. Faça **Redeploy**

---

### Erro: "Failed to fetch" / "Network Error"

**Causas possíveis:**
1. Backend não está rodando no Droplet
2. Nginx não está configurado corretamente
3. Certificado SSL expirado

**Verificar:**
```bash
# No Droplet
sudo systemctl status nginx
curl https://dev-3000-45-55-95-48.sslip.io
```

---

### Front-end ainda chama `localhost:3000`

**Causa:** Variável de ambiente não foi lida corretamente.

**Solução:**
1. Verifique se `VITE_API_URL` está configurada no Vercel
2. Verifique se o build está usando `vercel-dev.json`
3. Faça **Redeploy** completo (não incremental)

---

## ✅ Checklist de Deploy

- [ ] Código commitado e pushed para GitHub
- [ ] Variável `VITE_API_URL` configurada no Vercel
- [ ] Deploy feito no Vercel
- [ ] Front-end acessível em `https://rentals-dev-zeta.vercel.app`
- [ ] Backend acessível em `https://dev-3000-45-55-95-48.sslip.io`
- [ ] Console do navegador sem erros de Mixed Content
- [ ] Login funcionando
- [ ] Publicação de anúncios funcionando

---

## 🎉 Resultado Final

**Antes:**
```
❌ HTTPS Front-end → HTTP Backend = BLOQUEADO
```

**Depois:**
```
✅ HTTPS Front-end → HTTPS Backend = FUNCIONA!
```

**Fluxo completo:**
```
Navegador → https://rentals-dev-zeta.vercel.app (Vercel)
             ↓
          https://dev-3000-45-55-95-48.sslip.io (Nginx)
             ↓
          http://localhost:3000 (Node.js no Droplet)
```

---

## 💡 Próximos Passos

Quando comprar um domínio próprio:

1. Atualizar DNS: `dev.api.meudominio.com → 45.55.95.48`
2. Atualizar Nginx: `sudo nano /etc/nginx/sites-available/dev-api`
3. Obter novo certificado: `sudo certbot --nginx -d dev.api.meudominio.com`
4. Atualizar Vercel: `VITE_API_URL=https://dev.api.meudominio.com`
5. Redeploy no Vercel

---

**Tudo pronto para deploy! 🚀**
