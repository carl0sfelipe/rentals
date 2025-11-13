# Guia Completo: Configuração Nginx + HTTPS para Múltiplos Ambientes

## 📋 Visão Geral

Este guia configura três ambientes da sua API no DigitalOcean usando **Nginx como reverse proxy** com **HTTPS**:

| Ambiente | Subdomínio | Porta Interna | Status SSL |
|----------|-----------|---------------|------------|
| **Dev** | dev.api.meudominio.com | 3000 | ✅ Configurar agora |
| **Test** | test.api.meudominio.com | 3001 | ⏸️ Template pronto |
| **Prod** | api.meudominio.com | 3002 | ⏸️ Template pronto |

---

## 🔐 Por Que Esta Arquitetura Funciona?

### Problema: Mixed Content Blocking
Quando seu front-end no Vercel (HTTPS) tenta chamar uma API via HTTP, navegadores **bloqueiam** essas requisições por segurança (mixed content).

### Solução: Reverse Proxy com HTTPS
```
┌─────────────────────────────────────────────────────────────┐
│ Front-end (Vercel)                                          │
│ https://seu-app.vercel.app                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTPS (seguro ✓)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Nginx (DigitalOcean Droplet)                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ https://dev.api.meudominio.com  (porta 443)             │ │
│ │         ▼                                                │ │
│ │ http://localhost:3000 (Node.js Dev)                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ https://test.api.meudominio.com (porta 443)             │ │
│ │         ▼                                                │ │
│ │ http://localhost:3001 (Node.js Test)                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ https://api.meudominio.com      (porta 443)             │ │
│ │         ▼                                                │ │
│ │ http://localhost:3002 (Node.js Prod)                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Benefícios:**
- ✅ Nginx escuta apenas nas portas 80 (HTTP) e 443 (HTTPS)
- ✅ Redireciona automaticamente HTTP → HTTPS
- ✅ Faz proxy interno para as portas 3000/3001/3002 (sem expor ao mundo)
- ✅ Certificados SSL gerenciados automaticamente pelo Let's Encrypt
- ✅ Navegadores aceitam HTTPS → HTTPS (sem mixed content)
- ✅ Cada ambiente isolado por subdomínio

---

## 🚀 Parte 1: Configuração Inicial do Servidor

### 1.1 Conectar ao Droplet
```bash
ssh root@seu-ip-do-droplet
```

### 1.2 Atualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Instalar Nginx
```bash
sudo apt install nginx -y
```

### 1.4 Verificar Status do Nginx
```bash
sudo systemctl status nginx
```

Você deve ver `active (running)` em verde.

---

## 🔥 Parte 2: Configurar Firewall

### 2.1 Verificar Status do UFW
```bash
sudo ufw status
```

### 2.2 Configurar Regras do Firewall
```bash
# Permitir SSH (importante para não perder acesso!)
sudo ufw allow 22/tcp

# Permitir HTTP (necessário para validação do Certbot)
sudo ufw allow 80/tcp

# Permitir HTTPS
sudo ufw allow 443/tcp

# Ativar firewall
sudo ufw enable

# Confirmar regras
sudo ufw status verbose
```

**Saída esperada:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## 📁 Parte 3: Configurar DNS (ANTES de prosseguir!)

⚠️ **IMPORTANTE:** Configure os registros DNS **ANTES** de rodar o Certbot!

No seu provedor de DNS (DigitalOcean, Cloudflare, etc.), crie os seguintes registros **A**:

| Nome | Tipo | Valor | TTL |
|------|------|-------|-----|
| dev.api.meudominio.com | A | IP_DO_DROPLET | 3600 |
| test.api.meudominio.com | A | IP_DO_DROPLET | 3600 |
| api.meudominio.com | A | IP_DO_DROPLET | 3600 |

**Verificar propagação DNS:**
```bash
# Verificar Dev
nslookup dev.api.meudominio.com

# Verificar Test
nslookup test.api.meudominio.com

# Verificar Prod
nslookup api.meudominio.com
```

Aguarde alguns minutos até que os registros DNS sejam propagados.

---

## 🛠️ Parte 4: Configurar Nginx (Ambiente Dev)

### 4.1 Criar Arquivo de Configuração

Copie o conteúdo do arquivo `docs/nginx/dev-api` deste repositório:

```bash
sudo nano /etc/nginx/sites-available/dev-api
```

**Cole o conteúdo completo do arquivo `docs/nginx/dev-api`**

⚠️ **IMPORTANTE:** Edite as seguintes linhas no arquivo:

```nginx
# Linha ~32: Altere para o domínio do seu front-end Vercel
add_header Access-Control-Allow-Origin "https://seu-frontend-dev.vercel.app" always;
```

### 4.2 Ativar Site (criar symlink)
```bash
sudo ln -s /etc/nginx/sites-available/dev-api /etc/nginx/sites-enabled/
```

### 4.3 Remover Configuração Padrão (opcional)
```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 4.4 Testar Configuração
```bash
sudo nginx -t
```

