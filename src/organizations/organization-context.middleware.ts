import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { OrganizationContextService } from './organization-context.service';

interface JwtPayload {
  sub: string;
  email: string;
  activeOrganizationId?: string;
}

@Injectable()
export class OrganizationContextMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly organizationContext: OrganizationContextService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extrair token do header Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.substring(7);
      const payload = this.jwtService.verify(token) as JwtPayload;

      if (!payload.sub) {
        return next();
      }

      // Se não tem organização ativa no token, pular contexto
      if (!payload.activeOrganizationId) {
        return next();
      }

      // For Org-Lite, trust the JWT token (simpler approach)
      // In production, you might want additional verification
      
      // Executar request dentro do contexto organizacional
      return this.organizationContext.run(
        {
          organizationId: payload.activeOrganizationId,
          userId: payload.sub,
          role: 'ADMIN', // For Org-Lite, assume ADMIN role (users own their org)
        },
        () => next()
      );
    } catch (error) {
      // Se houver erro (token inválido, etc), continuar sem contexto
      return next();
    }
  }
}
