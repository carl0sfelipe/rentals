# Referência Rápida: Nginx + HTTPS Setup

## 🚀 Comandos Essenciais (Copy & Paste)

### Instalação Inicial
```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Nginx
sudo apt install nginx -y

# 3. Configurar firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 4. Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y
```

---

## 📝 Setup Ambiente Dev (dev.api.meudominio.com → porta 3000)

```bash
# 1. Copiar arquivo de configuração do repositório para o servidor
sudo nano /etc/nginx/sites-available/dev-api
# Cole o conteúdo de docs/nginx/dev-api

# 2. Editar CORS (linha ~32)
# Alterar: add_header Access-Control-Allow-Origin "https://seu-frontend-dev.vercel.app" always;

# 3. Ativar site
sudo ln -s /etc/nginx/sites-available/dev-api /etc/nginx/sites-enabled/

# 4. Remover default (opcional)
sudo rm /etc/nginx/sites-enabled/default

# 5. Testar configuração
sudo nginx -t

# 6. Reiniciar Nginx
sudo systemctl restart nginx

# 7. Obter certificado SSL
sudo certbot --nginx -d dev.api.meudominio.com

# 8. Verificar
curl -I https://dev.api.meudominio.com
```

---

## 📝 Setup Ambiente Test (test.api.meudominio.com → porta 3001)

```bash
# 1. Copiar arquivo de configuração
sudo nano /etc/nginx/sites-available/test-api
# Cole o conteúdo de docs/nginx/test-api

# 2. Editar CORS
# Alterar: add_header Access-Control-Allow-Origin "https://seu-frontend-test.vercel.app" always;

# 3. Ativar site
sudo ln -s /etc/nginx/sites-available/test-api /etc/nginx/sites-enabled/

# 4. Testar
sudo nginx -t

# 5. Reiniciar
sudo systemctl restart nginx

# 6. SSL
sudo certbot --nginx -d test.api.meudominio.com

# 7. Verificar
curl -I https://test.api.meudominio.com
```

---

## 📝 Setup Ambiente Prod (api.meudominio.com → porta 3002)

```bash
# 1. Copiar arquivo de configuração
sudo nano /etc/nginx/sites-available/prod-api
# Cole o conteúdo de docs/nginx/prod-api

# 2. Editar CORS
# Alterar: add_header Access-Control-Allow-Origin "https://seu-frontend-prod.vercel.app" always;

# 3. Ativar site
sudo ln -s /etc/nginx/sites-available/prod-api /etc/nginx/sites-enabled/

# 4. Testar
sudo nginx -t

# 5. Reiniciar
sudo systemctl restart nginx

# 6. SSL
sudo certbot --nginx -d api.meudominio.com

# 7. Verificar
curl -I https://api.meudominio.com
```

---

## 🔧 Comandos de Manutenção

### Nginx
```bash
# Status
sudo systemctl status nginx

# Reiniciar
sudo systemctl restart nginx

# Recarregar (sem downtime)
sudo systemctl reload nginx

# Testar configuração
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/dev-api-error.log
sudo tail -f /var/log/nginx/test-api-error.log
sudo tail -f /var/log/nginx/prod-api-error.log
```

### Certbot
```bash
# Listar certificados
sudo certbot certificates

# Renovar (dry-run)
sudo certbot renew --dry-run

# Renovar forçado
sudo certbot renew --force-renewal
```

### Firewall
```bash
# Status
sudo ufw status verbose

# Permitir porta
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## 🐛 Troubleshooting One-Liners

```bash
# Verificar backend rodando
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
netstat -tulpn | grep :3002

# Testar backend local
curl http://localhost:3000
curl http://localhost:3001
curl http://localhost:3002

# Verificar DNS
nslookup dev.api.meudominio.com
nslookup test.api.meudominio.com
nslookup api.meudominio.com

# Ver processos Nginx
ps aux | grep nginx

# Ver processos Node
ps aux | grep node

# Logs em tempo real
sudo journalctl -u nginx -f
```

---

## 📋 Checklist Pré-Instalação

- [ ] DNS configurado (A records apontando para IP do Droplet)
- [ ] Backend rodando nas portas corretas (3000, 3001, 3002)
- [ ] SSH access ao Droplet
- [ ] Domínios do Vercel definidos

---

## 🎯 Arquitetura Resumida

```
Vercel (HTTPS)
    ↓
dev.api.meudominio.com:443 (HTTPS) → localhost:3000 (HTTP)
test.api.meudominio.com:443 (HTTPS) → localhost:3001 (HTTP)
api.meudominio.com:443 (HTTPS) → localhost:3002 (HTTP)
```

**Nginx faz:**
- ✅ Termina SSL/TLS
- ✅ Redireciona HTTP → HTTPS
- ✅ Proxy reverso para Node.js
- ✅ Gerencia CORS
- ✅ Adiciona headers de segurança

**Node.js faz:**
- ✅ Roda HTTP simples em localhost
- ✅ Nunca lida com HTTPS diretamente
- ✅ Recebe tráfego apenas do Nginx
