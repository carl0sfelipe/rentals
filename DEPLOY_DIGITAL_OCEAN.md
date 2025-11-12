# 🚀 Deploy Completo - Digital Ocean + Vercel

Guia completo para deploy de **3 backends** (dev, test, prod) na Digital Ocean e **3 frontends** na Vercel.

---

## 📋 Pré-requisitos

### Na sua máquina local:
- ✅ Git instalado
- ✅ Conta no GitHub
- ✅ Conta na Vercel (https://vercel.com)

### No Droplet da Digital Ocean:
- ✅ Docker instalado
- ✅ Docker Compose instalado
- ✅ Acesso SSH configurado
- ✅ Portas abertas: 80, 443, 3000, 3001, 3002, 5432, 5433, 5434

---

## 🎯 PARTE 1: Deploy do Backend na Digital Ocean

### 1.1 Conectar ao Droplet

```bash
ssh root@SEU_IP_DIGITAL_OCEAN
```

### 1.2 Instalar Dependências (se necessário)

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose -y

# Verificar instalação
docker --version
docker-compose --version
```

### 1.3 Clonar o Repositório

```bash
# Criar diretório
mkdir -p /var/www
cd /var/www

# Clonar repositório
git clone https://github.com/SEU_USUARIO/rentals.git
cd rentals

# Checkout para main
git checkout main
```

### 1.4 Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.production.digitalocean .env

# Editar arquivo .env
nano .env
```

**Configure as seguintes variáveis:**

```env
# Gere JWT secrets únicos com: openssl rand -base64 32
JWT_SECRET_DEV=cole-aqui-um-secret-aleatorio-de-32-chars
JWT_SECRET_TEST=cole-aqui-outro-secret-aleatorio-de-32-chars
JWT_SECRET_PROD=cole-aqui-mais-um-secret-aleatorio-de-32-chars

# URLs dos frontends (configurar após criar na Vercel)
FRONTEND_URL_DEV=https://rentals-dev.vercel.app
FRONTEND_URL_TEST=https://rentals-test.vercel.app
FRONTEND_URL_PROD=https://rentals-prod.vercel.app
```

**Salvar:** Ctrl+O, Enter, Ctrl+X

### 1.5 Deploy dos 3 Backends

```bash
# Deploy de todos os ambientes
./deploy-digitalocean.sh all

# OU deploy individual:
# ./deploy-digitalocean.sh dev
# ./deploy-digitalocean.sh test
# ./deploy-digitalocean.sh prod
```

### 1.6 Verificar Status

```bash
# Ver containers rodando
docker ps

# Ver logs
docker-compose -f docker-compose.production.yml logs -f api-dev
docker-compose -f docker-compose.production.yml logs -f api-test
docker-compose -f docker-compose.production.yml logs -f api-prod

# Testar APIs
curl http://localhost:3000/health  # DEV
curl http://localhost:3001/health  # TEST
curl http://localhost:3002/health  # PROD
```

### 1.7 URLs dos Backends

Após o deploy, suas APIs estarão disponíveis em:

- **DEV:**  `http://SEU_IP:3000`
- **TEST:** `http://SEU_IP:3001`
- **PROD:** `http://SEU_IP:3002`

---

## 🌐 PARTE 2: Deploy dos Frontends na Vercel

### 2.1 Preparar Repositório

No seu computador local:

```bash
cd /home/carlos/Desktop/rentals

# Adicionar novos arquivos
git add .
git commit -m "feat: add multi-environment deployment configs"
git push origin main
```

### 2.2 Criar Projeto DEV na Vercel

1. Acesse https://vercel.com e faça login
2. Clique em **"Add New Project"**
3. Selecione o repositório **rentals**
4. Configure:
   - **Project Name:** `rentals-dev`
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. **Environment Variables:**
   - Key: `VITE_API_URL`
   - Value: `http://SEU_IP_DIGITAL_OCEAN:3000`

6. Clique em **"Deploy"**

7. Após deploy, anote a URL: `https://rentals-dev.vercel.app`

### 2.3 Criar Projeto TEST na Vercel

Repita o processo acima com:
- **Project Name:** `rentals-test`
- **Environment Variable:**
  - Key: `VITE_API_URL`
  - Value: `http://SEU_IP_DIGITAL_OCEAN:3001`

URL: `https://rentals-test.vercel.app`

### 2.4 Criar Projeto PROD na Vercel

Repita o processo acima com:
- **Project Name:** `rentals-prod`
- **Environment Variable:**
  - Key: `VITE_API_URL`
  - Value: `http://SEU_IP_DIGITAL_OCEAN:3002`

URL: `https://rentals-prod.vercel.app`

### 2.5 Atualizar CORS no Backend

Volte ao droplet e atualize o arquivo `.env`:

```bash
ssh root@SEU_IP_DIGITAL_OCEAN
cd /var/www/rentals
nano .env
```

Atualize as URLs dos frontends com as URLs reais da Vercel:

```env
FRONTEND_URL_DEV=https://rentals-dev.vercel.app
FRONTEND_URL_TEST=https://rentals-test.vercel.app
FRONTEND_URL_PROD=https://rentals-prod.vercel.app
```

Restart os serviços:

```bash
docker-compose -f docker-compose.production.yml restart api-dev api-test api-prod
```

---

## ✅ PARTE 3: Verificação Final

### 3.1 Testar cada ambiente

**DEV:**
- Frontend: https://rentals-dev.vercel.app
- Backend: http://SEU_IP:3000
- Login: admin@rentals.com / 12345678

**TEST:**
- Frontend: https://rentals-test.vercel.app
- Backend: http://SEU_IP:3001
- Login: admin@rentals.com / 12345678

**PROD:**
- Frontend: https://rentals-prod.vercel.app
- Backend: http://SEU_IP:3002
- Login: admin@rentals.com / 12345678

### 3.2 Funcionalidades a testar:
- ✅ Login
- ✅ Criar propriedade
- ✅ Listar propriedades
- ✅ Criar booking
- ✅ Download de calendário .ics

---

## 🔧 Comandos Úteis

### No Droplet (Digital Ocean):

```bash
# Ver logs de um ambiente específico
docker-compose -f docker-compose.production.yml logs -f api-dev

# Restart um ambiente
docker-compose -f docker-compose.production.yml restart api-prod

# Parar todos os serviços
docker-compose -f docker-compose.production.yml down

# Ver uso de recursos
docker stats

# Executar migrations manualmente
docker-compose -f docker-compose.production.yml exec api-dev npx prisma migrate deploy

# Acessar banco de dados
docker-compose -f docker-compose.production.yml exec db-dev psql -U rentals_user -d rentals_dev
```

### Na Vercel:

```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel

# Deploy manual de um ambiente
vercel --prod
```

---

## 🔐 Segurança

### Firewall (UFW)

```bash
# Habilitar firewall
ufw enable

# Permitir SSH
ufw allow 22

# Permitir HTTP/HTTPS
ufw allow 80
ufw allow 443

# Permitir APIs
ufw allow 3000
ufw allow 3001
ufw allow 3002

# Ver status
ufw status
```

### SSL/HTTPS (Opcional com Certbot)

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obter certificado (configure seu domínio primeiro)
certbot --nginx -d seudominio.com -d www.seudominio.com
```

---

## 📊 Arquitetura Final

```
┌─────────────────────────────────────────────────────┐
│                   VERCEL (Frontends)                │
├─────────────────────────────────────────────────────┤
│  rentals-dev.vercel.app    → Port 3000 (DEV)       │
│  rentals-test.vercel.app   → Port 3001 (TEST)      │
│  rentals-prod.vercel.app   → Port 3002 (PROD)      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│          DIGITAL OCEAN DROPLET (Backend)            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ API DEV     │  │ API TEST    │  │ API PROD   │ │
│  │ Port 3000   │  │ Port 3001   │  │ Port 3002  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬─────┘ │
│         │                │                │        │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼─────┐ │
│  │ PostgreSQL  │  │ PostgreSQL  │  │ PostgreSQL │ │
│  │ DEV         │  │ TEST        │  │ PROD       │ │
│  │ Port 5432   │  │ Port 5433   │  │ Port 5434  │ │
│  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │              NGINX (Reverse Proxy)             │ │
│  │                  Port 80/443                   │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting

### Erro de CORS
```
Access to fetch at 'http://...' from origin 'https://...' has been blocked by CORS
```
**Solução:** Verifique se o `FRONTEND_URL` no `.env` está correto e restart a API.

### Erro de conexão com banco
```
Error: P1001: Can't reach database server
```
**Solução:** Verifique se o container do banco está rodando: `docker ps`

### Build falhando na Vercel
**Solução:**
- Verifique se o `Root Directory` está como `frontend`
- Verifique se `VITE_API_URL` está configurado corretamente

### API não responde
```bash
# Ver logs
docker-compose -f docker-compose.production.yml logs api-prod

# Restart
docker-compose -f docker-compose.production.yml restart api-prod
```

---

## 🎉 Pronto!

Você agora tem:
- ✅ 3 backends rodando na Digital Ocean (dev, test, prod)
- ✅ 3 frontends na Vercel
- ✅ 3 bancos de dados PostgreSQL isolados
- ✅ NGINX como reverse proxy
- ✅ Sistema completamente isolado por ambiente

**Credenciais de teste para todos os ambientes:**
- Email: `admin@rentals.com`
- Senha: `12345678`

---

## 📞 Suporte

- Digital Ocean Docs: https://docs.digitalocean.com
- Vercel Docs: https://vercel.com/docs
- Docker Docs: https://docs.docker.com

**✨ Deploy completo em ~30 minutos!**
