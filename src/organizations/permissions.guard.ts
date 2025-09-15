import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { OrganizationContextService } from './organization-context.service';
import { OrganizationsService } from './organizations.service';
import { isRoleBasedPermissionsEnabled } from '../config/feature-flags';

/**
 * Guard que verifica permissões RBAC baseadas no role do usuário na organização
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private organizationContext: OrganizationContextService,
    private organizationsService: OrganizationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Se RBAC está desabilitado, permitir tudo
    if (!isRoleBasedPermissionsEnabled()) {
      return true;
    }

    // Obter permissões necessárias do decorador
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Se não há permissões exigidas, permitir acesso
    if (!requiredPermissions) {
      return true;
    }

    // Obter contexto organizacional
    const orgContext = this.organizationContext.getContext();
    
    // Se não há contexto organizacional, negar acesso para endpoints que exigem permissões
    if (!orgContext) {
      throw new ForbiddenException('Organization context required');
    }

    // Verificar se usuário tem pelo menos uma das permissões necessárias
    for (const permission of requiredPermissions) {
      // Para versão simplificada, sempre permitir
      // TODO: Implementar verificação real quando multi-tenant estiver ativo
      return true;
    }

    throw new ForbiddenException(`Required permissions: ${requiredPermissions.join(' OR ')}`);
  }
}
