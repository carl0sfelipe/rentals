import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorador para exigir permissões específicas
 * @param permissions Lista de permissões necessárias (OR logic)
 * 
 * Exemplos:
 * @RequirePermission('property:create')
 * @RequirePermission('property:*')  
 * @RequirePermission('*') // Admin only
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
