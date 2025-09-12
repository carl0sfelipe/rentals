import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface PropertyDto { title: string; description?: string }
interface UpdatePropertyDto { title?: string; description?: string }

@Injectable()
export class PropertiesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(userId: string, data: PropertyDto) {
    return this.prisma.property.create({ data: { ...data, userId } });
  }

  async findAll(userId: string) {
    return this.prisma.property.findMany({ where: { userId } });
  }

  async findOne(userId: string, id: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.userId !== userId) throw new ForbiddenException();
    return property;
  }

  async update(userId: string, id: string, data: UpdatePropertyDto) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.userId !== userId) throw new ForbiddenException();
    return this.prisma.property.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.userId !== userId) throw new ForbiddenException();
    await this.prisma.property.delete({ where: { id } });
    return { deleted: true };
  }
}
