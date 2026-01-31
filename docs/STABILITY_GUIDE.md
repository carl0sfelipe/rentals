# Guia de Operação e Estabilidade (Dev vs Prod)

Este documento resume as lições aprendidas durante o incidente de 30/01/2026 e define o fluxo de trabalho para evitar quebras em produção.

## 🚀 Fluxo de Trabalho (Workflow)

Sempre desenvolva na `main` e publique na `prod`.

1. **Desenvolvimento (Branch `main`):**
   - Use para novas funcionalidades e testes.
   - O `nginx.conf` aqui pode ser genérico.
   - Commit e Push para o GitHub.

2. **Produção (Branch `prod`):**
   - **Nunca** edite diretamente na `prod` a menos que seja um fix de infraestrutura.
   - Para atualizar: `git checkout prod` -> `git merge main` -> `git push origin prod`.
   - O `nginx.conf` aqui DEVE apontar para `127.0.0.1:3000` (IP local do Droplet).

## 🛡️ Regras de Ouro (Anti-Quebra)

### 1. Travamento do Prisma (Versionamento)
Nunca use `^` ou `latest` nas dependências do Prisma no `package.json`. 
A versão **6.16.1** é a última estável para o nosso schema atual. A versão 7 introduziu mudanças que quebram o deploy se não forem migradas corretamente.

### 2. Sincronização de Banco (Prisma Push)
Sempre que o `prisma/schema.prisma` for alterado, o comando `db push` deve ser executado no servidor imediatamente após o build do Docker:
```bash
docker compose exec api ./node_modules/.bin/prisma db push
```

### 3. Limpeza de Cache do Docker
Se o servidor se comportar de forma estranha após um deploy (ex: ignorando campos novos), force um build sem cache:
```bash
docker compose build --no-cache api
```

### 4. Nginx do Sistema vs Nginx do Projeto
O Ubuntu prioriza arquivos em `/etc/nginx/sites-enabled/`. Lembre-se que editar o `nginx.conf` na pasta do projeto não altera o comportamento do servidor se ele estiver usando um arquivo externo.

## 📋 Checklist de Deploy no Droplet
1. `git pull origin prod`
2. `docker compose up -d --build`
3. `docker compose exec api ./node_modules/.bin/prisma db push`
4. `systemctl restart nginx`

---
*Documento criado para garantir a continuidade do SaaS Rentals.*
