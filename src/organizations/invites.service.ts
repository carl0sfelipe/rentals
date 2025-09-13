import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationContextService } from './organization-context.service';
import { OrganizationRole } from '@prisma/client';

export interface AddMemberDto {
  email: string;
  role: OrganizationRole;
}

@Injectable()
export class OrganizationMembersService {
  constructor(
    private prisma: PrismaService,
    private organizationContext: OrganizationContextService,
  ) {}

  /**
   * Adiciona um usuário existente à organização
   */
  async addMember(memberData: AddMemberDto, addedBy: string) {
    const organizationId = this.organizationContext.getActiveOrganizationId();
    
    if (!organizationId) {
      throw new BadRequestException('Contexto de organização não encontrado');
    }

    if (!addedBy) {
      throw new BadRequestException('ID do usuário que está adicionando é obrigatório');
    }

    // Verifica se o usuário que está adicionando tem permissão (PROPRIETARIO, ADMIN ou MANAGER)
    const adderMembership = await this.prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: addedBy,
          organizationId,
        },
      },
    });

    if (!adderMembership || !['PROPRIETARIO', 'ADMIN', 'MANAGER'].includes(adderMembership.role)) {
      throw new BadRequestException('Apenas proprietários, administradores e gerentes podem adicionar usuários');
    }

    // Busca o usuário pelo email
    const userToAdd = await this.prisma.user.findUnique({
      where: { email: memberData.email },
      include: {
        organizations: {
          where: { organizationId },
        },
      },
    });

    if (!userToAdd) {
      throw new NotFoundException('Usuário não encontrado. O usuário deve se registrar primeiro.');
    }

    // Verifica se já é membro
    if (userToAdd.organizations.length > 0) {
      throw new ConflictException('Usuário já é membro desta organização');
    }

    // Adiciona o usuário à organização
    const membership = await this.prisma.organizationUser.create({
      data: {
        userId: userToAdd.id,
        organizationId,
        role: memberData.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Se o usuário não tem organização ativa, define esta como ativa
    if (!userToAdd.activeOrganizationId) {
      await this.prisma.user.update({
        where: { id: userToAdd.id },
        data: { activeOrganizationId: organizationId },
      });
    }

    return {
      message: 'Usuário adicionado à organização com sucesso',
      member: {
        id: membership.id,
        role: membership.role,
        user: membership.user,
        organization: membership.organization,
        createdAt: membership.createdAt,
      },
    };
  }

  /**
   * Lista membros da organização
   */
  async getMembers() {
    const organizationId = this.organizationContext.getActiveOrganizationId();
    
    if (!organizationId) {
      throw new BadRequestException('Contexto de organização não encontrado');
    }

    return this.prisma.organizationUser.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            activeOrganizationId: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // PROPRIETARIO primeiro
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Remove um membro da organização
   */
  async removeMember(memberUserId: string, removedBy: string) {
    const organizationId = this.organizationContext.getActiveOrganizationId();
    
    if (!organizationId) {
      throw new BadRequestException('Contexto de organização não encontrado');
    }

    // Verifica permissão de quem está removendo
    const removerMembership = await this.prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: removedBy,
          organizationId,
        },
      },
    });

    if (!removerMembership || !['PROPRIETARIO', 'ADMIN', 'MANAGER'].includes(removerMembership.role)) {
      throw new BadRequestException('Apenas proprietários, administradores e gerentes podem remover membros');
    }

    // Busca o membro a ser removido
    const memberToRemove = await this.prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: memberUserId,
          organizationId,
        },
      },
      include: {
        user: true,
      },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Membro não encontrado na organização');
    }

    // Não pode remover a si mesmo
    if (memberUserId === removedBy) {
      throw new BadRequestException('Você não pode remover a si mesmo');
    }

    // Managers não podem remover admins ou proprietários
    if (removerMembership.role === 'MANAGER' && ['PROPRIETARIO' as OrganizationRole, 'ADMIN'].includes(memberToRemove.role as any)) {
      throw new BadRequestException('Gerentes não podem remover proprietários ou administradores');
    }

    // Admins não podem remover proprietários
    if (removerMembership.role === 'ADMIN' && memberToRemove.role === ('PROPRIETARIO' as OrganizationRole)) {
      throw new BadRequestException('Administradores não podem remover proprietários');
    }

    // Remove o membro
    await this.prisma.organizationUser.delete({
      where: {
        userId_organizationId: {
          userId: memberUserId,
          organizationId,
        },
      },
    });

    // Se essa era a organização ativa do usuário, busca outra organização
    if (memberToRemove.user.activeOrganizationId === organizationId) {
      const otherOrg = await this.prisma.organizationUser.findFirst({
        where: { userId: memberUserId },
      });

      await this.prisma.user.update({
        where: { id: memberUserId },
        data: { activeOrganizationId: otherOrg?.organizationId || null },
      });
    }

    return { message: 'Membro removido com sucesso' };
  }

  /**
   * Atualiza role de um membro
   */
  async updateMemberRole(memberUserId: string, newRole: OrganizationRole, updatedBy: string) {
    const organizationId = this.organizationContext.getActiveOrganizationId();
    
    if (!organizationId) {
      throw new BadRequestException('Contexto de organização não encontrado');
    }

    // Verifica permissão (PROPRIETARIO e ADMIN podem alterar roles)
    const updaterMembership = await this.prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: updatedBy,
          organizationId,
        },
      },
    });

    if (!updaterMembership || !['PROPRIETARIO', 'ADMIN'].includes(updaterMembership.role)) {
      throw new BadRequestException('Apenas proprietários e administradores podem alterar funções');
    }

    // Busca o membro
    const memberToUpdate = await this.prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: memberUserId,
          organizationId,
        },
      },
    });

    if (!memberToUpdate) {
      throw new NotFoundException('Membro não encontrado na organização');
    }

    // Permite auto-alteração de role (promoção ou rebaixamento)
    if (memberUserId === updatedBy) {
      // Usuário pode alterar sua própria role livremente
      // Útil para: transferir propriedade, reduzir responsabilidades, etc.
    }

    // Admins não podem alterar proprietários (mas podem promover outros)
    if (updaterMembership.role === 'ADMIN' && memberToUpdate.role === ('PROPRIETARIO' as OrganizationRole) && memberUserId !== updatedBy) {
      throw new BadRequestException('Administradores não podem alterar a função de proprietários');
    }

    // Atualiza a role
    await this.prisma.organizationUser.update({
      where: {
        userId_organizationId: {
          userId: memberUserId,
          organizationId,
        },
      },
      data: { role: newRole },
    });

    return { message: 'Função atualizada com sucesso' };
  }

  /**
   * Permite que um usuário troque de organização (se for membro de múltiplas)
   */
  async switchOrganization(userId: string, organizationId: string) {
    // Verifica se o usuário é membro da organização
    const membership = await this.prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Você não é membro desta organização');
    }

    // Atualiza a organização ativa
    await this.prisma.user.update({
      where: { id: userId },
      data: { activeOrganizationId: organizationId },
    });

    return {
      message: 'Organização ativa alterada com sucesso',
      organization: membership.organization,
    };
  }

  /**
   * Lista organizações do usuário
   */
  async getUserOrganizations(userId: string) {
    return this.prisma.organizationUser.findMany({
      where: { userId },
      include: {
        organization: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
