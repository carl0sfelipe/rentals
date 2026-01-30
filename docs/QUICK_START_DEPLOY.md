# 🚀 Guia Simplificado - Colocar seu Sistema no Ar

## 📖 O que vamos fazer?

Vamos colocar seu sistema de aluguel de propriedades funcionando na internet! Você terá **3 versões** do sistema:

1. **DEV** (Desenvolvimento) - Para você testar coisas novas
2. **TEST** (Teste) - Para testar antes de ir para produção
3. **PROD** (Produção) - A versão final que seus clientes usarão

---

## 🎯 PARTE 1: Configurar o Backend (Servidor) na Digital Ocean

O backend é o "cérebro" do seu sistema - onde ficam os dados e a lógica.

### Passo 1.1: Conectar no seu servidor

```bash
# Substitua SEU_IP pelo IP do seu droplet (ex: 142.93.123.45)
ssh root@SEU_IP
```

**O que isso faz?** Conecta você ao seu servidor na Digital Ocean via linha de comando.

**Exemplo:**
```bash
ssh root@142.93.123.45
```

Ele vai pedir a senha do servidor. Digite e aperte Enter.

---

### Passo 1.2: Instalar Docker (se não tiver)

Docker é como um "empacotador" que facilita rodar programas. Cole esses comandos:

```bash
# Baixa o instalador do Docker
curl -fsSL https://get.docker.com -o get-docker.sh

# Instala o Docker (já vem com Docker Compose incluído!)
sh get-docker.sh

# Verificar se Docker Compose está funcionando
docker compose version
```

**Aguarde:** Isso pode levar 2-3 minutos.

**Nota:** O Docker moderno já inclui o Docker Compose automaticamente. Não precisa instalar separadamente!

---

### Passo 1.3: Configurar SSH e baixar código

#### A) Gerar chave SSH no servidor

```bash
# Gerar chave SSH (aperte Enter 3 vezes)
ssh-keygen -t ed25519 -C "deploy@digitalocean"

# Ver a chave pública
cat ~/.ssh/id_ed25519.pub
```

**Copie toda a saída** (começa com `ssh-ed25519`)

#### B) Adicionar chave no GitHub

1. Abra no navegador: https://github.com/settings/keys
2. Clique em **"New SSH key"**
3. Title: `Digital Ocean Server`
4. Key: Cole a chave que você copiou
5. Clique em **"Add SSH key"**

#### C) Baixar o código

```bash
# Criar pasta
cd /var/www

# Clonar via SSH (mais seguro!)
git clone git@github.com:carl0sfelipe/rentals.git

# Entrar na pasta
cd rentals

# Criar arquivo de configuração
cp .env.production.example .env
```

**O que isso faz?** Configura acesso seguro ao GitHub e baixa seu código.

---

### Passo 1.4: Configurar senhas e URLs

```bash
# Abrir editor vim
vim .env
```

#### A) Gerar senhas JWT

Abra outro terminal **na sua máquina local** e gere 3 senhas:

```bash
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
```

Copie as 3 senhas geradas.

#### B) Editar no vim

No servidor, dentro do vim:

1. Aperte `i` para entrar no modo de edição
2. Encontre estas linhas e substitua pelas suas senhas:
   - `JWT_SECRET_DEV=cole-primeira-senha-aqui`
   - `JWT_SECRET_TEST=cole-segunda-senha-aqui`
   - `JWT_SECRET_PROD=cole-terceira-senha-aqui`

3. URLs do Frontend (deixe como está por enquanto):
   ```
   FRONTEND_URL_DEV=https://rentals-dev.vercel.app
   FRONTEND_URL_TEST=https://rentals-test.vercel.app
   FRONTEND_URL_PROD=https://rentals-prod.vercel.app
   ```

**Salvar e sair do vim:**
1. Aperte `Esc` (sair do modo edição)
2. Digite `:wq` e aperte `Enter` (salvar e sair)

---

### Passo 1.5: Rodar o Deploy!

```bash
# Isso vai criar os 3 backends automaticamente
./deploy-digitalocean.sh all
```

**O que acontece?** O script vai:
1. Criar 3 servidores backend (dev, test, prod)
2. Criar 3 bancos de dados separados
3. Configurar tudo automaticamente

**Aguarde:** 5-10 minutos. Vai aparecer muita coisa na tela - é normal!

Quando terminar, você verá: ✅ Deploy concluído!

---

## 🌐 PARTE 2: Configurar o Frontend (Interface) na Vercel

O frontend é a parte visual que seus usuários vão ver e clicar.

### Passo 2.1: Criar conta na Vercel

1. Acesse: https://vercel.com
2. Clique em **"Sign Up"** (Criar conta)
3. Faça login com sua conta do GitHub
4. Autorize a Vercel a acessar seus repositórios

---

### Passo 2.2: Criar o Frontend DEV

1. Na Vercel, clique em **"Add New..."** → **"Project"**
2. Procure o repositório **rentals** e clique em **"Import"**
3. Preencha assim:

   **Project Name:** `rentals-dev`

   **Framework Preset:** Vite

   **Root Directory:** Clique em "Edit" e digite `frontend`

   **Build Command:** `npm run build`

   **Output Directory:** `dist`

