import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async getUserOrganizations(userId: string) {
    // Método simplificado para compilação
    return [];
  }

  async switchActiveOrganization(userId: string, organizationId: string) {
    // Método simplificado para compilação
    throw new NotFoundException("Not implemented yet");
  }
}
