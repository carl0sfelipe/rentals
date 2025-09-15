import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface OrganizationContext {
  organizationId: string;
  userId: string;
  role: string;
}

@Injectable()
export class OrganizationContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<OrganizationContext>();

  /**
   * Executar código dentro do contexto organizacional
   */
  run<T>(context: OrganizationContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  /**
   * Obter organização ativa do contexto atual
   */
  getActiveOrganizationId(): string | undefined {
    return this.asyncLocalStorage.getStore()?.organizationId;
  }

  /**
   * Obter usuário ativo do contexto atual
   */
  getActiveUserId(): string | undefined {
    return this.asyncLocalStorage.getStore()?.userId;
  }

  /**
   * Obter role do usuário no contexto atual
   */
  getActiveUserRole(): string | undefined {
    return this.asyncLocalStorage.getStore()?.role;
  }

  /**
   * Obter contexto completo
   */
  getContext(): OrganizationContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Verificar se estamos dentro de um contexto organizacional
   */
  hasContext(): boolean {
    return !!this.asyncLocalStorage.getStore();
  }
}
