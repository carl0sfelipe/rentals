# 🚀 Sistema Rentals - Configuração de Ambientes

## 🌟 Separação de Ambientes Implementada

Agora o sistema possui **ambientes completamente separados** para desenvolvimento e testes:

### 📂 Arquivos de Configuração

```
├── .env.development    # 🔧 Desenvolvimento (DB porta 5433)
├── .env.test          # 🧪 Testes (DB porta 5434)
├── docker-compose.yml # 🏗️ Stack desenvolvimento
└── docker-compose.test.yml # 🧪 Stack testes
```

### 🎯 Benefícios da Separação

✅ **Dados de desenvolvimento preservados** - Não são mais afetados pelos testes  
✅ **Isolamento completo** - Testes rodam em banco separado  
✅ **Performance otimizada** - Ambientes independentes  
✅ **Seed scripts** - População automática de dados  

## 🚀 Como Usar

### 💻 Desenvolvimento

```bash
# Subir ambiente completo (API + Frontend + DB)
docker compose up --build

# Apenas o banco de desenvolvimento
npm run db:dev

# Popular dados iniciais
npm run seed:dev
```

**Acesso**: Frontend em http://localhost:5173 | API em http://localhost:3000

### 🧪 Testes

```bash
# Rodar todos os testes (47/47 ✅)
npm test

# Subir apenas banco de testes
npm run db:test

# Resetar banco de testes
npm run db:reset:test
```

### 👤 Usuário Padrão (Desenvolvimento)

- **Email**: admin@rentals.com
- **Senha**: admin123

## 🔧 Detalhes Técnicos

### Portas Utilizadas
- **5433**: PostgreSQL Desenvolvimento
- **5434**: PostgreSQL Testes  
- **3000**: API Desenvolvimento
- **3001**: API Testes
- **5173**: Frontend React

### Volumes Docker
- `pgdata_dev`: Dados persistentes desenvolvimento
- `pgdata_test`: Dados isolados de teste

## 🎉 Resultado

Agora você pode:
- Desenvolver sem perder dados
- Rodar testes com 100% de isolamento
- Manter performance otimizada
- Usar dados de exemplo automáticos

**Status**: ✅ Pronto para produção
