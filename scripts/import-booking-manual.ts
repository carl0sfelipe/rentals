import { PrismaClient, BookingType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const USER_EMAIL = 'karinaafm@gmail.com';
const USER_PASS = '12345678';
const USER_NAME = 'Karina Martins';

// Dados extraídos manualmente do texto fornecido
const rawData = [
  {
    externalId: '12205094',
    propertyName: 'Ap p/ 10 pessoas a 10 min do Centro e da Pampulha',
    address: '379 Rua Francisco da Veiga, Belo Horizonte',
    guestName: 'Carolina Alves de Oliveira Gotelip',
    guestCount: 7, // "7 adultos"
    checkIn: '2026-02-01', // 1º de fev. de 2026
    checkOut: '2026-02-08', // 8 de fev. de 2026
    bookingRef: '6030493746',
    price: 1008.10
  },
  {
    externalId: '12205264',
    propertyName: 'Ap 4 quartos Centro Sul de BH',
    address: '95 Rua São Tomás de Aquino, Belo Horizonte',
    guestName: 'Jéssica Firmo Ramos',
    guestCount: 7, // "6 adultos, 1 criança"
    checkIn: '2026-02-01',
    checkOut: '2026-02-08',
    bookingRef: '6146029689',
    price: 2134.36
  },
  {
    externalId: '12205068',
    propertyName: 'Ap para até 10 pessoas Caiçara',
    address: '379 Rua Francisco da Veiga, Belo Horizonte',
    guestName: 'Ingrid Pereira',
    guestCount: 9, // "9 adultos"
    checkIn: '2026-02-04',
    checkOut: '2026-02-08',
    bookingRef: '6604641277',
    price: 1296.00
  },
  {
    externalId: '12205278',
    propertyName: 'Casa segundo andar no Santa Efigênia',
    address: '375 Rua Coronel Otavio Diniz, Belo Horizonte',
    guestName: 'AVELINA ALVES LIMA',
    guestCount: 5, // "5 adultos"
    checkIn: '2026-02-13',
    checkOut: '2026-02-18',
    bookingRef: '5842569988',
    price: 3466.80
  },
  {
    externalId: '11826865',
    propertyName: 'Ap Central no Floresta para até 9 pessoas',
    address: '3 Dona Leonidia Leite, Belo Horizonte',
    guestName: 'Lucas Pellis',
    guestCount: 8, // "8 adultos"
    checkIn: '2026-02-13',
    checkOut: '2026-02-18',
    bookingRef: '6339989665',
    price: 8100.00
  },
  {
    externalId: '12205264', // Mesma propriedade da 2ª entrada
    propertyName: 'Ap 4 quartos Centro Sul de BH',
    address: '95 Rua São Tomás de Aquino, Belo Horizonte',
    guestName: 'Viviane Valentim de Alencar',
    guestCount: 4, // "4 adultos"
    checkIn: '2026-03-14',
    checkOut: '2026-03-15',
    bookingRef: '6845982950',
    price: 544.50
  },
  {
    externalId: '14655510',
    propertyName: 'Casa para até 16 pessoas no Lurdes, perto da Savassi BH',
    address: 'Rua Fernandes Tourinho, 1019, Belo Horizonte',
    guestName: 'Vanessa Vicente',
    guestCount: 2, // "2 adultos"
    checkIn: '2026-07-29',
    checkOut: '2026-08-02',
    bookingRef: '5748669533',
    price: 4039.20
  }
];

async function main() {
  console.log('🚀 Iniciando importação manual do Booking.com...');

  // 1. Setup User
  let user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });

  if (!user) {
    console.log(`👤 Usuário ${USER_EMAIL} não encontrado. Criando...`);
    const hashedPassword = await bcrypt.hash(USER_PASS, 10);
    user = await prisma.user.create({
      data: {
        email: USER_EMAIL,
        name: USER_NAME,
        password: hashedPassword,
      },
    });
    console.log(`✅ Usuário criado com ID: ${user.id}`);
  } else {
    console.log(`✅ Usuário encontrado: ${user.id}`);
  }

  // 2. Process Data
  for (const item of rawData) {
    console.log(`
Processando: ${item.propertyName} (${item.bookingRef})...`);

    // Find or Create Property
    // Como não temos o ID externo no banco ainda, vamos buscar pelo nome exato para evitar duplicatas neste script
    // Em um cenário real, adicionaríamos um campo 'externalId' no schema.
    let property = await prisma.property.findFirst({
      where: {
        title: item.propertyName,
        userId: user.id
      }
    });

    if (!property) {
      console.log(`🏠 Propriedade não encontrada. Criando: ${item.propertyName}`);
      property = await prisma.property.create({
        data: {
          title: item.propertyName,
          description: `Importada do Booking.com. Localização: ${item.address}`,
          address: item.address,
          pricePerNight: Math.round(item.price / 2), // Estimativa simples, já que temos o total
          bedrooms: 1, // Placeholder
          bathrooms: 1, // Placeholder
          userId: user.id,
          // Não temos OrganizationId neste contexto simples, assumindo usuário direto ou lidamos depois
        }
      });
      console.log(`✅ Propriedade criada: ${property.id}`);
    } else {
      console.log(`🏠 Propriedade existente encontrada: ${property.id}`);
    }

    // Create Booking
    const startDate = new Date(item.checkIn);
    const endDate = new Date(item.checkOut);
    
    // Check if booking already exists (avoid duplicates if script runs twice)
    // Usamos a 'observations' para guardar o ID do booking por enquanto
    const existingBooking = await prisma.booking.findFirst({
      where: {
        propertyId: property.id,
        startDate: startDate,
        endDate: endDate,
      }
    });

    if (existingBooking) {
      console.log(`⚠️ Reserva já existe para este período. Pulando.`);
      continue;
    }

    const booking = await prisma.booking.create({
      data: {
        startDate: startDate,
        endDate: endDate,
        type: BookingType.RESERVATION,
        propertyId: property.id,
        guestCount: item.guestCount,
        observations: `Importado do Booking.com\nRef: ${item.bookingRef}\nHóspede: ${item.guestName}\nValor Total: R$ ${item.price}`,
        guestsDetail: {
            name: item.guestName,
            source: 'Booking.com Import'
        }
      }
    });

    console.log(`📅 Reserva criada para ${item.guestName} (${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]})`);
  }

  console.log('\n🏁 Importação concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
