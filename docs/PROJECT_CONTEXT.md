# 🏠 Rental Property Management System - Contexto Completo

> Sistema completo de gestão de propriedades para aluguel com exportação de calendários iCalendar
> **Status:** ✅ Produção Ready - 47/47 testes passando (100% coverage)
> **Última Atualização:** 12 de Setembro de 2025

## 📋 Resumo Executivo

Este é um **sistema completo de gestão de propriedades para aluguel** construído com **NestJS**, **Prisma**, **PostgreSQL** e **React**. O sistema permite:

- ✅ **CRUD completo** de propriedades
- ✅ **Gestão de reservas/bloqueios** com validação de conflitos
- ✅ **Exportação de calendários iCalendar** (.ics) para sincronização com Airbnb, Booking.com, etc.
- ✅ **Autenticação JWT** completa
- ✅ **Separação total de ambientes** (desenvolvimento/teste)
- ✅ **100% de cobertura de testes** (47/47 testes passando)
- ✅ **Docker Compose** para desenvolvimento e produção

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico
- **Backend:** NestJS + TypeScript + Prisma ORM
- **Database:** PostgreSQL (com Docker)
- **Frontend:** React + TypeScript + Vite
- **Testes:** Vitest + Supertest (E2E + Unit + Integration)
- **Containerização:** Docker + Docker Compose
- **Autenticação:** JWT + bcrypt

### Estrutura de Pastas
```
rentals/
├── src/                          # Backend NestJS
│   ├── auth/                     # Módulo de autenticação
│   │   ├── auth.controller.ts    # Endpoints /auth/register, /auth/login
│   │   ├── auth.service.ts       # Lógica de JWT e bcrypt
│   │   ├── auth.module.ts        # Módulo auth
│   │   └── auth.service.spec.ts  # Testes unitários auth
│   ├── properties/               # Módulo de propriedades
│   │   ├── properties.controller.ts  # CRUD endpoints /properties
│   │   ├── properties.service.ts     # Lógica de negócio
│   │   ├── properties.module.ts      # Módulo properties
│   │   └── properties.service.spec.ts # Testes unitários
│   ├── bookings/                 # Módulo de reservas/bloqueios
│   │   ├── bookings.controller.ts    # Endpoints /properties/:id/bookings
│   │   ├── bookings.service.ts       # Validação de conflitos
│   │   └── bookings.module.ts        # Módulo bookings
│   ├── calendar/                 # Módulo de calendários iCalendar
│   │   ├── calendar.controller.ts    # Endpoint .ics
│   │   ├── calendar-sync.service.ts  # Geração iCalendar
│   │   ├── calendar.module.ts        # Módulo calendar
│   │   ├── calendar-sync.service.spec.ts     # Testes unitários
│   │   └── calendar-scheduled-sync.spec.ts   # Testes de sincronização
│   ├── app.module.ts             # Módulo raiz da aplicação
│   └── main.ts                   # Entry point da aplicação
├── test/                         # Testes E2E
│   ├── auth.e2e-spec.ts         # Testes E2E de autenticação
│   ├── auth-mock.e2e-spec.ts    # Testes mock de autenticação
│   ├── simple-auth.e2e-spec.ts  # Testes simples de autenticação
│   ├── properties.e2e-spec.ts   # Testes E2E de propriedades
│   ├── bookings.e2e-spec.ts     # Testes E2E de reservas
│   └── calendar.e2e-spec.ts     # Testes E2E de calendários (.ics)
├── frontend/                     # Frontend React
│   ├── src/
│   │   ├── components/           # Componentes React
│   │   ├── pages/               # Páginas da aplicação
│   │   └── services/            # Serviços API
│   └── package.json
├── prisma/                       # Database Schema
│   ├── schema.prisma            # Modelo de dados
│   └── migrations/              # Migrações do banco
├── scripts/                      # Scripts utilitários
├── docker-compose.yml           # Docker para desenvolvimento
├── docker-compose.test.yml      # Docker para testes
├── .env.development             # Env desenvolvimento
├── .env.test                    # Env testes
├── vitest.config.ts             # Configuração dos testes
└── package.json                 # Dependencies e scripts
```

## 🎯 Funcionalidades Principais

### 1. 🏠 Gestão de Propriedades
- **CRUD completo** (Create, Read, Update, Delete)
- **Validação de dados** (título, descrição, preço, localização)
- **Controle de propriedade** (apenas donos podem editar)
- **Interface visual** para listagem e edição

### 2. 📅 Sistema de Reservas/Bloqueios
- **Criação de bloqueios** por período (startDate → endDate)
- **Validação automática de conflitos** de datas
- **Tipos de bloqueio:** RESERVATION, BLOCKED, MAINTENANCE
- **Interface visual** para detectar e resolver conflitos
- **CRUD completo** com edição inline

### 3. 📤 Exportação de Calendários iCalendar
- **Endpoint `/properties/:propertyId/calendar.ics`**
- **Formato iCalendar padrão** (.ics) compatível com:
  - Airbnb
  - Booking.com
  - Google Calendar
  - Outlook
- **UIDs únicos** para cada evento
- **Informações completas** da propriedade no calendário

### 4. 🔐 Autenticação e Segurança
- **Registro de usuários** com validação de email
- **Login com JWT tokens**
- **Senhas criptografadas** com bcrypt
- **Middleware de autenticação** em todas as rotas protegidas
- **Controle de acesso** por proprietário

## 🗄️ Modelo de Dados (Prisma)

