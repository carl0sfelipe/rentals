# 🚀 Deploy para Produção - Guia Completo

## ✅ Pré-requisitos

Antes de fazer deploy para produção, certifique-se que:

- [x] Todas as alterações funcionam corretamente em **DEV**
- [x] Backend está gerando URLs corretas (não localhost)
- [x] Frontend está acessível via URLs públicas (sem 404)
- [ ] Testes estão passando
- [ ] Variáveis de ambiente de PROD estão configuradas

## 📋 Fluxo de Deploy para Produção

```
dev (testado e funcionando)
  ↓
  [Criar PR para main]
  ↓
main (produção)
  ↓
  [GitHub Actions detecta push]
  ↓
  [Deploy automático no Digital Ocean]
  ↓
api-prod reiniciado (porta 3002)
```

## 🔧 Passo 1: Criar Pull Request para Main

### Via GitHub UI (Recomendado)

**1. Acesse:**
```
https://github.com/carl0sfelipe/rentals/compare/main...dev
```

**2. Configure o PR:**
- **Base**: `main`
- **Compare**: `dev`
- **Título**: "Release: Deploy de correção de URLs públicas para produção"

**3. Descrição sugerida:**

```markdown
## 🚀 Release para Produção

### Funcionalidades e Correções

✅ **URLs de anúncios profissionais corrigidas**
- Backend agora gera URLs corretas baseadas no ambiente
- Suporte para variáveis FRONTEND_URL_PROD/FRONTEND_URL
- Logs de debug para troubleshooting

✅ **Frontend: Roteamento SPA configurado**
- Adicionado vercel.json para resolver 404
- URLs públicas /public/:slug funcionando

✅ **Scripts de manutenção**
- Script para corrigir URLs antigas no banco
- Documentação completa de troubleshooting

✅ **CI/CD configurado**
- Deploy automático para ambientes DEV/TEST/PROD
- GitHub Actions com SSH para Digital Ocean

### Testado em DEV

- ✅ Backend gera URLs corretas
- ✅ Frontend serve rotas públicas sem 404
- ✅ Anúncios abrem corretamente

### Checklist de Deploy PROD

- [ ] Merge deste PR
- [ ] GitHub Actions executará deploy automático
- [ ] Configurar FRONTEND_URL no servidor de produção
- [ ] Reiniciar api-prod
- [ ] Testar URL pública em produção
- [ ] Executar script de correção se necessário

### Breaking Changes

Nenhum. Totalmente retrocompatível.
```

**4. Criar e Fazer Merge**

## 🔧 Passo 2: Aguardar GitHub Actions

Após o merge para `main`:

1. **Acompanhe o deploy:**
   ```
   https://github.com/carl0sfelipe/rentals/actions
   ```

2. **O workflow "Deploy PROD Environment" irá:**
   - SSH no Digital Ocean
   - `git checkout main && git pull origin main`
   - `docker compose build api-prod`
   - `docker compose up -d api-prod` (porta 3002)
   - `npx prisma migrate deploy`
   - Health check

3. **Duração**: ~3-5 minutos

## ⚙️ Passo 3: Configurar Variáveis de Ambiente PROD

**IMPORTANTE**: Configure a variável de ambiente no servidor de produção.

### SSH no Servidor

```bash
ssh seu-usuario@seu-servidor-digitalocean
cd /var/www/rentals
```

### Verificar Arquivo de Ambiente

O Docker Compose usa `docker-compose.production.yml` que deve ter:

```yaml
# Para o serviço api-prod
environment:
  - FRONTEND_URL=${FRONTEND_URL_PROD}
  # ou
  - FRONTEND_URL=${FRONTEND_URL}
```

### Opção A: Editar .env no servidor

```bash
# Editar arquivo .env principal
nano .env  # ou vim .env

# Adicionar ou modificar:
FRONTEND_URL_PROD=https://seu-dominio-producao.vercel.app
# ou
FRONTEND_URL=https://seu-dominio-producao.vercel.app
```

### Opção B: Usar secrets do GitHub

Se preferir usar secrets do GitHub:

1. Vá em: `https://github.com/carl0sfelipe/rentals/settings/secrets/actions`
2. Adicione: `FRONTEND_URL_PROD`
3. Modifique `.github/workflows/deploy-prod.yml` para passar a variável

```yaml
script: |
  cd /var/www/rentals

  # Criar arquivo .env.prod.local ou atualizar .env
  echo "FRONTEND_URL=${{ secrets.FRONTEND_URL_PROD }}" >> .env

  # Resto do deploy...
```

### Reiniciar Container PROD

```bash
docker compose -f docker-compose.production.yml restart api-prod
```

### Verificar Variável

```bash
docker compose -f docker-compose.production.yml exec api-prod env | grep FRONTEND_URL

# Deve mostrar:
# FRONTEND_URL=https://seu-dominio-producao.vercel.app
```

## 🌐 Passo 4: Deploy do Frontend na Vercel (Produção)

### Verificar Projeto na Vercel

1. Acesse: https://vercel.com/dashboard
2. Encontre seu projeto de produção
3. Verifique que a branch de produção está configurada (geralmente `main`)

### Garantir que vercel.json está no projeto

O arquivo `frontend/vercel.json` deve estar commitado no repositório:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Opções de Deploy

#### A) Deploy Automático (Recomendado)

Se a Vercel está configurada para monitorar `main`:
- Merge do PR → Deploy automático

#### B) Deploy Manual

```bash
cd frontend
vercel --prod
```

### Verificar Deploy

1. Acesse a URL de produção da Vercel
2. Tente acessar uma rota qualquer (ex: `/test`)
3. Não deve dar 404 - deve redirecionar para o app

