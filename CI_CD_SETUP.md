# 🤖 Configuração de CI/CD - Deploy Automático

Este guia explica como configurar deploy automático para os 3 ambientes (dev, test, prod) usando GitHub Actions.

---

## 📖 Como Funciona?

Quando você faz push em uma branch específica, o GitHub Actions automaticamente:
1. Conecta no seu servidor Digital Ocean via SSH
2. Faz pull do código mais recente
3. Rebuilda e reinicia apenas o ambiente correspondente
4. Executa migrations do banco de dados
5. Verifica se a API está respondendo

**Fluxo de Trabalho:**
- 🟢 Push na branch `dev` → Deploy automático do ambiente DEV (porta 3000)
- 🟡 Push na branch `test` → Deploy automático do ambiente TEST (porta 3001)
- 🔴 Push na branch `main` → Deploy automático do ambiente PROD (porta 3002)

---

## 🔧 Configuração Inicial

### Passo 1: Criar as branches no GitHub

```bash
# Na sua máquina local
cd /home/carlos/Desktop/rentals

# Criar branch dev
git checkout -b dev
git push origin dev

# Criar branch test
git checkout -b test
git push origin test

# Voltar para main
git checkout main
```

### Passo 2: Obter chave SSH do servidor

**No servidor Digital Ocean**, execute:

```bash
cat ~/.ssh/id_rsa
```

Se o arquivo não existir, crie uma nova chave:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/id_rsa -N ""
cat ~/.ssh/id_rsa
```

**Copie TODA a saída** (incluindo as linhas `-----BEGIN` e `-----END`)

---

### Passo 3: Configurar Secrets no GitHub

1. Acesse seu repositório no GitHub: https://github.com/carl0sfelipe/rentals

2. Clique em **Settings** (Configurações)

3. No menu lateral esquerdo, clique em **Secrets and variables** → **Actions**

4. Clique em **New repository secret**

5. Adicione os seguintes secrets (um por vez):

#### Secret 1: DIGITALOCEAN_HOST
- **Name:** `DIGITALOCEAN_HOST`
- **Value:** O IP do seu droplet (ex: `142.93.123.45`)

#### Secret 2: DIGITALOCEAN_USERNAME
- **Name:** `DIGITALOCEAN_USERNAME`
- **Value:** `root` (ou o usuário que você usa para conectar)

#### Secret 3: DIGITALOCEAN_SSH_KEY
- **Name:** `DIGITALOCEAN_SSH_KEY`
- **Value:** Cole a chave SSH privada que você copiou no Passo 2 (incluindo `-----BEGIN` e `-----END`)

#### Secret 4: DIGITALOCEAN_PORT
- **Name:** `DIGITALOCEAN_PORT`
- **Value:** `22` (porta SSH padrão)

---

## ✅ Pronto! Como Usar

### Deploy no ambiente DEV

```bash
# Trabalhe na branch dev
git checkout dev

# Faça suas alterações
vim src/app.module.ts

# Commit e push (deploy automático vai começar!)
git add .
git commit -m "feat: nova funcionalidade"
git push origin dev
```

### Deploy no ambiente TEST

```bash
# Trabalhe na branch test
git checkout test

# Merge do dev (ou faça alterações diretas)
git merge dev

# Push (deploy automático vai começar!)
git push origin test
```

### Deploy no ambiente PROD

```bash
# Trabalhe na branch main
git checkout main

# Merge do test
git merge test

# Push (deploy automático vai começar!)
git push origin main
```

---

## 👀 Acompanhar o Deploy

1. Vá até o repositório no GitHub
2. Clique na aba **Actions**
3. Você verá os workflows em execução
4. Clique em um workflow para ver os logs em tempo real

---

## 🎯 Estratégia Recomendada

### Fluxo de Desenvolvimento:

```
dev → test → main
```

1. **Desenvolva na branch `dev`**
   - Faça commits e pushs livremente
   - Teste suas funcionalidades no ambiente DEV (porta 3000)

2. **Quando estiver satisfeito, faça merge para `test`**
   ```bash
   git checkout test
   git merge dev
   git push origin test
   ```
   - Teste rigorosamente no ambiente TEST (porta 3001)
   - Peça feedback de outros desenvolvedores

3. **Quando tudo estiver OK, faça merge para `main`**
   ```bash
   git checkout main
   git merge test
   git push origin main
   ```
   - Ambiente PROD (porta 3002) será atualizado
   - Seus usuários verão as mudanças

---

## 🛠️ Deploy Manual (se necessário)

Se quiser fazer deploy manual sem usar GitHub Actions:

```bash
# Conectar ao servidor
ssh root@SEU_IP

# Ir para o projeto
cd /var/www/rentals

# Fazer pull
git pull origin dev   # ou test, ou main

# Rebuild e restart
./deploy-digitalocean.sh dev   # ou test, ou prod
```

---

## 🚨 Troubleshooting

### Erro: "Permission denied (publickey)"

**Causa:** A chave SSH no secret está incorreta ou o formato está errado.

**Solução:**
1. Verifique se copiou a chave PRIVADA (não a pública `.pub`)
2. Certifique-se de incluir as linhas `-----BEGIN` e `-----END`
3. No GitHub, edite o secret `DIGITALOCEAN_SSH_KEY` e cole novamente

### Erro: "Host key verification failed"

**Solução:** Adicione `StrictHostKeyChecking=no` no workflow (já configurado).

### Workflow não executa

**Verifique:**
1. Se você fez push na branch correta (dev, test, ou main)
2. Se os arquivos `.github/workflows/*.yml` estão na branch
3. Se as Actions estão habilitadas: Settings → Actions → General → "Allow all actions"

### Deploy falha mas código foi atualizado

**Causa:** Geralmente erro nas migrations ou API não inicia.

**Solução:**
```bash
# Ver logs no servidor
ssh root@SEU_IP
cd /var/www/rentals
docker compose -f docker-compose.production.yml logs -f api-dev
```

---

## 📊 Estrutura dos Workflows

Cada ambiente tem seu próprio workflow:

```
.github/
└── workflows/
    ├── deploy-dev.yml   # Deploy automático do DEV
    ├── deploy-test.yml  # Deploy automático do TEST
    └── deploy-prod.yml  # Deploy automático do PROD
```

Todos seguem a mesma estrutura, apenas mudando:
- Branch que dispara (`dev`, `test`, `main`)
- Porta do ambiente (3000, 3001, 3002)
- Nome dos containers Docker (`api-dev`, `api-test`, `api-prod`)

---

## 🎉 Benefícios

✅ Deploy automático - Sem necessidade de conectar no servidor
✅ Reduz erros humanos - Processo padronizado
✅ Histórico completo - Todos os deploys ficam registrados
✅ Rollback fácil - Basta reverter o commit
✅ Notificações - Você sabe se o deploy funcionou ou falhou

---

## 📚 Recursos Adicionais

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SSH Action Documentation](https://github.com/appleboy/ssh-action)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## 🔐 Segurança

**IMPORTANTE:**
- Nunca commite a chave SSH privada no código
- Use sempre Secrets do GitHub para dados sensíveis
- A chave SSH deve ter permissões mínimas necessárias
- Considere usar um usuário não-root para deploys (mais seguro)

---

**✨ Configurado em ~5 minutos!**
