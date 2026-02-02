// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar alguns leads de exemplo
  const lead1 = await prisma.activeLead.upsert({
    where: { phone: '5511999999999' },
    update: {},
    create: {
      phone: '5511999999999',
      name: 'João Silva',
      email: 'joao@example.com',
      company: 'Tech Solutions',
      source: 'whatsapp',
      score: 75,
      status: 'TRIAGE'
    }
  });

  const lead2 = await prisma.activeLead.upsert({
    where: { phone: '5511988888888' },
    update: {},
    create: {
      phone: '5511988888888',
      name: 'Maria Santos',
      email: 'maria@example.com',
      company: 'Industrial Corp',
      source: 'whatsapp',
      score: 45,
      status: 'TRIAGE'
    }
  });

  console.log('✅ Leads criados:', { lead1: lead1.name, lead2: lead2.name });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
