/**
 * Script para corrigir URLs de anúncios publicados que estão com localhost
 *
 * Uso:
 *   npx ts-node scripts/fix-published-urls.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Procurando propriedades com URLs localhost...\n');

  // Buscar todas as propriedades que têm publicUrl contendo localhost
  const properties = await prisma.property.findMany({
    where: {
      publicUrl: {
        contains: 'localhost'
      }
    },
    select: {
      id: true,
      title: true,
      publicUrl: true,
    }
  });

  if (properties.length === 0) {
    console.log('✅ Nenhuma propriedade com URL localhost encontrada.');
    return;
  }

  console.log(`📋 Encontradas ${properties.length} propriedades com URLs localhost:\n`);

  properties.forEach((prop, index) => {
    console.log(`${index + 1}. ${prop.title}`);
    console.log(`   URL antiga: ${prop.publicUrl}`);
  });

  console.log('\n🔧 Corrigindo URLs...\n');

  // Função para obter a URL correta do frontend
  const getFrontendUrl = () => {
    if (process.env.FRONTEND_URL) {
      return process.env.FRONTEND_URL;
    }

    const nodeEnv = process.env.NODE_ENV || 'development';

    if (nodeEnv === 'production' && process.env.FRONTEND_URL_PROD) {
      return process.env.FRONTEND_URL_PROD;
    }

    if (nodeEnv === 'test' && process.env.FRONTEND_URL_TEST) {
      return process.env.FRONTEND_URL_TEST;
    }

    if (nodeEnv === 'development' && process.env.FRONTEND_URL_DEV) {
      return process.env.FRONTEND_URL_DEV;
    }

    return 'http://localhost:5173';
  };

  const frontendUrl = getFrontendUrl();
  console.log(`🌐 URL do frontend detectada: ${frontendUrl}\n`);

  // Atualizar cada propriedade
  for (const property of properties) {
    // Extrair o slug da URL antiga
    const match = property.publicUrl?.match(/\/public\/(.+)$/);
    const slug = match ? match[1] : `ad-${property.id}`;

    const newUrl = `${frontendUrl}/public/${slug}`;

    await prisma.property.update({
      where: { id: property.id },
      data: { publicUrl: newUrl }
    });

    console.log(`✅ ${property.title}`);
    console.log(`   Nova URL: ${newUrl}\n`);
  }

  console.log(`\n🎉 Sucesso! ${properties.length} URLs foram atualizadas.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
