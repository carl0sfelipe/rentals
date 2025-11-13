# 🔧 Corrigir Variáveis de Ambiente na Vercel

## 🎯 Problema Identificado

A variável `VITE_API_URL` no Vercel está apontando para o backend **DEV** (porta 3000) ao invés de **PROD** (porta 3002).

```
❌ Errado:  VITE_API_URL=http://45.55.95.48:3000  (DEV)
✅ Correto: VITE_API_URL=http://45.55.95.48:3002  (PROD)
```

---

## 📋 Passo a Passo para Corrigir

### **Passo 1: Acessar Configurações da Vercel**

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto de **PRODUÇÃO**
3. Vá em **Settings** (Configurações)
4. Clique em **Environment Variables** (Variáveis de Ambiente)

---

### **Passo 2: Editar VITE_API_URL**

Você deve ter uma variável chamada `VITE_API_URL`. Vamos corrigir:

#### **Opção A: Se você tem PROJETOS SEPARADOS na Vercel**

Se você tem 3 projetos diferentes (rentals-dev, rentals-test, rentals-prod):

**Para o projeto de PRODUÇÃO:**
```
VITE_API_URL = http://45.55.95.48:3002
```

**Para o projeto de DEV:**
```
VITE_API_URL = http://45.55.95.48:3000
```

**Para o projeto de TEST:**
```
VITE_API_URL = http://45.55.95.48:3001
```

#### **Opção B: Se você tem UM PROJETO com múltiplos ambientes**

Se você usa um projeto com branches diferentes:

1. Edite a variável `VITE_API_URL`
2. Configure por ambiente:

| Ambiente | Valor |
|----------|-------|
| Production (main) | `http://45.55.95.48:3002` |
| Preview (dev) | `http://45.55.95.48:3000` |
| Development | `http://45.55.95.48:3000` |

**Como fazer:**
- Clique em **Edit** na variável
- Marque os checkboxes apropriados:
  - ✅ **Production** → use porta 3002
  - ✅ **Preview** → use porta 3000

---

### **Passo 3: Salvar e Fazer Redeploy**

Após alterar a variável:

1. **Salve** as alterações
2. **Redeploy** o projeto:
   - Vá em **Deployments**
   - Clique nos 3 pontinhos do último deploy
   - Clique em **Redeploy**

OU via CLI:

```bash
cd frontend
vercel --prod
```

---

### **Passo 4: Verificar se Funcionou**

Após o redeploy:

1. **Abra o console do navegador** (F12)
2. **Vá para Network tab**
3. **Publique um anúncio**
4. **Veja as requisições** - devem ir para `:3002`

Ou teste direto:

```bash
# Ver código fonte deployado (procure por VITE_API_URL)
curl https://seu-dominio.vercel.app/_next/static/chunks/main-*.js | grep -o "http://[^\"]*:300[0-9]"

# Deve mostrar: http://45.55.95.48:3002
```

---

## 🔐 IMPORTANTE: Usar HTTPS (Recomendado)

Depois de corrigir, considere usar HTTPS com NGINX no Digital Ocean:

### Configuração Ideal:

**Ao invés de:**
```
VITE_API_URL=http://45.55.95.48:3002
```

**Use um domínio com NGINX:**
```
VITE_API_URL=https://api.seudominio.com
```

E configure NGINX para rotear:
- `api.seudominio.com` → `localhost:3002` (api-prod)
- `api-dev.seudominio.com` → `localhost:3000` (api-dev)

**Vantagens:**
- ✅ HTTPS (seguro)
- ✅ Mais profissional
- ✅ Evita problemas de CORS
- ✅ Não expõe portas diretamente

---

## 📊 Resumo das Portas

Seu servidor Digital Ocean:

| Ambiente | Porta | Container | URL Atual |
|----------|-------|-----------|-----------|
| DEV | 3000 | api-dev | http://45.55.95.48:3000 |
| TEST | 3001 | api-test | http://45.55.95.48:3001 |
| **PROD** | **3002** | **api-prod** | **http://45.55.95.48:3002** |

---

## ✅ Checklist de Verificação

Após corrigir, verifique:

- [ ] Variável `VITE_API_URL` na Vercel está com porta 3002
- [ ] Redeploy feito na Vercel
- [ ] Frontend carregado sem erros (F12 → Console)
- [ ] Requisições vão para `:3002` (F12 → Network)
- [ ] Ao publicar anúncio, URL gerada está correta
- [ ] Ao clicar em "Publicado", abre sem 404

---

## 🚨 Se Ainda Não Funcionar

### Problema 1: CORS Error

Se você ver erro de CORS no console:

```
Access to fetch at 'http://45.55.95.48:3002' from origin 'https://seu-dominio.vercel.app'
has been blocked by CORS policy
```

**Solução:**

SSH no servidor e edite `src/main.ts`:

```typescript
app.enableCors({
  origin: [
    'https://seu-dominio.vercel.app',
    'http://45.55.95.48:3002',
  ],
  credentials: true,
});
```

Depois:
```bash
git add src/main.ts
git commit -m "fix: add Vercel domain to CORS"
git push origin main

# GitHub Actions fará deploy automático
```

### Problema 2: Variável Não Está Carregando

Se após redeploy a variável ainda está errada:

1. **Limpe o cache da Vercel:**
   - Settings → General → Clear Build Cache

2. **Force rebuild:**
   ```bash
   vercel --prod --force
   ```

3. **Verifique se salvou corretamente:**
   - Vá em Environment Variables
   - Veja se a variável tem o valor correto
   - Verifique os checkboxes de Production

---

## 💡 Dica: Variáveis Específicas por Ambiente

Se você quer algo mais robusto, use variáveis específicas:

```
VITE_API_URL_DEV=http://45.55.95.48:3000
VITE_API_URL_TEST=http://45.55.95.48:3001
VITE_API_URL_PROD=http://45.55.95.48:3002
```

E no código (App.jsx):

```javascript
const API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_API_URL_PROD
    : import.meta.env.VITE_API_URL_DEV || 'http://localhost:3000';
```

---

## 📞 Me Avise Quando Corrigir

Depois de:
1. ✅ Alterar variável na Vercel
2. ✅ Fazer redeploy
3. ✅ Testar

Me diga se funcionou! Se ainda houver problema, me envie:
- Screenshot do console (F12)
- Screenshot da Network tab ao publicar anúncio
- A URL que está sendo gerada
