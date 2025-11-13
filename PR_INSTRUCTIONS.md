# 🔄 Como Acionar o Deploy Automático

## ❓ Por que o backend não reinicia automaticamente?

Você tem GitHub Actions configurado corretamente, **MAS** ele só é acionado quando há **push na branch `dev`**.

Atualmente suas alterações estão na feature branch:
```
claude/fix-professional-listing-click-011CV5DcbiN1LxmqJcrKU4Hi
```

## ✅ Solução: Criar Pull Request para `dev`

### Opção 1: Via GitHub (Recomendado)

1. Acesse: https://github.com/carl0sfelipe/rentals/pull/new/claude/fix-professional-listing-click-011CV5DcbiN1LxmqJcrKU4Hi

2. Configure o PR:
   - **Base**: `dev` (não `main`!)
   - **Compare**: `claude/fix-professional-listing-click-011CV5DcbiN1LxmqJcrKU4Hi`
   - **Título**: "fix: corrigir URLs de anúncios profissionais (localhost)"

3. Adicione a descrição:
   ```markdown
   ## 🐛 Problema

   Ao publicar um anúncio profissional e clicar em "publicado", o link estava
   apontando para `localhost` ao invés da URL correta do frontend.

   ## ✅ Solução

   - Lógica inteligente de detecção de ambiente
   - Variáveis de ambiente configuradas (.env)
   - Logs de debug para troubleshooting
   - Script para corrigir URLs antigas
   - Documentação completa

   ## 🚀 Deploy Automático

   Ao fazer merge deste PR, o GitHub Actions vai:
   1. ✅ Fazer deploy no ambiente DEV automaticamente
   2. ✅ Reiniciar o backend com as novas variáveis
   3. ✅ Executar migrations se necessário

   ## 📝 Pós-Deploy

   Se necessário, execute no servidor:
   ```bash
   npx ts-node scripts/fix-published-urls.ts
   ```

   ## 📦 Arquivos Modificados

   - `src/properties/properties.service.ts`: Lógica + logs
   - `.env*`: Configuração FRONTEND_URL
   - `scripts/fix-published-urls.ts`: Script de correção
   - `CORRIGIR_LOCALHOST.md`: Documentação
   ```

4. Crie o PR

5. Faça o **Merge do PR**

6. 🎉 O GitHub Actions vai automaticamente:
   - Fazer SSH no Digital Ocean
   - Pull das alterações
   - Rebuild do container `api-dev`
   - Restart do backend
   - Executar migrations

### Opção 2: Via linha de comando (se gh estiver configurado)

```bash
gh pr create --base dev \
  --title "fix: corrigir URLs de anúncios profissionais" \
  --body "Ver CORRIGIR_LOCALHOST.md para detalhes"
```

## 📊 Como Verificar se o Deploy Funcionou

1. **Vá para GitHub Actions**: https://github.com/carl0sfelipe/rentals/actions

2. **Procure pelo workflow**: "Deploy DEV Environment"

3. **Verifique o status**:
   - 🟡 Amarelo = Rodando
   - 🟢 Verde = Sucesso
   - 🔴 Vermelho = Erro

4. **Clique no workflow** para ver os logs detalhados

## 🔍 O Que o GitHub Action Faz

Quando você faz merge para `dev`, o workflow `.github/workflows/deploy-dev.yml`:

```yaml
on:
  push:
    branches:
      - dev  # 👈 Só roda quando há push em dev
```

Executa:
1. SSH no Digital Ocean
2. `git pull origin dev`
3. `docker compose build api-dev`
4. `docker compose up -d api-dev` (restart)
5. `npx prisma migrate deploy`
6. Health check

## ⚠️ IMPORTANTE

- ❌ Push direto em branches que não começam com `claude/` falha com 403
- ✅ Crie PR e faça merge via GitHub UI
- ✅ Após merge, o deploy é **100% automático**

## 📝 Resumo

**Situação atual:**
```
Feature Branch (suas alterações) ──────┐
                                        │
Branch dev (sem alterações) ────────────┤
                                        │
GitHub Actions (esperando push em dev) ─┘
```

**Após merge:**
```
Feature Branch ──merge──> Branch dev ──push──> GitHub Actions ──SSH──> Digital Ocean ──restart──> Backend atualizado ✅
```

## 🆘 Problemas?

Se após o merge o deploy falhar:
1. Verifique os logs no GitHub Actions
2. Verifique se as secrets estão configuradas:
   - `DIGITALOCEAN_HOST`
   - `DIGITALOCEAN_USERNAME`
   - `DIGITALOCEAN_SSH_KEY`
   - `DIGITALOCEAN_PORT`
3. Verifique conectividade SSH com Digital Ocean
