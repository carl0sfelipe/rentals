# Rentals - Sistema Completo de Gestão de Propriedades

Sistema completo para gerenciamento de propriedades de aluguel com:
- **Backend**: API NestJS com autenticação JWT
- **Frontend**: Interface React moderna com Tailwind CSS
- **Banco de Dados**: PostgreSQL
- **Containerização**: Docker Compose para desenvolvimento

## 🚀 Stack Tecnológica

### Backend
- **NestJS** - Framework Node.js escalável
- **Prisma** - ORM moderno para TypeScript
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação segura
- **Vitest** - Testes E2E

### Frontend
- **React 18** - Biblioteca UI moderna
- **Vite** - Build tool rápido
- **Tailwind CSS** - Framework CSS utilitário
- **React Hooks** - Gerenciamento de estado

## 📋 Funcionalidades

### ✅ Backend Implementado
- **Autenticação**: Login/registro com JWT
- **CRUD Propriedades**: Gerenciamento completo
- **Sistema de Bookings**: Criação de bloqueios/reservas
- **Calendário iCalendar**: Exportação no formato .ics
- **Testes E2E**: 38 testes passando (100%)

### ✅ Frontend Implementado
- **Dashboard Moderno**: Interface responsiva e intuitiva
- **Autenticação**: Login com persistência de sessão
- **Gestão de Propriedades**: Visualização em cartões
- **Criação de Bloqueios**: Formulários inline
- **Download de Calendários**: Links diretos para .ics

## 🐳 Executando com Docker

### Requisitos
- Docker
- Docker Compose
- Arquivo `.env` (copie de `.env.example`)

### Comando Principal
```bash
# Clone o repositório
git clone <repo-url>
cd rentals

# Copie o arquivo de ambiente
cp .env.example .env

# Execute todo o stack
docker compose up --build
```

### Acessos
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **Banco de Dados**: localhost:5433

### Comandos Úteis
```bash
# Executar apenas o backend + banco
docker compose up api db

# Executar testes E2E
docker compose run --rm test npm run test:e2e

# Executar migrações
docker compose exec api npx prisma migrate dev

# Ver logs de um serviço específico
docker compose logs -f frontend
docker compose logs -f api

# Parar todos os serviços
docker compose down

# Rebuild completo
docker compose down && docker compose up --build
```

## 🧪 Testes

### Executar todos os testes E2E
```bash
docker compose run --rm test npm run test:e2e
```

### Categorias de Teste
- **Autenticação**: Login, registro, validações
- **Propriedades**: CRUD completo com autorização
- **Bookings**: Criação de bloqueios/reservas
- **Calendário**: Exportação iCalendar com 7 cenários

## 📁 Estrutura do Projeto

```
rentals/
├── src/                    # Código fonte da API
│   ├── auth/              # Módulo de autenticação
│   ├── properties/        # Módulo de propriedades
│   ├── bookings/          # Módulo de bookings
│   └── prisma/            # Configuração Prisma
├── frontend/              # Aplicação React
│   ├── App.jsx           # Componente principal (arquivo único)
│   ├── src/              # Arquivos de entrada
│   └── public/           # Assets estáticos
├── test/                  # Testes E2E
├── prisma/               # Schema e migrações
├── docker-compose.yml    # Orquestração de containers
└── .env.example         # Variáveis de ambiente
```

## 🔗 Endpoints da API

### Autenticação
- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login (retorna JWT)

### Propriedades (requer autenticação)
- `GET /properties` - Listar propriedades do usuário
- `POST /properties` - Criar nova propriedade
- `GET /properties/:id` - Detalhes de uma propriedade
- `PATCH /properties/:id` - Atualizar propriedade
- `DELETE /properties/:id` - Deletar propriedade

### Bookings (requer autenticação)
- `POST /properties/:id/bookings` - Criar bloqueio/reserva

### Calendário (público)
- `GET /properties/:id/calendar.ics` - Download do calendário

## 🎨 Frontend - Componentes

### Arquivo Único: `frontend/App.jsx`
```javascript
// Contexto de autenticação global
AuthContext + useAuth()

// Componentes principais
- LoginPage      // Tela de login
- DashboardPage  // Dashboard principal
- PropertyCard   // Cartão de propriedade
- LoadingSpinner // Indicador de carregamento

// Gerenciamento de estado
- localStorage   // Persistência de sessão
- useState       // Estado local
- useEffect      // Efeitos colaterais
```

## 🌐 Proxy e Comunicação

O frontend usa proxy do Vite para comunicar com a API:
- Requisições `/api/*` → `http://api:3000/*` (Docker)
- Configurado automaticamente no `vite.config.js`

## 📊 Status do Projeto

### ✅ Completo e Funcional
- Backend com API completa
- Frontend com interface moderna
- Autenticação JWT
- Sistema de propriedades
- Sistema de bookings
- Exportação de calendários
- Containerização Docker
- Testes E2E (100% passando)

### 🚀 Pronto para Produção
O sistema está funcional e pode ser usado como base para:
1. **MVP**: Versão mínima viável
2. **Escalabilidade**: Adicionar novas funcionalidades
3. **Deploy**: Configurar para produção
4. **Integração**: APIs externas (pagamento, notificações)

## 🔧 Desenvolvimento

### Executar em modo de desenvolvimento
```bash
# Backend + Banco
docker compose up api db

# Frontend (separadamente se preferir)
cd frontend
npm install
npm run dev
```

### Variáveis de Ambiente (.env)
```env
# Banco de dados
DATABASE_URL="postgresql://postgres:password@db:5432/rentals"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=rentals
DB_HOST_PORT=5433

# JWT
JWT_SECRET=seu-jwt-secret-super-secreto
```

## 📈 Próximos Passos

1. **Deploy**: Configurar para produção (Heroku, AWS, etc.)
2. **Monitoramento**: Logs e métricas
3. **Cache**: Redis para performance
4. **CDN**: Para assets estáticos
5. **Notificações**: Email/SMS para bookings
6. **Pagamentos**: Integração com Stripe/PayPal
7. **Upload de Imagens**: AWS S3 ou similar
8. **SEO**: Meta tags e otimizações
9. **PWA**: Service workers
10. **Analytics**: Google Analytics/Mixpanel
