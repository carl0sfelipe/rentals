# 🔧 Como Corrigir o Problema do Localhost

## Problema
Os anúncios publicados estão gerando links com `localhost` ao invés da URL correta do frontend.

## Solução

### 1️⃣ Reiniciar o Backend

O código foi atualizado mas o backend precisa ser reiniciado para:
- Carregar as novas variáveis de ambiente (`FRONTEND_URL`)
- Usar o código atualizado com a nova lógica

**Se estiver usando Docker:**
```bash
# Parar e reiniciar os containers
docker compose down
docker compose up -d --build

# Ou apenas reiniciar o backend
docker compose restart backend
```

**Se estiver rodando localmente:**
```bash
# Parar o servidor (Ctrl+C) e reiniciar
npm run start:dev
```

### 2️⃣ Verificar Variáveis de Ambiente

Certifique-se que o arquivo `.env` tem a linha:
```bash
FRONTEND_URL=http://localhost:5173
```

**Para produção**, altere para a URL real:
```bash
# No servidor de produção
FRONTEND_URL=https://seu-dominio-frontend.com

# OU usando variáveis específicas por ambiente
FRONTEND_URL_PROD=https://seu-dominio-frontend.com
```

### 3️⃣ Corrigir URLs Antigas (Anúncios já Publicados)

Se você já tinha anúncios publicados com URLs antigas, execute:

```bash
# Corrige todas as URLs com localhost no banco de dados
npx ts-node scripts/fix-published-urls.ts
```

### 4️⃣ Testar

1. Após reiniciar o backend, **crie um novo anúncio** ou **republique um existente**
2. Verifique os logs do backend - você deve ver algo como:
   ```
   🔍 [DEBUG] Gerando URL pública:
      - NODE_ENV: development
      - FRONTEND_URL: http://localhost:5173
      - Frontend URL detectada: http://localhost:5173
      - URL pública gerada: http://localhost:5173/public/ad-xxx
   ```
3. Clique em "Publicado" - agora deve abrir a URL correta

## 🚀 Deploy em Produção

Quando fizer deploy:

1. Configure a variável de ambiente no servidor:
   ```bash
   FRONTEND_URL=https://seu-dominio.vercel.app
   ```

2. Reinicie a aplicação

3. Execute o script de correção se necessário:
   ```bash
   npx ts-node scripts/fix-published-urls.ts
   ```

## 📝 Verificação

Para verificar se está funcionando:

1. Verifique os logs ao publicar um anúncio
2. A URL gerada NÃO deve conter `localhost` (exceto em dev local)
3. Ao clicar em "Publicado", deve abrir a URL correta

## ❓ Ainda com Problemas?

Se ainda estiver com localhost após seguir todos os passos:

1. Verifique se o backend foi realmente reiniciado
2. Verifique os logs do console ao publicar
3. Confirme que a variável `FRONTEND_URL` está no `.env`
4. Tente executar: `npm run build` e depois `npm run start:prod`
