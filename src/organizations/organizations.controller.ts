import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { isMultiTenantEnabled, isOrganizationManagementEnabled } from '../config/feature-flags';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async getUserOrganizations(@Request() req: any) {
    if (!isMultiTenantEnabled()) {
      throw new ForbiddenException('Multi-tenant features are disabled');
    }
    return this.organizationsService.getUserOrganizations(req.user.sub);
  }

  @Post(':organizationId/switch')
  async switchActiveOrganization(
    @Param('organizationId') organizationId: string,
    @Request() req: any
  ) {
    if (!isOrganizationManagementEnabled()) {
      throw new ForbiddenException('Organization switching is disabled');
    }
    return this.organizationsService.switchActiveOrganization(req.user.sub, organizationId);
  }
}