**Saída esperada:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 4.5 Reiniciar Nginx
```bash
sudo systemctl restart nginx
```

### 4.6 Verificar Status
```bash
sudo systemctl status nginx
```

---

## 🔐 Parte 5: Instalar Certbot e Configurar SSL (Ambiente Dev)

### 5.1 Instalar Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Obter Certificado SSL

⚠️ **Certifique-se de que:**
- O DNS está apontando para o IP do seu Droplet
- Nginx está rodando
- Firewall permite porta 80 e 443

```bash
sudo certbot --nginx -d dev.api.meudominio.com
```

**Durante a instalação:**
1. Digite seu e-mail
2. Aceite os termos de serviço (Y)
3. Escolha se deseja compartilhar e-mail (N ou Y)
4. Certbot irá automaticamente configurar o SSL no arquivo `/etc/nginx/sites-available/dev-api`

### 5.3 Verificar Renovação Automática
```bash
# Testar renovação (dry-run)
sudo certbot renew --dry-run
```

O Certbot configura automaticamente um cronjob para renovar os certificados.

### 5.4 Verificar Certificado
```bash
sudo certbot certificates
```

---

## ✅ Parte 6: Testar a Configuração

### 6.1 Verificar Backend Rodando
```bash
# Verificar se sua aplicação está rodando na porta 3000
curl http://localhost:3000

# Ou verificar processos Node.js
ps aux | grep node
```

### 6.2 Testar HTTP → HTTPS Redirect
```bash
curl -I http://dev.api.meudominio.com
```

**Saída esperada:**
```
HTTP/1.1 301 Moved Permanently
Location: https://dev.api.meudominio.com/
```

### 6.3 Testar HTTPS
```bash
curl -I https://dev.api.meudominio.com
```

**Saída esperada:**
```
HTTP/2 200
strict-transport-security: max-age=31536000; includeSubDomains
...
```

### 6.4 Testar no Navegador
Abra no navegador:
```
https://dev.api.meudominio.com
```

Você deve ver:
- 🔒 Cadeado verde (SSL válido)
- Resposta da sua API

### 6.5 Verificar Logs (se houver erro)
```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/dev-api-error.log
sudo tail -f /var/log/nginx/dev-api-access.log

# Logs do sistema
sudo journalctl -u nginx -f
```

---

## 📦 Parte 7: Templates para Test e Prod (Para Depois)

### Ambiente Test (porta 3001)

Quando estiver pronto para configurar o ambiente Test:

```bash
# 1. Copiar template
sudo cp docs/nginx/test-api /etc/nginx/sites-available/test-api

# 2. Editar CORS (ajustar domínio Vercel)
sudo nano /etc/nginx/sites-available/test-api

# 3. Ativar site
sudo ln -s /etc/nginx/sites-available/test-api /etc/nginx/sites-enabled/

# 4. Testar configuração
sudo nginx -t

# 5. Reiniciar Nginx
sudo systemctl restart nginx

# 6. Obter certificado SSL
sudo certbot --nginx -d test.api.meudominio.com
```

### Ambiente Prod (porta 3002)

Quando estiver pronto para configurar o ambiente Prod:

```bash
# 1. Copiar template
sudo cp docs/nginx/prod-api /etc/nginx/sites-available/prod-api

# 2. Editar CORS (ajustar domínio Vercel)
sudo nano /etc/nginx/sites-available/prod-api

# 3. Ativar site
sudo ln -s /etc/nginx/sites-available/prod-api /etc/nginx/sites-enabled/

# 4. Testar configuração
sudo nginx -t

# 5. Reiniciar Nginx
sudo systemctl restart nginx

# 6. Obter certificado SSL
sudo certbot --nginx -d api.meudominio.com
```

---

## 🎯 Checklist Final

### Ambiente Dev
- [ ] DNS configurado (dev.api.meudominio.com → IP do Droplet)
- [ ] Nginx instalado e rodando
- [ ] Firewall configurado (portas 22, 80, 443)
- [ ] Arquivo `/etc/nginx/sites-available/dev-api` criado
- [ ] CORS configurado com domínio Vercel correto
- [ ] Symlink criado em `/etc/nginx/sites-enabled/`
- [ ] Nginx reiniciado sem erros
- [ ] Certbot executado com sucesso
- [ ] Certificado SSL ativo e válido
- [ ] HTTP redireciona para HTTPS
- [ ] API acessível via HTTPS
- [ ] Front-end Vercel consegue chamar a API

### Próximos Passos (Test e Prod)
- [ ] Repetir processo para test.api.meudominio.com
- [ ] Repetir processo para api.meudominio.com

---

## 🐛 Troubleshooting

### Erro: "Connection refused"
```bash
# Verificar se backend está rodando
netstat -tulpn | grep :3000

# Se não estiver, inicie sua aplicação Node.js
cd /caminho/do/seu/projeto
npm start  # ou pm2 start, etc.
```

