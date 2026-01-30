# 🚀 Cloudflare Tunnel - HTTPS Grátis Sem Domínio!

## 🎯 O Que É?

Cloudflare Tunnel cria um túnel seguro do seu servidor para a Cloudflare, dando um domínio HTTPS **gratuito**!

```
Frontend (HTTPS) → Cloudflare (HTTPS) → Tunnel → Seu Servidor (HTTP)
✅ Sem Mixed Content!
✅ Sem configurar SSL!
✅ Sem abrir portas!
```

---

## ⚡ Setup Rápido (15 minutos)

### **Passo 1: Criar Conta Cloudflare**

1. Acesse: https://dash.cloudflare.com/sign-up
2. Crie conta grátis (não precisa de domínio)

---

### **Passo 2: Instalar Cloudflared no Servidor**

SSH no seu servidor:

```bash
ssh seu-usuario@45.55.95.48

# Baixar cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Instalar
sudo dpkg -i cloudflared-linux-amd64.deb

# Verificar instalação
cloudflared --version
```

---

### **Passo 3: Autenticar com Cloudflare**

```bash
cloudflared tunnel login
```

Isso vai abrir um link no browser. Acesse e autorize.

---

### **Passo 4: Criar Túnel**

```bash
# Criar túnel chamado "rentals-prod"
cloudflared tunnel create rentals-prod

# Isso vai gerar um UUID e criar credenciais
# Anote o UUID que aparece!
```

---

### **Passo 5: Configurar Roteamento**

Criar arquivo de configuração:

```bash
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

Cole este conteúdo (substitua `UUID` pelo seu):

```yaml
tunnel: UUID-DO-SEU-TUNNEL
credentials-file: /root/.cloudflared/UUID-DO-SEU-TUNNEL.json

ingress:
  # Produção
  - hostname: rentals-prod-api.trycloudflare.com
    service: http://localhost:3002

  # Dev (opcional)
  - hostname: rentals-dev-api.trycloudflare.com
    service: http://localhost:3000

  # Catch-all (obrigatório)
  - service: http_status:404
```

**NOTA**: Se você não tem domínio próprio, use `trycloudflare.com` que é grátis!

---

### **Passo 6: Criar Rotas no Cloudflare Dashboard**

```bash
# Criar rota para produção
cloudflared tunnel route dns rentals-prod-api rentals-prod-api.trycloudflare.com

# Se o comando acima não funcionar, use o dashboard:
# https://dash.cloudflare.com → Zero Trust → Access → Tunnels
```

Ou configure manualmente no dashboard:
1. Vá em **Zero Trust** → **Access** → **Tunnels**
2. Selecione seu túnel
3. Adicione hostname: `rentals-prod-api.trycloudflare.com` → `http://localhost:3002`

---

### **Passo 7: Iniciar Túnel**

```bash
# Teste primeiro
cloudflared tunnel run rentals-prod

# Se funcionar, configurar como serviço
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Verificar status
sudo systemctl status cloudflared
```

---

### **Passo 8: Testar**

```bash
# Testar a URL
curl https://rentals-prod-api.trycloudflare.com/health

# Deve retornar: {"status":"ok"}
```

---

### **Passo 9: Configurar Vercel**

Na Vercel, configure:

```
VITE_API_URL=https://rentals-prod-api.trycloudflare.com
```

Faça redeploy e **pronto**! ✅

---

## 🎯 Com Domínio Próprio (Opcional)

Se você TIVER um domínio (ex: seudominio.com):

### **Passo 1: Adicionar Domínio ao Cloudflare**

1. Dashboard → **Add Site**
2. Digite seu domínio
3. Escolha plano **Free**
4. Atualize nameservers no registrador do domínio

### **Passo 2: Configurar Túnel com Seu Domínio**

Edite `/etc/cloudflared/config.yml`:

```yaml
tunnel: UUID-DO-SEU-TUNNEL
credentials-file: /root/.cloudflared/UUID-DO-SEU-TUNNEL.json

ingress:
  # Produção com seu domínio
  - hostname: api.seudominio.com
    service: http://localhost:3002

  # Dev
  - hostname: api-dev.seudominio.com
    service: http://localhost:3000

  - service: http_status:404
```

### **Passo 3: Criar DNS Records**

```bash
cloudflared tunnel route dns rentals-prod api.seudominio.com
cloudflared tunnel route dns rentals-prod api-dev.seudominio.com
```

### **Passo 4: Reiniciar Túnel**

```bash
sudo systemctl restart cloudflared
```

### **Passo 5: Usar na Vercel**

```
VITE_API_URL=https://api.seudominio.com
```

---

## ✅ Vantagens do Cloudflare Tunnel

- ✅ **HTTPS gratuito** (certificado automático)
- ✅ **Sem configurar SSL** no servidor
- ✅ **Sem abrir portas** (mais seguro)
- ✅ **DDoS protection** grátis
- ✅ **Firewall** da Cloudflare
- ✅ **Cache** automático (opcional)
- ✅ Funciona com **IP dinâmico**

---

## 🔧 Comandos Úteis

```bash
# Ver túneis
cloudflared tunnel list

# Ver rotas
cloudflared tunnel route dns

# Logs em tempo real
sudo journalctl -u cloudflared -f

# Parar serviço
sudo systemctl stop cloudflared

# Remover túnel
cloudflared tunnel delete rentals-prod
```

---

## 🚨 Troubleshooting

### Erro: "tunnel credentials file doesn't exist"

```bash
# Verificar onde está o arquivo de credenciais
ls -la ~/.cloudflared/

# Copiar para /root se necessário
sudo cp ~/.cloudflared/*.json /root/.cloudflared/
```

### Erro: "failed to sufficiently increase receive buffer size"

Ignorar - não afeta funcionamento.

### Túnel não conecta

```bash
# Ver logs detalhados
cloudflared tunnel run rentals-prod --loglevel debug
```

---

## 📊 Resumo

1. ✅ Instalar cloudflared
2. ✅ Criar túnel
3. ✅ Configurar config.yml
4. ✅ Iniciar como serviço
5. ✅ Testar URL HTTPS
6. ✅ Configurar na Vercel
7. 🎉 Funciona!

---

## 🆚 Comparação com Outras Soluções

| Solução | Custo | Complexidade | HTTPS |
|---------|-------|--------------|-------|
| Cloudflare Tunnel | Grátis | Baixa | ✅ Sim |
| Let's Encrypt + NGINX | Grátis | Média | ✅ Sim |
| Vercel Proxy | Grátis | Baixa | ✅ Sim |
| Ngrok | $8-20/mês | Muito Baixa | ✅ Sim |

**Recomendação**: Cloudflare Tunnel para produção séria!

---

## 🔗 Links Úteis

- Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Dashboard: https://dash.cloudflare.com
- Community: https://community.cloudflare.com