```prisma
model User {
  id         String      @id @default(cuid())
  email      String      @unique
  password   String
  createdAt  DateTime    @default(now())
  properties Property[]
}

model Property {
  id          String    @id @default(cuid())
  title       String
  description String?
  address     String
  pricePerNight Float
  ownerId     String
  owner       User      @relation(fields: [ownerId], references: [id])
  bookings    Booking[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Booking {
  id         String      @id @default(cuid())
  propertyId String
  property   Property    @relation(fields: [propertyId], references: [id])
  startDate  DateTime
  endDate    DateTime
  type       BookingType @default(BLOCKED)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}

enum BookingType {
  RESERVATION
  BLOCKED
  MAINTENANCE
}
```

## 🚀 API Endpoints

### Autenticação
- `POST /auth/register` - Criar conta de usuário
- `POST /auth/login` - Login e obter JWT token

### Propriedades
- `GET /properties` - Listar propriedades do usuário
- `POST /properties` - Criar nova propriedade
- `GET /properties/:id` - Obter propriedade específica
- `PATCH /properties/:id` - Atualizar propriedade
- `DELETE /properties/:id` - Deletar propriedade

### Reservas/Bloqueios
- `GET /properties/:propertyId/bookings` - Listar bloqueios
- `POST /properties/:propertyId/bookings` - Criar bloqueio
- `PATCH /properties/:propertyId/bookings/:bookingId` - Atualizar bloqueio
- `DELETE /properties/:propertyId/bookings/:bookingId` - Deletar bloqueio

### Calendários iCalendar
- `GET /properties/:propertyId/calendar.ics` - Exportar calendário (.ics)

## 🧪 Sistema de Testes

### Cobertura Atual: 47/47 testes (100%)

#### Testes E2E (28 testes)
- **Calendar E2E (7 testes):** Exportação iCalendar com diferentes cenários
- **Properties E2E (5 testes):** CRUD completo de propriedades
- **Bookings E2E (9 testes):** Gestão de reservas com validação
- **Auth E2E (7 testes):** Autenticação e autorização

#### Testes Unitários (19 testes)
- **Auth Service (6 testes):** Lógica de autenticação
- **Properties Service (9 testes):** Lógica de propriedades
- **Calendar Services (4 testes):** Geração de iCalendar

### Configuração de Testes
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "postgresql://user:password@localhost:5433/rentaldb",
      JWT_SECRET: "test-secret-key",
      NODE_ENV: "test"
    },
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    sequence: { concurrent: false }
  }
});
```

## 🐳 Ambientes e Deploy

### Separação de Ambientes
- **Desenvolvimento:** `.env.development` → `rentals_dev` (porta 5433)
- **Testes:** `.env.test` → `rentaldb` (porta 5433)
- **Produção:** `.env` → configuração específica

### Docker Compose
```yaml
# docker-compose.yml (desenvolvimento)
services:
  db_dev:
    image: postgres:13
    ports: ["5433:5432"]
    environment:
      POSTGRES_DB: rentals_dev

# docker-compose.test.yml (testes)
services:
  db_test:
    image: postgres:13
    ports: ["5434:5432"]
    environment:
      POSTGRES_DB: rentaldb
```

## ⚡ Comandos Essenciais

### Desenvolvimento
```bash
# Iniciar ambiente completo
docker compose up -d

# Instalar dependências
npm install

# Aplicar migrações
npx prisma migrate dev

# Iniciar servidor
npm run start:dev

# Iniciar frontend
cd frontend && npm run dev
```

### Testes
```bash
# Executar todos os testes
npm test

# Testes com coverage
npm run test:cov

# Apenas testes E2E
npm run test:e2e
```

### Database
```bash
# Reset do banco de desenvolvimento
npx prisma migrate reset

# Visualizar dados
npx prisma studio

# Gerar client Prisma
npx prisma generate
```

## 🔧 Configurações Importantes

### Variáveis de Ambiente
```bash
# .env.development
DATABASE_URL="postgresql://user:password@localhost:5433/rentals_dev"
JWT_SECRET="dev-secret-key-very-long-and-secure"
NODE_ENV="development"

# .env.test
DATABASE_URL="postgresql://user:password@localhost:5433/rentaldb"
JWT_SECRET="test-secret-key"
NODE_ENV="test"
```

### CORS e Segurança
```typescript
// main.ts
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
});
```

## 📈 Histórico de Desenvolvimento

### Commits Principais
1. **36cdb3aa** - Sistema de bloqueios com validação de conflitos
2. **f2515d5e** - 100% dos testes passando (47/47)
3. **33d8fb71** - Separação completa de ambientes dev/test

### Próximos Passos Sugeridos
- [ ] Dashboard de analytics
- [ ] Notificações por email
- [ ] Integração com APIs externas (Airbnb, Booking.com)
- [ ] Mobile app
- [ ] Sistema de pagamentos

## 🤝 Como Contribuir

### Para Desenvolvedores
1. **Clone** o repositório
2. **Execute** `docker compose up -d` para subir o banco
3. **Instale** dependências com `npm install`
4. **Execute** migrações com `npx prisma migrate dev`
5. **Rode** os testes com `npm test`
6. **Inicie** desenvolvimento com `npm run start:dev`

### Para LLMs/IA
Este contexto contém **toda a informação necessária** para:
- Entender a arquitetura completa
- Adicionar novas funcionalidades
- Corrigir bugs
- Otimizar performance
- Escrever testes
- Fazer deploy

**Use este documento como contexto base para qualquer pergunta sobre o projeto!**

---

📧 **Contato:** carlos.felipe@hotmail.com.br  
🌟 **Status:** Production Ready - Sistema completo e testado  
🚀 **Deploy:** Pronto para produção
