#!/usr/bin/env node

/**
 * Script de Backfill: Single-tenant → Org-Lite
 * 
 * Para cada User existente:
 * 1. Criar 1 Organization ("{user.name || user.email} Org")
 * 2. Criar OrganizationUser(role=ADMIN)
 * 3. Setar organizationId nos registros pertencentes ao usuário
 * 4. Atualizar activeOrganizationId do usuário
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backfillOrganizations() {
  console.log('🚀 Iniciando backfill Single-tenant → Org-Lite...');
  
  try {
    // 1. Buscar todos os usuários existentes
    const users = await prisma.user.findMany({
      include: {
        properties: true,
        // bookings são relacionados via properties
      }
    });

    console.log(`📋 Encontrados ${users.length} usuários para migrar`);

    for (const user of users) {
      console.log(`\n👤 Processando usuário: ${user.email}`);
      
      await prisma.$transaction(async (tx) => {
        // 1. Criar Organization para o usuário
        const orgName = user.name ? `${user.name} Organization` : `${user.email} Organization`;
        const orgSlug = (user.name || user.email)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') + '-org';

        const organization = await tx.organization.create({
          data: {
            name: orgName,
            slug: orgSlug,
          }
        });

        console.log(`  ✅ Organização criada: ${organization.name} (${organization.id})`);

        // 2. Criar OrganizationUser com role ADMIN
        await tx.organizationUser.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: 'ADMIN'
          }
        });

        console.log(`  ✅ Usuário adicionado como ADMIN da organização`);

        // 3. Atualizar organizationId nas propriedades do usuário
        if (user.properties.length > 0) {
          const updatedProperties = await tx.property.updateMany({
            where: { userId: user.id },
            data: { organizationId: organization.id }
          });

          console.log(`  ✅ ${updatedProperties.count} propriedades migradas`);

          // 4. Atualizar organizationId nos bookings das propriedades
          const propertyIds = user.properties.map(p => p.id);
          if (propertyIds.length > 0) {
            const updatedBookings = await tx.booking.updateMany({
              where: { propertyId: { in: propertyIds } },
              data: { organizationId: organization.id }
            });

            console.log(`  ✅ ${updatedBookings.count} bookings migrados`);
          }
        }

        // 5. Atualizar activeOrganizationId do usuário
        await tx.user.update({
          where: { id: user.id },
          data: { activeOrganizationId: organization.id }
        });

        console.log(`  ✅ activeOrganizationId definido para o usuário`);
      });

      console.log(`✨ Usuário ${user.email} migrado com sucesso!`);
    }

    // 6. Verificação final
    const stats = await prisma.$transaction([
      prisma.organization.count(),
      prisma.organizationUser.count(),
      prisma.property.count({ where: { organizationId: { not: null } } }),
      prisma.booking.count({ where: { organizationId: { not: null } } }),
      prisma.user.count({ where: { activeOrganizationId: { not: null } } })
    ]);

    console.log('\n📊 Estatísticas finais:');
    console.log(`  - Organizations: ${stats[0]}`);
    console.log(`  - Organization Users: ${stats[1]}`);
    console.log(`  - Properties migradas: ${stats[2]}`);
    console.log(`  - Bookings migrados: ${stats[3]}`);
    console.log(`  - Users com activeOrganizationId: ${stats[4]}`);

    console.log('\n🎉 Backfill concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  backfillOrganizations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { backfillOrganizations };