### Erro: "502 Bad Gateway"
```bash
# Verificar logs do Nginx
sudo tail -f /var/log/nginx/dev-api-error.log

# Verificar se aplicação Node.js está respondendo
curl http://localhost:3000
```

### Erro: Certbot falha
```bash
# Verificar DNS
nslookup dev.api.meudominio.com

# Verificar porta 80 aberta
sudo ufw status | grep 80

# Verificar Nginx rodando
sudo systemctl status nginx

# Tentar com verbose
sudo certbot --nginx -d dev.api.meudominio.com --verbose
```

### Erro: CORS ainda bloqueado
```bash
# Editar configuração do Nginx
sudo nano /etc/nginx/sites-available/dev-api

# Verificar linha do Access-Control-Allow-Origin
# Mudar para o domínio correto do Vercel
add_header Access-Control-Allow-Origin "https://seu-frontend.vercel.app" always;

# Ou permitir todos (APENAS para testes)
add_header Access-Control-Allow-Origin "*" always;

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 📚 Comandos Úteis

### Gerenciar Nginx
```bash
# Iniciar
sudo systemctl start nginx

# Parar
sudo systemctl stop nginx

# Reiniciar
sudo systemctl restart nginx

# Recarregar configuração (sem downtime)
sudo systemctl reload nginx

# Status
sudo systemctl status nginx

# Testar configuração
sudo nginx -t
```

### Gerenciar Certificados
```bash
# Listar certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# Renovar específico
sudo certbot renew --cert-name dev.api.meudominio.com

# Deletar certificado
sudo certbot delete --cert-name dev.api.meudominio.com
```

### Monitorar Logs
```bash
# Logs de acesso (Dev)
sudo tail -f /var/log/nginx/dev-api-access.log

# Logs de erro (Dev)
sudo tail -f /var/log/nginx/dev-api-error.log

# Logs gerais do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🎓 Entendendo a Configuração

### Estrutura do Nginx
```
/etc/nginx/
├── nginx.conf                    # Configuração principal
├── sites-available/              # Todos os sites disponíveis
│   ├── dev-api                   # Dev environment
│   ├── test-api                  # Test environment
│   └── prod-api                  # Prod environment
├── sites-enabled/                # Sites ativos (symlinks)
│   ├── dev-api → ../sites-available/dev-api
│   ├── test-api → ../sites-available/test-api
│   └── prod-api → ../sites-available/prod-api
```

### Como Funciona o Reverse Proxy

1. **Cliente faz requisição:**
   ```
   https://dev.api.meudominio.com/users
   ```

2. **Nginx recebe na porta 443 (HTTPS):**
   - Verifica certificado SSL
   - Processa headers de segurança
   - Aplica regras CORS

3. **Nginx faz proxy para localhost:**
   ```
   http://localhost:3000/users
   ```

4. **Node.js responde:**
   - Aplicação processa requisição
   - Retorna resposta para Nginx

5. **Nginx retorna ao cliente:**
   - Adiciona headers HTTPS
   - Encripta resposta
   - Envia para o navegador

**Importante:** O Node.js **nunca** vê tráfego HTTPS diretamente. Nginx gerencia toda a camada SSL/TLS.

---

## 🔄 Fluxo de Trabalho Completo

### Desenvolvimento Local
```bash
# Rodar localmente sem SSL
npm run start:dev
# API: http://localhost:3000
```

### Desenvolvimento no Droplet (Dev)
```bash
# Deploy no ambiente Dev
npm run start:dev  # ou pm2 start ecosystem.config.js --env development
# API: https://dev.api.meudominio.com (via Nginx)
```

### Testes no Droplet (Test)
```bash
# Deploy no ambiente Test
npm run start:test  # ou pm2 start ecosystem.config.js --env test
# API: https://test.api.meudominio.com (via Nginx)
```

### Produção no Droplet (Prod)
```bash
# Deploy no ambiente Prod
npm run start:prod  # ou pm2 start ecosystem.config.js --env production
# API: https://api.meudominio.com (via Nginx)
```

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs:**
   ```bash
   sudo tail -f /var/log/nginx/dev-api-error.log
   ```

2. **Teste a configuração:**
   ```bash
   sudo nginx -t
   ```

3. **Reinicie o Nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

4. **Verifique DNS:**
   ```bash
   nslookup dev.api.meudominio.com
   ```

5. **Verifique firewall:**
   ```bash
   sudo ufw status verbose
   ```

---

## ✅ Conclusão

Após concluir este guia, você terá:

✅ Nginx configurado como reverse proxy
✅ HTTPS funcionando com Let's Encrypt
✅ Redirecionamento automático HTTP → HTTPS
✅ Ambiente Dev totalmente funcional
✅ Templates prontos para Test e Prod
✅ CORS configurado para Vercel
✅ Certificados SSL com renovação automática
✅ Arquitetura escalável e segura

Seu front-end no Vercel (HTTPS) agora pode chamar sua API (HTTPS) sem problemas de mixed content! 🎉
