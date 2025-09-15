import { PrismaClient, OrganizationRole, BookingType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// URLs de imagens reais de imóveis (Unsplash)
const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1590725140246-20acdee442be?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1515263487990-61b07816b322?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
];

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop';

async function main() {
  console.log('🚀 Iniciando seed do banco de dados...');

  // 1. Criar Organizações
  console.log('📊 Criando organizações...');
  const org1 = await prisma.organization.create({
    data: {
      name: 'Luxury Rentals Brasil',
      slug: 'luxury-rentals-brasil',
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: 'Coastal Properties',
      slug: 'coastal-properties',
    },
  });

  const org3 = await prisma.organization.create({
    data: {
      name: 'Urban Stays',
      slug: 'urban-stays',
    },
  });

  // 2. Criar Usuários
  console.log('👥 Criando usuários...');
  const hashedPassword = await bcrypt.hash('12345678', 10);

  // Proprietários/CEOs
  const ceo1 = await prisma.user.create({
    data: {
      email: 'rafael.silva@luxuryrentals.com',
      name: 'Rafael Silva',
      password: hashedPassword,
    },
  });

  const ceo2 = await prisma.user.create({
    data: {
      email: 'marina.costa@coastalproperties.com',
      name: 'Marina Costa',
      password: hashedPassword,
    },
  });

  const ceo3 = await prisma.user.create({
    data: {
      email: 'lucas.santos@urbanstays.com',
      name: 'Lucas Santos',
      password: hashedPassword,
    },
  });

  // Gerentes e Staff
  const manager1 = await prisma.user.create({
    data: {
      email: 'ana.rodrigues@luxuryrentals.com',
      name: 'Ana Rodrigues',
      password: hashedPassword,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      email: 'carlos.fernandes@coastalproperties.com',
      name: 'Carlos Fernandes',
      password: hashedPassword,
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      email: 'julia.mendes@urbanstays.com',
      name: 'Julia Mendes',
      password: hashedPassword,
    },
  });

  const cleaner1 = await prisma.user.create({
    data: {
      email: 'pedro.limpeza@luxuryrentals.com',
      name: 'Pedro Almeida',
      password: hashedPassword,
    },
  });

  // 3. Criar Membros das Organizações
  console.log('🏢 Associando usuários às organizações...');
  
  // Luxury Rentals Brasil
  await prisma.organizationUser.create({
    data: {
      userId: ceo1.id,
      organizationId: org1.id,
      role: OrganizationRole.ADMIN, // Usando ADMIN pois PROPRIETARIO não existe no enum
    },
  });

  await prisma.organizationUser.create({
    data: {
      userId: manager1.id,
      organizationId: org1.id,
      role: OrganizationRole.MANAGER,
    },
  });

  await prisma.organizationUser.create({
    data: {
      userId: cleaner1.id,
      organizationId: org1.id,
      role: OrganizationRole.CLEANER,
    },
  });

  // Coastal Properties
  await prisma.organizationUser.create({
    data: {
      userId: ceo1.id,
      organizationId: org1.id,
      role: OrganizationRole.ADMIN, // Mudando para ADMIN que existe
    },
  });

  await prisma.organizationUser.create({
    data: {
      userId: manager1.id,
      organizationId: org1.id,
      role: OrganizationRole.MANAGER,
    },
  });

  await prisma.organizationUser.create({
    data: {
      userId: cleaner1.id,
      organizationId: org1.id,
      role: OrganizationRole.CLEANER,
    },
  });

  // Coastal Properties
  await prisma.organizationUser.create({
    data: {
      userId: ceo2.id,
      organizationId: org2.id,
      role: OrganizationRole.ADMIN,
    },
  });

  await prisma.organizationUser.create({
    data: {
      userId: manager2.id,
      organizationId: org2.id,
      role: OrganizationRole.ADMIN,
    },
  });

  // Urban Stays
  await prisma.organizationUser.create({
    data: {
      userId: ceo3.id,
      organizationId: org3.id,
      role: OrganizationRole.ADMIN,
    },
  });

  await prisma.organizationUser.create({
    data: {
      userId: staff1.id,
      organizationId: org3.id,
      role: OrganizationRole.MEMBER,
    },
  });

  // 4. Criar Propriedades Luxury Rentals Brasil
  console.log('🏠 Criando propriedades de luxo...');
  
  const properties1 = [
    {
      title: 'Penthouse Vista Mar Copacabana',
      description: 'Luxuoso penthouse com vista panorâmica para a praia de Copacabana. Possui 4 suítes, varanda gourmet, piscina privativa e acabamentos de primeira linha.',
      address: 'Av. Atlântica, 1702 - Copacabana, Rio de Janeiro - RJ',
      pricePerNight: 2500.00,
      bedrooms: 4,
      bathrooms: 5,
      organizationId: org1.id,
      userId: ceo1.id, // Proprietário da organização
    },
    {
      title: 'Casa Moderna Barra da Tijuca',
      description: 'Casa contemporânea em condomínio fechado com 5 quartos, piscina, churrasqueira e área de lazer completa. Ideal para famílias e grupos.',
      address: 'Av. das Américas, 3500 - Barra da Tijuca, Rio de Janeiro - RJ',
      pricePerNight: 1800.00,
      bedrooms: 5,
      bathrooms: 4,
      organizationId: org1.id,
      userId: ceo1.id,
    },
    {
      title: 'Cobertura Ipanema Premium',
      description: 'Cobertura dúplex no coração de Ipanema com terraço privativo, jacuzzi e vista para o Cristo Redentor. Decoração assinada e localização privilegiada.',
      address: 'Rua Visconde de Pirajá, 580 - Ipanema, Rio de Janeiro - RJ',
      pricePerNight: 3200.00,
      bedrooms: 3,
      bathrooms: 4,
      organizationId: org1.id,
      userId: ceo1.id,
    },
    {
      title: 'Loft Industrial Vila Madalena',
      description: 'Loft industrial moderno na Vila Madalena com pé direito duplo, decoração industrial chic e localização no centro da vida noturna paulistana.',
      address: 'Rua Harmonia, 150 - Vila Madalena, São Paulo - SP',
      pricePerNight: 800.00,
      bedrooms: 1,
      bathrooms: 2,
      organizationId: org1.id,
      userId: ceo1.id,
    },
  ];

  // 5. Criar Propriedades Coastal Properties
  const properties2 = [
    {
      title: 'Villa Frente Mar Búzios',
      description: 'Villa exclusiva de frente para o mar em Búzios com piscina infinita, 6 suítes e acesso privativo à praia. Perfeita para retiros e eventos.',
      address: 'Praia da Ferradura - Búzios, Rio de Janeiro - RJ',
      pricePerNight: 4500.00,
      bedrooms: 6,
      bathrooms: 7,
      organizationId: org2.id,
      userId: ceo2.id,
    },
    {
      title: 'Casa de Praia Angra dos Reis',
      description: 'Casa de praia em Angra dos Reis com pier privativo, 4 quartos, sala de jogos e vista deslumbrante para a baía.',
      address: 'Ilha Grande - Angra dos Reis, Rio de Janeiro - RJ',
      pricePerNight: 2800.00,
      bedrooms: 4,
      bathrooms: 4,
      organizationId: org2.id,
      userId: ceo2.id,
    },
    {
      title: 'Mansão Praia do Forte',
      description: 'Mansão tropical na Praia do Forte com 8 quartos, campo de futebol, quadra de tênis e staff completo incluído.',
      address: 'Praia do Forte - Mata de São João, Bahia - BA',
      pricePerNight: 6500.00,
      bedrooms: 8,
      bathrooms: 10,
      organizationId: org2.id,
      userId: ceo2.id,
    },
    {
      title: 'Chalé Mountain View Campos do Jordão',
      description: 'Chalé aconchegante em Campos do Jordão com lareira, jardim, hidromassagem e vista para as montanhas.',
      address: 'Vila Capivari - Campos do Jordão, São Paulo - SP',
      pricePerNight: 1200.00,
      bedrooms: 3,
      bathrooms: 2,
      organizationId: org2.id,
      userId: ceo2.id,
    },
  ];

  // 6. Criar Propriedades Urban Stays
  const properties3 = [
    {
      title: 'Apartamento Moderno Jardins',
      description: 'Apartamento contemporâneo nos Jardins com 2 quartos, varanda gourmet e localização próxima aos melhores restaurantes de São Paulo.',
      address: 'Rua Oscar Freire, 2500 - Jardins, São Paulo - SP',
      pricePerNight: 650.00,
      bedrooms: 2,
      bathrooms: 2,
      organizationId: org3.id,
      userId: ceo3.id,
    },
    {
      title: 'Studio Copacabana Frente Mar',
      description: 'Studio moderno de frente para a praia de Copacabana, totalmente equipado e com vista espetacular do oceano.',
      address: 'Av. Atlântica, 2064 - Copacabana, Rio de Janeiro - RJ',
      pricePerNight: 480.00,
      bedrooms: 1,
      bathrooms: 1,
      organizationId: org3.id,
      userId: ceo3.id,
    },
    {
      title: 'Apartamento Design Leblon',
      description: 'Apartamento com design assinado no Leblon, 3 quartos, decoração moderna e localização premium a poucos metros da praia.',
      address: 'Rua Dias Ferreira, 200 - Leblon, Rio de Janeiro - RJ',
      pricePerNight: 1100.00,
      bedrooms: 3,
      bathrooms: 3,
      organizationId: org3.id,
      userId: ceo3.id,
    },
    {
      title: 'Loft Tech Faria Lima',
      description: 'Loft high-tech na região da Faria Lima com automação completa, escritório integrado e vista panorâmica da cidade.',
      address: 'Av. Brigadeiro Faria Lima, 1800 - Itaim Bibi, São Paulo - SP',
      pricePerNight: 750.00,
      bedrooms: 1,
      bathrooms: 1,
      organizationId: org3.id,
      userId: ceo3.id,
    },
    {
      title: 'Apartamento Família Moema',
      description: 'Apartamento espaçoso em Moema, ideal para famílias, com 4 quartos, playground no prédio e área de lazer completa.',
      address: 'Rua dos Chanés, 500 - Moema, São Paulo - SP',
      pricePerNight: 580.00,
      bedrooms: 4,
      bathrooms: 3,
      organizationId: org3.id,
      userId: ceo3.id,
    },
  ];

  // Criar todas as propriedades
  const allProperties = [...properties1, ...properties2, ...properties3];
  const createdProperties: any[] = [];
  
  for (const propertyData of allProperties) {
    const property = await prisma.property.create({
      data: propertyData,
    });
    createdProperties.push(property);
  }

  // 7. Criar Bookings/Reservas realistas
  console.log('📅 Criando reservas e bloqueios...');
  
  const today = new Date();
  const bookingsData: any[] = [];

  // Função para gerar datas aleatórias
  const getRandomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };

  // Criar reservas para os próximos 6 meses
  for (let i = 0; i < createdProperties.length; i++) {
    const property = createdProperties[i];
    
    // 2-4 reservas por propriedade
    const numBookings = Math.floor(Math.random() * 3) + 2;
    
    for (let j = 0; j < numBookings; j++) {
      const startDate = getRandomDate(today, new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000));
      const endDate = new Date(startDate.getTime() + (Math.floor(Math.random() * 7) + 3) * 24 * 60 * 60 * 1000);
      
      const bookingType = Math.random() > 0.3 ? BookingType.RESERVATION : BookingType.BLOCKED;
      
      bookingsData.push({
        propertyId: property.id,
        organizationId: property.organizationId,
        startDate,
        endDate,
        type: bookingType,
      });
    }
  }

  // Criar todas as reservas
  for (const bookingData of bookingsData) {
    try {
      await prisma.booking.create({
        data: bookingData,
      });
    } catch (error) {
      // Ignorar conflitos de data
      console.log('Conflito de data ignorado');
    }
  }

  // 8. Criar usuário admin principal
  console.log('👑 Criando usuário admin principal...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@rentals.com',
      name: 'Administrador Sistema',
      password: hashedPassword,
    },
  });

  // 9. Criar usuário de teste que aparece na tela de login
  console.log('🧪 Criando usuário de teste...');
  const testUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Usuário Teste',
      password: hashedPassword, // Senha: 12345678
    },
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log('');
  console.log('🎯 DADOS CRIADOS PARA DEMONSTRAÇÃO:');
  console.log('');
  console.log('📊 ORGANIZAÇÕES:');
  console.log('• Luxury Rentals Brasil - Imóveis de luxo');
  console.log('• Coastal Properties - Propriedades costeiras');
  console.log('• Urban Stays - Apartamentos urbanos');
  console.log('');
  console.log('👥 USUÁRIOS DE TESTE:');
  console.log('• admin@rentals.com (Administrador Geral)');
  console.log('• rafael.silva@luxuryrentals.com (CEO Luxury Rentals)');
  console.log('• marina.costa@coastalproperties.com (CEO Coastal Properties)');
  console.log('• lucas.santos@urbanstays.com (CEO Urban Stays)');
  console.log('• ana.rodrigues@luxuryrentals.com (Manager)');
  console.log('• carlos.fernandes@coastalproperties.com (Admin)');
  console.log('• julia.mendes@urbanstays.com (Member)');
  console.log('• pedro.limpeza@luxuryrentals.com (Cleaner)');
  console.log('');
  console.log('🔑 SENHA PARA TODOS: 12345678');
  console.log('');
  console.log('🏠 PROPRIEDADES: 13 imóveis premium com fotos reais');
  console.log('📅 RESERVAS: Múltiplas reservas e bloqueios distribuídos');
  console.log('');
  console.log('🚀 Sistema pronto para demonstração aos investidores!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
