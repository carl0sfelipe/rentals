# 🚀 Guia de Instalação Personalizado - Nginx + HTTPS

## 📋 Configuração do Seu Ambiente

- **IP do Droplet:** 45.55.95.48
- **Domínio (nip.io):** dev-3000-45-55-95-48.nip.io
- **Front-end Vercel:** https://rentals-dev-zeta.vercel.app
- **Backend Porta:** 3000

---

## 🎯 O Problema que Você Está Enfrentando

```
❌ HTTPS (Vercel) → HTTP (Droplet) = Mixed Content BLOQUEADO

Erro atual:
"Blocked loading mixed active content 'http://45.55.95.48:3000/...'"
```

## ✅ A Solução

```
✅ HTTPS (Vercel) → HTTPS (Nginx) → HTTP (localhost:3000)

Após configurar:
https://rentals-dev-zeta.vercel.app → https://dev-3000-45-55-95-48.nip.io → http://localhost:3000
```

---

## 🚀 Instalação em 3 Passos Simples

### **Passo 1: Conectar ao Droplet**

```bash
ssh root@45.55.95.48
```

---

### **Passo 2: Baixar e Executar Script de Instalação**

Copie e cole este comando único:

```bash
curl -o setup-nginx-https.sh https://raw.githubusercontent.com/carl0sfelipe/rentals/claude/nginx-https-dev-environment-011CV52shdxTufCktuvYCWSW/setup-nginx-https.sh && chmod +x setup-nginx-https.sh && sudo ./setup-nginx-https.sh
```

**Ou se preferir fazer passo a passo:**

```bash
# 1. Baixar o script
curl -o setup-nginx-https.sh https://raw.githubusercontent.com/carl0sfelipe/rentals/claude/nginx-https-dev-environment-011CV52shdxTufCktuvYCWSW/setup-nginx-https.sh

# 2. Dar permissão de execução
chmod +x setup-nginx-https.sh

# 3. Executar
sudo ./setup-nginx-https.sh
```

O script vai fazer **tudo automaticamente**:
- ✅ Instalar Nginx
- ✅ Configurar Firewall
- ✅ Instalar Certbot
- ✅ Criar configuração com CORS para Vercel
- ✅ Obter certificado SSL
- ✅ Configurar renovação automática

**Aguarde 2-3 minutos** enquanto o script executa.

---

### **Passo 3: Atualizar URL da API no Front-end**

No seu código do front-end (Vercel), mude a URL da API de:

```javascript
// ❌ ANTES (HTTP - bloqueado)
const API_URL = "http://45.55.95.48:3000"

// ✅ DEPOIS (HTTPS - funciona!)
const API_URL = "https://dev-3000-45-55-95-48.nip.io"
```

**Onde encontrar?** Provavelmente em:
- `src/config.ts`
- `src/services/api.ts`
- `.env` ou `.env.development`

---

## ✅ Testar a Configuração

### 1. Testar no Terminal (dentro do Droplet)

```bash
# Verificar HTTP → HTTPS redirect
curl -I http://dev-3000-45-55-95-48.nip.io

# Verificar HTTPS funcionando
curl -I https://dev-3000-45-55-95-48.nip.io

# Verificar backend local
curl http://localhost:3000
```

### 2. Testar no Navegador

Abra no navegador:
```
https://dev-3000-45-55-95-48.nip.io
```

Você deve ver:
- 🔒 **Cadeado verde** (SSL válido)
- Resposta da sua API

### 3. Testar no Front-end

1. Atualize a URL da API no código
2. Faça deploy no Vercel
3. Tente publicar um anúncio novamente
4. **Sucesso!** Sem erros de Mixed Content 🎉

---

## 🐛 Se Algo Der Errado

### Backend não está rodando?

```bash
# Verificar se está rodando
ps aux | grep node
netstat -tulpn | grep 3000

# Se não estiver, iniciar (ajuste conforme seu setup)
cd /caminho/do/seu/projeto
npm start
# ou
pm2 start ecosystem.config.js
```

### Erro 502 Bad Gateway?

```bash
# Ver logs do Nginx
sudo tail -f /var/log/nginx/dev-api-error.log

# Verificar se backend responde
curl http://localhost:3000

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Certbot falhou?

```bash
# Tentar novamente manualmente
sudo certbot --nginx -d dev-3000-45-55-95-48.nip.io

# Ver logs detalhados
sudo certbot --nginx -d dev-3000-45-55-95-48.nip.io --verbose
```

### CORS ainda bloqueado?

```bash
# Verificar configuração
sudo cat /etc/nginx/sites-available/dev-api | grep Allow-Origin

# Deve mostrar:
# add_header Access-Control-Allow-Origin "https://rentals-dev-zeta.vercel.app" always;

# Se precisar editar:
sudo nano /etc/nginx/sites-available/dev-api

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 📝 Comandos Úteis

```bash
# Status do Nginx
sudo systemctl status nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Testar configuração
sudo nginx -t

# Ver logs em tempo real
sudo tail -f /var/log/nginx/dev-api-error.log
sudo tail -f /var/log/nginx/dev-api-access.log

# Listar certificados
sudo certbot certificates

# Testar renovação
sudo certbot renew --dry-run

# Verificar firewall
sudo ufw status verbose
```

---

## 🎉 Resultado Final

Depois de completar:

✅ **API acessível via HTTPS:**
   https://dev-3000-45-55-95-48.nip.io

✅ **Cadeado verde no navegador** 🔒

✅ **Front-end Vercel pode chamar API sem erros**

✅ **Mixed Content resolvido!**

✅ **Certificado SSL válido (Let's Encrypt)**

✅ **Renovação automática configurada**

---

## 💡 Próximos Passos (Opcional)

Quando quiser um domínio próprio:

1. Compre um domínio (ex: meusite.com)
2. Configure DNS: `dev.api.meusite.com → 45.55.95.48`
3. Edite `/etc/nginx/sites-available/dev-api` trocando `dev-3000-45-55-95-48.nip.io` por `dev.api.meusite.com`
4. Execute: `sudo certbot --nginx -d dev.api.meusite.com`
5. Pronto! Domínio profissional com HTTPS 🚀

---

## 📞 Precisa de Ajuda?

Se encontrar problemas:

1. **Verifique os logs:**
   ```bash
   sudo tail -f /var/log/nginx/dev-api-error.log
   ```

2. **Verifique o status:**
   ```bash
   sudo systemctl status nginx
   sudo netstat -tulpn | grep 3000
   ```

3. **Reinicie tudo:**
   ```bash
   sudo systemctl restart nginx
   ```

---

## ✅ Checklist Final

- [ ] Script executado com sucesso
- [ ] Nginx rodando (`sudo systemctl status nginx`)
- [ ] Firewall configurado (`sudo ufw status`)
- [ ] Certificado SSL obtido (`sudo certbot certificates`)
- [ ] Backend respondendo (`curl http://localhost:3000`)
- [ ] HTTPS funcionando (`curl https://dev-3000-45-55-95-48.nip.io`)
- [ ] URL atualizada no front-end
- [ ] Deploy feito no Vercel
- [ ] Teste completo no navegador (publicar anúncio)

---

**Pronto! Seu ambiente dev está configurado com HTTPS!** 🎉🔒
