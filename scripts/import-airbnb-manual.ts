import { PrismaClient, BookingType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const USER_EMAIL = 'karinaafm@gmail.com';

// Dados extraídos manualmente do texto do Airbnb (Referência: 31 Jan 2026)
const rawData = [
  // --- Reservas Futuras ---
  {
    guestName: 'Gabrielle',
    guestCount: 1, // Não especificado, assumindo 1
    propertyName: 'Floresta Central BH com varanda e vista para Serra',
    checkIn: '2026-02-02',
    checkOut: '2026-02-05',
  },
  {
    guestName: 'Thatielly',
    guestCount: 6, // "Thatielly’s group of 6"
    propertyName: 'Floresta BH Central Ótimo custo benefício',
    checkIn: '2026-02-06',
    checkOut: '2026-02-08',
  },
  {
    guestName: 'Rosana',
    guestCount: 12, // "Rosana’s group of 12"
    propertyName: 'Ampla casa no Lourdes, ideal para grupos grandes',
    checkIn: '2026-02-06',
    checkOut: '2026-02-09',
  },
  {
    guestName: 'Eudes',
    guestCount: 8, // "Eudes’s group of 8"
    propertyName: 'Central no Floresta bem localizado, para até 8 8',
    checkIn: '2026-02-06',
    checkOut: '2026-02-08',
  },
  {
    guestName: 'Marcelo',
    guestCount: 6, // "Marcelo’s group of 6"
    propertyName: 'Caiçara BH próximo ao centro e Pampulha 1por andar',
    checkIn: '2026-02-06',
    checkOut: '2026-02-08',
  },
  {
    guestName: 'Magno',
    guestCount: 4, // "Magno’s group of 4"
    propertyName: 'Floresta Central BH com varanda e vista para Serra',
    checkIn: '2026-02-06',
    checkOut: '2026-02-08',
  },
  {
    guestName: 'Tatiane',
    guestCount: 1, // Não especificado
    propertyName: 'Ap Caiçara simples e econômico para até 10 pessoas',
    checkIn: '2026-02-07',
    checkOut: '2026-02-09',
  },
  {
    guestName: 'Leandro',
    guestCount: 2, // "Leandro’s group of 2"
    propertyName: 'Confortável e central no Floresta com varanda',
    checkIn: '2026-02-10',
    checkOut: '2026-02-13',
  },
  {
    guestName: 'Andrezza',
    guestCount: 7, // "Andrezza’s group of 7"
    propertyName: 'Floresta BH Central Ótimo custo benefício',
    checkIn: '2026-02-11',
    checkOut: '2026-02-14',
  },
  {
    guestName: 'Gabriela',
    guestCount: 8, // "Gabriela’s group of 8"
    propertyName: 'Caiçara BH próximo ao centro e Pampulha 1por andar',
    checkIn: '2026-02-13',
    checkOut: '2026-02-18',
  },
  
  // --- Reservas Atuais (Hoje: 31 Jan) ---
  {
    guestName: 'Laís',
    guestCount: 8, 
    propertyName: 'Caiçara BH próximo ao centro e Pampulha 1por andar',
    checkIn: '2026-01-30', // Assumindo checkin ontem para estar ativo hoje
    checkOut: '2026-02-01', // "Fica mais um dia" a partir de 31/jan
    status: 'ONGOING'
  },
  {
    guestName: 'Carlos',
    guestCount: 8, 
    propertyName: 'Central no Floresta bem localizado, para até 8 8',
    checkIn: '2026-01-30',
    checkOut: '2026-02-01', // "Fica mais um dia"
    status: 'ONGOING'
  },
  {
    guestName: 'Ashallan',
    guestCount: 15, 
    propertyName: 'Ampla casa no Lourdes, ideal para grupos grandes',
    checkIn: '2026-01-30',
    checkOut: '2026-02-01', // "Fica mais um dia"
    status: 'ONGOING'
  },
  {
    guestName: 'Lucas',
    guestCount: 9, 
    propertyName: 'Ap Caiçara simples e econômico para até 10 pessoas',
    checkIn: '2026-01-30',
    checkOut: '2026-02-01', // "Fica mais um dia"
    status: 'ONGOING'
  },
  {
    guestName: 'Cristian',
    guestCount: 4, 
    propertyName: 'Floresta Central BH com varanda e vista para Serra',
    checkIn: '2026-01-30',
    checkOut: '2026-02-01', // "Fica mais um dia"
    status: 'ONGOING'
  },
  {
    guestName: 'Deyse',
    guestCount: 5, 
    propertyName: 'Floresta BH Central Ótimo custo benefício',
    checkIn: '2026-01-30',
    checkOut: '2026-02-04', // "Fica por mais 4 dias" a partir de 31/jan
    status: 'ONGOING'
  }
];

async function main() {
  console.log('🚀 Iniciando importação manual do Airbnb...');

  // 1. Setup User
  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });

  if (!user) {
    console.error(`❌ Usuário ${USER_EMAIL} não encontrado. Rode o script do Booking primeiro.`);
    return;
  }
  console.log(`✅ Usuário encontrado: ${user.name}`);

  // 2. Process Data
  for (const item of rawData) {
    console.log(`
Processando: ${item.propertyName} - Hóspede: ${item.guestName}...`);

    // Find or Create Property
    // Buscando pelo nome exato do Airbnb. 
    // Nota: Isso pode criar duplicatas se o nome for diferente do Booking, mas preserva a integridade da fonte.
    let property = await prisma.property.findFirst({
      where: {
        title: item.propertyName,
        userId: user.id
      }
    });

    if (!property) {
      console.log(`🏠 Propriedade Airbnb não encontrada. Criando: ${item.propertyName}`);
      property = await prisma.property.create({
        data: {
          title: item.propertyName,
          description: `Importada do Airbnb.`,
          address: 'Endereço a confirmar (Airbnb)', // O Airbnb esconde o endereço exato nessas telas
          pricePerNight: 0, // Não temos o preço nestes dados
          bedrooms: 1, // Placeholder
          bathrooms: 1, // Placeholder
          userId: user.id,
        }
      });
      console.log(`✅ Propriedade criada: ${property.id}`);
    } else {
      console.log(`🏠 Propriedade existente encontrada: ${property.id}`);
    }

    // Create Booking
    const startDate = new Date(item.checkIn);
    const endDate = new Date(item.checkOut);
    
    // Check duplication
    const existingBooking = await prisma.booking.findFirst({
      where: {
        propertyId: property.id,
        startDate: startDate,
        endDate: endDate,
        guestsDetail: {
            path: ['name'],
            equals: item.guestName
        }
      }
    });

    if (existingBooking) {
      console.log(`⚠️ Reserva já existe. Pulando.`);
      continue;
    }

    await prisma.booking.create({
      data: {
        startDate: startDate,
        endDate: endDate,
        type: BookingType.RESERVATION,
        propertyId: property.id,
        guestCount: item.guestCount,
        observations: `Importado do Airbnb\nHóspede: ${item.guestName}\nGrupo: ${item.guestCount} pessoas`,
        guestsDetail: {
            name: item.guestName,
            source: 'Airbnb Import'
        }
      }
    });

    console.log(`📅 Reserva Airbnb criada para ${item.guestName} (${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]})`);
  }

  console.log('Importação Airbnb concluída!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
