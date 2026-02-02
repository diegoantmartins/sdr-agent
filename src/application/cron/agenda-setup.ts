// src/application/cron/agenda-setup.ts

import Agenda from 'agenda';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger';
import { FollowUp24hJob } from './follow-up-24h.job';
import { ColdStorage7dJob } from './cold-storage-7d.job';

export async function setupAgenda(
  mongoUrl: string,
  prisma: PrismaClient
): Promise<Agenda> {
  logger.info('[Agenda] Inicializando...');

  const agenda = new Agenda({
    db: {
      address: mongoUrl,
      collection: 'agendaJobs',
      options: { useUnifiedTopology: true } as any
    },
    maxConcurrency: 5,
    processEvery: '30 seconds'
  });

  // ========== Jobs ==========
  const followUp = new FollowUp24hJob(prisma);
  const coldStorage = new ColdStorage7dJob(prisma);

  // ========== Define Jobs ==========
  agenda.define('follow-up-24h', async (_job: any) => {
    await followUp.execute();
  });

  agenda.define('cold-storage-7d', async (_job: any) => {
    await coldStorage.execute();
  });

  // ========== Event Handlers ==========
  agenda.on('start', (job) => {
    logger.info(`[Agenda] Job iniciado: ${job.attrs.name}`);
  });

  agenda.on('complete', (job) => {
    logger.info(`[Agenda] Job concluído: ${job.attrs.name}`);
  });

  agenda.on('fail', (err, job) => {
    logger.error(`[Agenda] Job falhou: ${job.attrs.name}`, err);
  });

  // ========== Start Agenda ==========
  await agenda.start();
  logger.info('[Agenda] ✅ Sistema de jobs iniciado');

  // ========== Schedule Jobs ==========
  await agenda.every('1 hour', 'follow-up-24h');
  await agenda.every('12 hours', 'cold-storage-7d');

  return agenda;
}
