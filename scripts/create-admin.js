const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('12345678', 10);

    // Verifica se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@rentals.com' }
    });

    if (existingUser) {
      console.log('✅ Usuário admin@rentals.com já existe!');
      console.log('Email: admin@rentals.com');
      console.log('Senha: 12345678');
      process.exit(0);
    }

    // Cria o usuário admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@rentals.com',
        name: 'Administrador Sistema',
        password: hashedPassword,
      },
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('Email: admin@rentals.com');
    console.log('Senha: 12345678');
    console.log('ID:', admin.id);
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
