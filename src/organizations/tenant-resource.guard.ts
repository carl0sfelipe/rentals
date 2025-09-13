import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { isTenantIsolationEnabled } from '../config/feature-flags';

/**
 * Guard simplificado para isolamento de tenant
 */
@Injectable()
export class TenantResourceGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Se tenant isolation está desabilitado, permitir tudo
    if (!isTenantIsolationEnabled()) {
      return true;
    }

    // Para versão simplificada, sempre permitir
    // TODO: Implementar verificação de tenant quando multi-tenant estiver ativo
    return true;
  }
}