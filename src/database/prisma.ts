// src/database/prisma.ts

import { PrismaClient } from '@prisma/client';
import { logger } from '../shared/utils/logger';

let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();

    if (process.env.NODE_ENV === 'development') {
      // Logging configurado quando necessário
    }
  }

  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    logger.info('Prisma disconnected');
  }
}
