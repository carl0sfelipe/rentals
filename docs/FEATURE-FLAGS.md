# Sistema de Feature Flags - Multi-Tenant

Este documento explica como ativar e desativar o sistema multi-tenant através de feature flags.

## 🚀 Ativação Rápida

Para ativar TODO o sistema multi-tenant:

1. Abra o arquivo `src/config/feature-flags.ts`
2. Mude a linha:
   ```typescript
   const MULTI_TENANT_ENABLED = false;
   ```
   Para:
   ```typescript
   const MULTI_TENANT_ENABLED = true;
   ```
3. Reinicie a aplicação

**Pronto!** O sistema multi-tenant estará completamente ativo.

## 📋 O que é ativado automaticamente

Quando `MULTI_TENANT_ENABLED = true`, as seguintes funcionalidades são habilitadas:

### 🏢 Gestão de Organizações
- **Controller**: `/organizations/*` - Endpoints para CRUD de organizações
- **Entidades**: Organization, OrganizationUser, roles
- **Middleware**: Extração automática do contexto organizacional do JWT

### 🔐 Sistema de Permissões (RBAC)
- **Roles**: OWNER, ADMIN, MEMBER com diferentes níveis de acesso
- **Guards**: Verificação automática de permissões baseada em roles
- **Proteção**: Endpoints protegidos por nível de acesso

### 🏠 Isolamento de Tenants
- **Auto-filtering**: Dados filtrados automaticamente por organização
- **Guards**: Prevenção de acesso cross-tenant
- **Context**: Cada request é isolado na organização correta

### 🔄 Contexto Organizacional
- **JWT**: Tokens incluem `activeOrganizationId`
- **AsyncLocalStorage**: Contexto por request
- **Automático**: Configuração transparente

## 🛡️ Modo Seguro (Padrão)

Quando `MULTI_TENANT_ENABLED = false`:

- ✅ Sistema funciona normalmente (single-tenant)
- ✅ Todos os endpoints existentes continuam funcionando
- ✅ Autenticação JWT normal (sem organizações)
- ✅ Sem overhead de multi-tenancy
- ❌ Endpoints `/organizations/*` retornam 403 Forbidden
- ❌ Guards de permissão sempre permitem acesso
- ❌ Sem isolamento de dados

## 🔧 Configurações Avançadas

Para controle mais granular, você pode modificar flags específicas:

```typescript
const config: FeatureFlags = {
  MULTI_TENANT_ENABLED: false,
  
  // Controles específicos (sobreposição manual)
  ORGANIZATION_MANAGEMENT: true,     // Apenas endpoints de org
  ROLE_BASED_PERMISSIONS: false,    // Sem RBAC
  TENANT_ISOLATION: true,           // Apenas isolamento
  ORGANIZATION_CONTEXT: true,       // Apenas contexto
  
  // Debug
  DEBUG_ORGANIZATION_CONTEXT: true, // Logs detalhados
  STRICT_TENANT_VALIDATION: true,   // Validação rígida
};
```

## 🐛 Debug e Troubleshooting

### Ativar Logs de Debug
```typescript
DEBUG_ORGANIZATION_CONTEXT: true
```

### Verificar Status das Flags
No console da aplicação, você verá:
```
Feature Flags Configuration: {
  multiTenant: true,
  organizationManagement: true,
  roleBasedPermissions: true,
  tenantIsolation: true,
  organizationContext: true
}
```

### Problemas Comuns

1. **Aplicação não reiniciada**: Feature flags são carregadas na inicialização
2. **JWT sem organizationId**: Gere novo token após ativar multi-tenant
3. **Dados misturados**: Ative `STRICT_TENANT_VALIDATION` para debug

## 📁 Arquivos Afetados

### Core
- `src/config/feature-flags.ts` - Configuração principal
- `src/organizations/organizations.module.ts` - Providers condicionais

### Middleware e Guards
- `src/organizations/organization-context.middleware.ts` - Contexto condicional
- `src/organizations/permissions.guard.ts` - RBAC condicional
- `src/organizations/tenant-resource.guard.ts` - Isolamento condicional

### Controllers
- `src/organizations/organizations.controller.ts` - Endpoints condicionais

### Database
- `src/prisma/prisma-org-extension.ts` - Auto-filtering condicional

## 🔄 Migração de Dados

Ao ativar multi-tenant pela primeira vez, você pode precisar:

1. Criar uma organização padrão:
   ```bash
   POST /organizations
   {
     "name": "Organização Principal",
     "slug": "principal"
   }
   ```

2. Associar usuários existentes à organização
3. Regenerar JWTs com `activeOrganizationId`

## ⚠️ Importante

- **Backup**: Sempre faça backup antes de ativar multi-tenant
- **Testes**: Teste em ambiente de desenvolvimento primeiro
- **Dados**: Dados existentes podem precisar de migração manual
- **Cache**: Limpe caches de autenticação após ativação

---

**TL;DR**: Mude `MULTI_TENANT_ENABLED = true` em `feature-flags.ts` e reinicie. 🚀
