/**
 * Feature Flags Configuration
 * 
 * Este arquivo controla todas as funcionalidades avançadas do sistema.
 * Para ativar o sistema multi-tenant completo, simplesmente mude MULTI_TENANT_ENABLED para true.
 * 
 * ATENÇÃO: Após mudar qualquer flag, reinicie a aplicação para aplicar as mudanças.
 */

export interface FeatureFlags {
  // Flag principal que controla todo o sistema multi-tenant
  MULTI_TENANT_ENABLED: boolean;
  
  // Flags específicas (ativadas automaticamente quando MULTI_TENANT_ENABLED = true)
  ORGANIZATION_MANAGEMENT: boolean;
  ROLE_BASED_PERMISSIONS: boolean;
  TENANT_ISOLATION: boolean;
  ORGANIZATION_CONTEXT: boolean;
  
  // Flags de desenvolvimento e debug
  DEBUG_ORGANIZATION_CONTEXT: boolean;
  STRICT_TENANT_VALIDATION: boolean;
}

// CONFIGURAÇÃO PRINCIPAL
// =====================
// Para ativar TODO o sistema multi-tenant, mude esta linha para true:
const MULTI_TENANT_ENABLED = true;

// Configurações específicas (normalmente não precisam ser alteradas)
const config: FeatureFlags = {
  MULTI_TENANT_ENABLED,
  
  // Auto-ativação baseada na flag principal
  ORGANIZATION_MANAGEMENT: MULTI_TENANT_ENABLED,
  ROLE_BASED_PERMISSIONS: MULTI_TENANT_ENABLED,
  TENANT_ISOLATION: MULTI_TENANT_ENABLED,
  ORGANIZATION_CONTEXT: MULTI_TENANT_ENABLED,
  
  // Configurações de desenvolvimento
  DEBUG_ORGANIZATION_CONTEXT: true,
  STRICT_TENANT_VALIDATION: MULTI_TENANT_ENABLED,
};

// Funções helper para verificar features específicas
export const isMultiTenantEnabled = (): boolean => config.MULTI_TENANT_ENABLED;
export const isOrganizationManagementEnabled = (): boolean => config.ORGANIZATION_MANAGEMENT;
export const isRoleBasedPermissionsEnabled = (): boolean => config.ROLE_BASED_PERMISSIONS;
export const isTenantIsolationEnabled = (): boolean => config.TENANT_ISOLATION;
export const isOrganizationContextEnabled = (): boolean => config.ORGANIZATION_CONTEXT;
export const isDebugOrganizationContext = (): boolean => config.DEBUG_ORGANIZATION_CONTEXT;
export const isStrictTenantValidation = (): boolean => config.STRICT_TENANT_VALIDATION;

// Função para obter todas as configurações
export const getFeatureFlags = (): FeatureFlags => config;

// Log das configurações ativas (útil para debug)
if (config.DEBUG_ORGANIZATION_CONTEXT) {
  console.log('Feature Flags Configuration:', {
    multiTenant: config.MULTI_TENANT_ENABLED,
    organizationManagement: config.ORGANIZATION_MANAGEMENT,
    roleBasedPermissions: config.ROLE_BASED_PERMISSIONS,
    tenantIsolation: config.TENANT_ISOLATION,
    organizationContext: config.ORGANIZATION_CONTEXT,
  });
}
