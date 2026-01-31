
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const USER_EMAIL = 'karinaafm@gmail.com';

async function main() {
  console.log(`🗑️ Iniciando limpeza para: ${USER_EMAIL}`);

  const user = await prisma.user.findUnique({
    where: { email: USER_EMAIL },
    include: { properties: true } // Pegar propriedades para deletar bookings delas
  });

  if (!user) {
    console.log('User not found. Nothing to delete.');
    return;
  }

  console.log(`Found user: ${user.id}`);

  // 1. Delete Bookings (via Properties)
  // Mesmo se tiver cascade, bom garantir
  const propertyIds = user.properties.map(p => p.id);
  if (propertyIds.length > 0) {
    const deletedBookings = await prisma.booking.deleteMany({
      where: { propertyId: { in: propertyIds } }
    });
    console.log(`Deleted ${deletedBookings.count} bookings.`);
    
    const deletedEvents = await prisma.calendarEvent.deleteMany({
        where: { propertyId: { in: propertyIds } }
    });
    console.log(`Deleted ${deletedEvents.count} calendar events.`);
  }

  // 2. Delete Properties
  const deletedProps = await prisma.property.deleteMany({
    where: { userId: user.id }
  });
  console.log(`Deleted ${deletedProps.count} properties.`);

  // 3. Delete Organization Memberships
  await prisma.organizationUser.deleteMany({
    where: { userId: user.id }
  });
  console.log('Deleted organization memberships.');

  // 4. Delete User (Finally)
  // Na verdade, não vou deletar a conta do usuário para você não precisar registrar de novo.
  // Vou deletar apenas os DADOS (Propriedades e Reservas).
  // Se quiser deletar o user também, descomente abaixo.
  
  // await prisma.user.delete({ where: { id: user.id } });
  // console.log('Deleted user account.');
  
  console.log('✅ Dados limpos! Usuário mantido, mas sem propriedades/reservas.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
