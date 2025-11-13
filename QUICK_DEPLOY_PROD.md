# ⚡ Deploy Rápido para Produção

## 🎯 Guia de 5 Minutos

### Passo 1: Criar PR (2 min)

**Acesse este link:**
```
https://github.com/carl0sfelipe/rentals/compare/main...dev
```

**Configure:**
- Base: `main`
- Compare: `dev`
- Título: "Release: Correção de URLs públicas para produção"
- **Criar e fazer Merge**

### Passo 2: Aguardar Deploy Automático (3-5 min)

**Acompanhe:**
```
https://github.com/carl0sfelipe/rentals/actions
```

Aguarde workflow "Deploy PROD Environment" ficar verde ✅

### Passo 3: Configurar URL do Frontend

**SSH no servidor:**
```bash
ssh seu-usuario@seu-servidor

cd /var/www/rentals
nano .env
```

**Adicione:**
```bash
FRONTEND_URL_PROD=https://seu-dominio-producao.vercel.app
```

**Salve** (Ctrl+X, Y, Enter) e **reinicie:**
```bash
docker compose -f docker-compose.production.yml restart api-prod
```

### Passo 4: Verificar

**Logs do backend:**
```bash
docker compose -f docker-compose.production.yml logs -f api-prod
```

**Ao publicar um anúncio, deve aparecer:**
```
🔍 [DEBUG] Gerando URL pública:
   - FRONTEND_URL: https://seu-dominio-producao.vercel.app
   - URL gerada: https://seu-dominio-producao.vercel.app/public/ad-xxx
```

### Passo 5: Testar

1. Publique um anúncio em produção
2. Clique em "Publicado"
3. ✅ Deve abrir a URL correta (não localhost)
4. ✅ Não deve dar 404

## 🚨 Se Algo Der Errado

Ver `DEPLOY_PRODUCAO.md` para troubleshooting detalhado.

## ✅ Pronto!

Deploy completo. Monitore por 30 minutos.
