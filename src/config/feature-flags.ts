/**
 * Feature Flags Configuration
 * 
 * CONTROLE ÚNICO: Para ativar/desativar multi-tenant, edite APENAS o arquivo config.json na raiz do projeto!
 * 
 * ATENÇÃO: Após mudar o config.json, reinicie a aplicação para aplicar as mudanças.
 */

import * as fs from 'fs';
import * as path from 'path';

// Lê configuração do arquivo único
function loadConfig() {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    const configFile = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configFile);
  } catch (error) {
    console.warn('Erro ao ler config.json, usando configuração padrão');
    return { MULTI_TENANT_ENABLED: false };
  }
}

const config = loadConfig();

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

// CONFIGURAÇÃO LIDA DO ARQUIVO ÚNICO config.json
const MULTI_TENANT_ENABLED = config.MULTI_TENANT_ENABLED;

// Configurações específicas (normalmente não precisam ser alteradas)
const featureFlags: FeatureFlags = {
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
export const isOrganizationManagementEnabled = (): boolean => config.MULTI_TENANT_ENABLED;
export const isRoleBasedPermissionsEnabled = (): boolean => config.MULTI_TENANT_ENABLED;
export const isTenantIsolationEnabled = (): boolean => config.MULTI_TENANT_ENABLED;
export const isOrganizationContextEnabled = (): boolean => config.MULTI_TENANT_ENABLED;
export const isDebugOrganizationContext = (): boolean => config.DEBUG_ORGANIZATION_CONTEXT || true;
export const isStrictTenantValidation = (): boolean => config.MULTI_TENANT_ENABLED;

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
