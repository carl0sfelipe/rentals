# Rentals Frontend

Interface de usuário moderna para o sistema de gerenciamento de propriedades e aluguel.

## 🚀 Tecnologias

- **React 18** - Biblioteca para interfaces de usuário
- **Vite** - Build tool rápido e moderno
- **Tailwind CSS** - Framework CSS utilitário
- **React Hooks** - useState, useEffect, useContext para gerenciamento de estado

## 📋 Funcionalidades

### ✅ Implementadas
- **Autenticação**: Login com email/senha e persistência de sessão
- **Dashboard**: Interface principal com lista de propriedades
- **Gerenciamento de Propriedades**: Visualização de propriedades com detalhes
- **Sistema de Bloqueios**: Criação de bloqueios/reservas por propriedade
- **Exportação de Calendário**: Link para download do calendário iCalendar (.ics)
- **Interface Responsiva**: Design moderno e responsivo com Tailwind CSS
- **Roteamento Simples**: Navegação baseada em estado (sem react-router)

### 🎨 Design
- Interface moderna e limpa
- Design responsivo (mobile-first)
- Componentes reutilizáveis
- Estados de loading e feedback visual
- Paleta de cores profissional

## 🛠️ Instalação

```bash
# Entre no diretório do frontend
cd frontend

# Instale as dependências
npm install

# Execute em modo de desenvolvimento
npm run dev
```

## 📖 Uso

1. **Acesse**: http://localhost:5173
2. **Login**: Use qualquer email válido e senha com 6+ caracteres
3. **Dashboard**: Visualize e gerencie suas propriedades
4. **Bloqueios**: Crie bloqueios/reservas diretamente nos cartões das propriedades
5. **Calendário**: Baixe o calendário iCalendar clicando no ícone de calendário

## 🏗️ Estrutura do Código

### Arquivo Principal: `App.jsx`
Todo o código está em um arquivo único, organizado em seções:

```javascript
// 1. Contexto de Autenticação
const AuthContext = createContext();

// 2. Dados Mockados
const mockProperties = [...];

// 3. Funções de API (Simuladas)
const apiService = { login, getProperties, createBooking };

// 4. Componentes
- LoadingSpinner     // Indicador de carregamento
- LoginPage          // Tela de login
- PropertyCard       // Cartão de propriedade
- DashboardPage      // Dashboard principal
- App                // Componente raiz
```

### Gerenciamento de Estado
- **React Context**: Para autenticação global
- **useState**: Para estado local dos componentes
- **localStorage**: Para persistência de sessão

### Integração com API
- Configuração de proxy no Vite para `/api` → `http://localhost:3000`
- Funções simuladas que replicam o comportamento da API real
- Headers de autenticação JWT

## 🔗 Endpoints da API

A aplicação está preparada para integrar com os seguintes endpoints:

- `POST /auth/login` - Autenticação
- `GET /properties` - Lista de propriedades do usuário
- `POST /properties/:id/bookings` - Criação de bloqueios
- `GET /properties/:id/calendar.ics` - Download do calendário

## 🎯 Próximos Passos

Para uma versão de produção, considere implementar:

1. **Roteamento Robusto**: React Router DOM
2. **Gerenciamento de Estado**: Redux/Zustand
3. **Validação de Formulários**: React Hook Form + Yup/Zod
4. **Testes**: Jest + React Testing Library
5. **API Real**: Substituir funções mockadas por chamadas HTTP reais
6. **Notificações**: Toast notifications para feedback
7. **Loading States**: Skeletons e estados de carregamento mais elaborados
8. **Paginação**: Para listas grandes de propriedades
9. **Filtros e Busca**: Funcionalidades de busca e filtragem
10. **Upload de Imagens**: Para fotos das propriedades

## 📱 Design Responsivo

A aplicação é totalmente responsiva:
- **Mobile**: Layout em coluna única
- **Tablet**: Grid de 2 colunas
- **Desktop**: Grid de 3 colunas

## 🎨 Paleta de Cores

- **Primária**: Azul (#2563eb)
- **Secundária**: Cinza (#6b7280)
- **Sucesso**: Verde (#16a34a)
- **Erro**: Vermelho (#dc2626)
- **Background**: Cinza claro (#f9fafb)
