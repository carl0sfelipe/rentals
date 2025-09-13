import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Criando dados básicos...');

  // Hash da senha "12345678"
  const hashedPassword = await bcrypt.hash('12345678', 10);

  // Criar usuário de teste da tela de login
  const testUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Usuário Teste',
      password: hashedPassword,
    },
  });

  // Criar usuário admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@rentals.com',
      name: 'Administrador',
      password: hashedPassword,
    },
  });

  // Criar uma organização básica
  const org = await prisma.organization.create({
    data: {
      name: 'Empresa Demo',
      slug: 'empresa-demo',
    },
  });

  // Criar algumas propriedades básicas
  const property1 = await prisma.property.create({
    data: {
      title: 'Apartamento Centro',
      description: 'Apartamento no centro da cidade',
      address: 'Rua das Flores, 123 - Centro',
      pricePerNight: 150.00,
      bedrooms: 2,
      bathrooms: 1,
      userId: testUser.id,
      organizationId: org.id,
    },
  });

  const property2 = await prisma.property.create({
    data: {
      title: 'Casa de Praia',
      description: 'Casa aconchegante na praia',
      address: 'Av. Beira Mar, 456 - Praia',
      pricePerNight: 300.00,
      bedrooms: 3,
      bathrooms: 2,
      userId: testUser.id,
      organizationId: org.id,
    },
  });

  console.log('✅ Dados criados com sucesso!');
  console.log('');
  console.log('👤 USUÁRIOS DE TESTE:');
  console.log('• admin@test.com (senha: 12345678)');
  console.log('• admin@rentals.com (senha: 12345678)');
  console.log('');
  console.log('🏠 PROPRIEDADES: 2 imóveis criados');
  console.log('🏢 ORGANIZAÇÃO: Empresa Demo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
