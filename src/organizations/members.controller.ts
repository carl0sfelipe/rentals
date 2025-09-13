import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationMembersService, AddMemberDto } from './invites.service';
import { OrganizationRole } from '@prisma/client';

interface AuthenticatedRequest {
  user: {
    id: string;
    userId?: string; // Para compatibilidade
    email: string;
    activeOrganizationId: string;
  };
}

@Controller('organizations/members')
@UseGuards(JwtAuthGuard)
export class OrganizationMembersController {
  constructor(private readonly membersService: OrganizationMembersService) {}

  /**
   * Lista membros da organização atual
   */
  @Get()
  async getMembers() {
    return this.membersService.getMembers();
  }

  /**
   * Adiciona um usuário existente à organização
   */
  @Post()
  async addMember(@Body() addMemberDto: AddMemberDto, @Request() req: AuthenticatedRequest) {
    return this.membersService.addMember(addMemberDto, req.user.id);
  }

  /**
   * Remove um membro da organização
   */
  @Delete(':userId')
  async removeMember(@Param('userId') userId: string, @Request() req: AuthenticatedRequest) {
    return this.membersService.removeMember(userId, req.user.id);
  }

  /**
   * Atualiza role de um membro
   */
  @Patch(':userId/role')
  async updateMemberRole(
    @Param('userId') userId: string,
    @Body('role') role: OrganizationRole,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.membersService.updateMemberRole(userId, role, req.user.id);
  }

  /**
   * Lista organizações do usuário atual
   */
  @Get('/my-organizations')
  async getMyOrganizations(@Request() req: AuthenticatedRequest) {
    return this.membersService.getUserOrganizations(req.user.id);
  }

  /**
   * Troca de organização ativa
   */
  @Post('/switch/:organizationId')
  async switchOrganization(
    @Param('organizationId') organizationId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.membersService.switchOrganization(req.user.id, organizationId);
  }
}