## 🧪 Passo 5: Testar em Produção

### 1. Verificar Logs do Backend

```bash
# SSH no servidor
docker compose -f docker-compose.production.yml logs -f api-prod
```

### 2. Publicar Anúncio de Teste

1. Acesse o dashboard de produção
2. Publique um anúncio
3. Verifique os logs - deve mostrar:

```
🔍 [DEBUG] Gerando URL pública:
   - NODE_ENV: production
   - FRONTEND_URL: https://seu-dominio-producao.vercel.app
   - Frontend URL detectada: https://seu-dominio-producao.vercel.app
   - URL pública gerada: https://seu-dominio-producao.vercel.app/public/ad-xxx
```

### 3. Testar URL Pública

1. Copie a URL gerada
2. Abra em uma janela anônima (sem login)
3. Deve carregar o anúncio corretamente
4. ✅ Sem 404!
5. ✅ Sem redirect para localhost!

## 🔧 Passo 6: Corrigir URLs Antigas (Se Necessário)

Se você já tinha anúncios publicados em produção com URLs antigas:

```bash
# SSH no servidor
cd /var/www/rentals

# Executar script de correção
docker compose -f docker-compose.production.yml exec -T api-prod npx ts-node scripts/fix-published-urls.ts

# Deve mostrar:
# 🔍 Procurando propriedades com URLs localhost...
# ✅ X propriedades atualizadas
```

## 📊 Checklist Final de Produção

Marque cada item conforme completa:

### Deploy
- [ ] PR de dev → main criado e aprovado
- [ ] Merge realizado
- [ ] GitHub Actions executou com sucesso (verde)
- [ ] Backend em produção reiniciado

### Configuração
- [ ] FRONTEND_URL configurada no servidor PROD
- [ ] api-prod reiniciado após configurar variável
- [ ] Variável verificada com `docker exec ... env | grep FRONTEND`

### Frontend
- [ ] vercel.json presente no repositório
- [ ] Deploy do frontend na Vercel concluído
- [ ] URL de produção acessível

### Testes
- [ ] Logs do backend mostram URL correta ao publicar
- [ ] URL gerada não contém localhost
- [ ] Acesso à URL pública funciona (sem 404)
- [ ] Anúncio carrega corretamente

### Manutenção (Se aplicável)
- [ ] Script de correção executado para URLs antigas
- [ ] Anúncios antigos verificados

## 🚨 Troubleshooting

### Problema: GitHub Actions falhou

**Verifique:**
```bash
# No GitHub Actions, veja os logs
# Erros comuns:
# - Falha de SSH: Verificar secrets
# - Build falhou: Verificar erros de compilação
# - Health check falhou: Verificar se api-prod está rodando
```

**Solução:**
- Revisar logs no GitHub Actions
- SSH no servidor e verificar manualmente
- Executar comandos do workflow manualmente

### Problema: Backend ainda gera localhost

**Causa**: Variável não carregada ou backend não reiniciado

**Solução:**
```bash
# Verificar variável
docker compose -f docker-compose.production.yml exec api-prod env | grep FRONTEND_URL

# Se não aparecer, editar .env e reiniciar
docker compose -f docker-compose.production.yml restart api-prod

# Verificar logs
docker compose -f docker-compose.production.yml logs api-prod | grep FRONTEND
```

### Problema: 404 na Vercel em produção

**Causa**: vercel.json não foi deployed ou deploy não foi feito

**Solução:**
```bash
# Verificar se vercel.json existe no repo
ls -la frontend/vercel.json

# Se existir, forçar redeploy
cd frontend
vercel --prod
```

### Problema: URL pública retorna erro da API

**Causa**: Endpoint não está funcionando ou propriedade não existe

**Solução:**
```bash
# Testar endpoint diretamente (do servidor)
curl http://localhost:3002/properties/public/ad-xxx

# Deve retornar JSON da propriedade
# Se retornar erro, verificar logs da API
```

## 📈 Monitoramento Pós-Deploy

Após o deploy, monitore por pelo menos 30 minutos:

```bash
# Logs em tempo real
docker compose -f docker-compose.production.yml logs -f api-prod

# Verificar health
curl http://localhost:3002/health

# Verificar uso de recursos
docker stats
```

## 🔄 Rollback (Se Necessário)

Se algo der errado, você pode fazer rollback:

```bash
# SSH no servidor
cd /var/www/rentals

# Voltar para commit anterior
git log --oneline -5  # Ver commits
git checkout <commit-hash-anterior>

# Rebuild e restart
docker compose -f docker-compose.production.yml build api-prod
docker compose -f docker-compose.production.yml restart api-prod
```

## 📚 Arquivos Importantes

- `.github/workflows/deploy-prod.yml` - Workflow de produção
- `docker-compose.production.yml` - Config Docker produção
- `.env` (servidor) - Variáveis de ambiente
- `frontend/vercel.json` - Config Vercel SPA

## 🎯 Resumo Executivo

1. **PR**: dev → main
2. **Merge**: GitHub Actions faz deploy automático
3. **Config**: `FRONTEND_URL` no servidor
4. **Restart**: `api-prod`
5. **Deploy**: Frontend na Vercel
6. **Teste**: Publicar anúncio e verificar URL
7. **Monitor**: Logs por 30 minutos

## ✅ Sucesso!

Se todos os passos foram concluídos:
- ✅ URLs públicas funcionam em produção
- ✅ Sem 404 da Vercel
- ✅ Sem localhost nas URLs
- ✅ Anúncios compartilháveis publicamente

🎉 **Deploy para produção concluído com sucesso!**
