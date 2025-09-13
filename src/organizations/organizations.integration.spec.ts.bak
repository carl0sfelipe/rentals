import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';

describe('Organization Integration Test', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should be able to create organization structure', async () => {
    // Test basic organization creation
    const org = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        slug: 'test-org'
      }
    });

    expect(org.id).toBeDefined();
    expect(org.name).toBe('Test Organization');

    // Cleanup
    await prisma.organization.delete({ where: { id: org.id } });
  });
});