4. **Environment Variables** (Variáveis de Ambiente):
   - Clique em **"Add"**
   - Name: `VITE_API_URL`
   - Value: `http://142.93.123.45:3000` (substitua pelo SEU IP do droplet)

5. Clique em **"Deploy"**

**Aguarde:** 2-3 minutos. Quando aparecer 🎉 significa que funcionou!

6. **Copie a URL** que apareceu (algo como `rentals-dev.vercel.app`)

---

### Passo 2.3: Criar o Frontend TEST

Repita o processo acima, mas com estas diferenças:

- **Project Name:** `rentals-test`
- **VITE_API_URL:** `http://142.93.123.45:3001` (porta **3001** agora!)

---

### Passo 2.4: Criar o Frontend PROD

Repita mais uma vez:

- **Project Name:** `rentals-prod`
- **VITE_API_URL:** `http://142.93.123.45:3002` (porta **3002** agora!)

---

## 🔗 PARTE 3: Conectar Frontend e Backend

Agora que você tem as 3 URLs da Vercel, precisa configurar o backend para aceitar requisições delas.

### Passo 3.1: Voltar ao servidor

```bash
# Conectar novamente (se fechou)
ssh root@SEU_IP

# Ir para a pasta do projeto
cd /var/www/rentals

# Editar configurações
vim .env
```

### Passo 3.2: Atualizar URLs

No vim:

1. Aperte `i` para editar
2. Encontre estas linhas e substitua pelas URLs REAIS da Vercel:

```
FRONTEND_URL_DEV=https://rentals-dev.vercel.app
FRONTEND_URL_TEST=https://rentals-test.vercel.app
FRONTEND_URL_PROD=https://rentals-prod.vercel.app
```

**Exemplo (use suas URLs da Vercel):**
```
FRONTEND_URL_DEV=https://rentals-dev-abc123.vercel.app
FRONTEND_URL_TEST=https://rentals-test-xyz789.vercel.app
FRONTEND_URL_PROD=https://rentals-prod-def456.vercel.app
```

3. Aperte `Esc`
4. Digite `:wq` e Enter para salvar

### Passo 3.3: Reiniciar os backends

```bash
docker compose -f docker-compose.production.yml restart api-dev api-test api-prod
```

---

## ✅ PRONTO! Testar o Sistema

Agora você tem tudo funcionando! Acesse cada ambiente:

### 🟢 DEV (Desenvolvimento)
- **Site:** https://rentals-dev.vercel.app
- **API:** http://SEU_IP:3000
- **Uso:** Para testar coisas novas

### 🟡 TEST (Teste)
- **Site:** https://rentals-test.vercel.app
- **API:** http://SEU_IP:3001
- **Uso:** Para testar antes de ir pro ar

### 🔴 PROD (Produção)
- **Site:** https://rentals-prod.vercel.app
- **API:** http://SEU_IP:3002
- **Uso:** Versão final para seus clientes

### 🔑 Fazer Login

Em qualquer um dos sites acima:
- **Email:** admin@rentals.com
- **Senha:** 12345678

---

## 🆘 Problemas Comuns

### "Authentication failed for GitHub" (erro ao clonar)
```
remote: Invalid username or token
fatal: Authentication failed
```

**Solução:** Siga o Passo 1.3 para configurar SSH corretamente:
1. Gere a chave SSH no servidor: `ssh-keygen -t ed25519`
2. Copie a chave: `cat ~/.ssh/id_ed25519.pub`
3. Adicione no GitHub: https://github.com/settings/keys
4. Clone via SSH: `git clone git@github.com:carl0sfelipe/rentals.git`

### "No such file .env.production.digitalocean"

**Solução:** Use o arquivo correto:
```bash
cp .env.production.example .env
```

### "Erro ao instalar docker-compose" (conflito de pacotes)
```
trying to overwrite '/usr/libexec/docker/cli-plugins/docker-compose'
```

**Solução:** Você já tem o Docker Compose instalado! Não precisa fazer nada. Basta usar `docker compose` (sem hífen) em vez de instalar novamente.

**Testar:**
```bash
docker compose version
```

Se aparecer a versão, está funcionando! Pule para o próximo passo.

### "Não consigo fazer login"
- Verifique se atualizou o `.env` com as URLs da Vercel
- Reinicie os backends: `docker compose -f docker-compose.production.yml restart`

### "Site não carrega"
- Verifique se o IP está correto na Vercel
- Teste se o backend responde: `curl http://SEU_IP:3000/health`

### "Erro de CORS"
- Verifique se as URLs no `.env` estão EXATAMENTE iguais às da Vercel

---

## 📞 Ajuda Adicional

- 📖 **Guia completo:** Abra [DEPLOY_DIGITAL_OCEAN.md](./DEPLOY_DIGITAL_OCEAN.md)
- 🐛 **Problemas?** Veja os logs: `docker compose -f docker-compose.production.yml logs -f api-dev`
