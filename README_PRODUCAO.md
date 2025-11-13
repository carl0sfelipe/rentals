# 🚀 Guia de Produção - Rentals API

## ⚡ Quick Start - Deploy Rápido e Seguro

### Passo 1: Validar Ambiente
```bash
# Execute SEMPRE antes de subir containers
./validate-environment.sh
```

Se houver erros ❌, corrija antes de continuar!

### Passo 2: Subir Containers
```bash
# Subir todos os serviços
docker compose -f docker-compose.production.yml up -d

# Verificar status
docker compose -f docker-compose.production.yml ps
```

### Passo 3: Testar
```bash
# Health check
curl https://api-45-55-95-48.sslip.io/health

# Deve retornar: {"status":"ok"}
```

✅ Se retornar OK, está funcionando!

---

## 📚 Documentação Completa

- **Prevenir erros de CORS/503**: Ver [PREVENIR_ERROS_CORS.md](./PREVENIR_ERROS_CORS.md)
- **Aplicar correções no servidor**: Ver [APLICAR_CORRECAO_SERVIDOR.md](./APLICAR_CORRECAO_SERVIDOR.md)
- **Diagnosticar erro 503**: Ver [CORRIGIR_503_CORS.md](./CORRIGIR_503_CORS.md)

---

## 🛠️ Scripts Úteis

| Script | Função |
|--------|--------|
| `./validate-environment.sh` | Valida configuração antes de subir |
| `./fix-503-error.sh` | Diagnóstico automático de erro 503 |

---

## 🔥 Troubleshooting Rápido

### Erro: CORS
```bash
# Ver documentação completa
cat PREVENIR_ERROS_CORS.md
```

### Erro: 503
```bash
./fix-503-error.sh
```

### Ver logs
```bash
# Logs de todos os serviços
docker compose -f docker-compose.production.yml logs -f

# Logs apenas do backend
docker compose -f docker-compose.production.yml logs -f api-prod

# Logs apenas do nginx
docker compose -f docker-compose.production.yml logs -f nginx
```

---

## ⚠️ REGRAS DE OURO

1. **Sempre** rode `./validate-environment.sh` antes de fazer deploy
2. **Nunca** adicione headers CORS no nginx.conf
3. **Nunca** use ciphers SSL SHA512
4. **Sempre** configure `.env` com variáveis corretas
5. **Sempre** teste em dev antes de prod

---

## 📞 Contato

Problemas? Ver documentação completa em `PREVENIR_ERROS_CORS.md`
