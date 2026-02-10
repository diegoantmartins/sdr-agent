// src/application/cron/cold-storage-7d.job.ts

import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger';
import { LeadService } from '../../domain/lead/lead.service';

export class ColdStorage7dJob {
  private leadService: LeadService;

  constructor(private prisma: PrismaClient) {
    this.leadService = new LeadService(prisma);
  }

  async execute(): Promise<void> {
    const startTime = Date.now();
    logger.info('[ColdStorage7dJob] 🧊 Iniciando arquivamento...');

    const jobLog = await this.prisma.jobLog.create({
      data: {
        jobType: 'cold_storage_7d',
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    try {
      // Find leads sem interação há 7 dias com score baixo
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const leadsToArchive = await this.prisma.activeLead.findMany({
        where: {
          status: { in: ['TRIAGE', 'FOLLOW_UP'] },
          lastMessageAt: { lt: sevenDaysAgo },
          score: { lt: 50 }
        },
        orderBy: { lastMessageAt: 'asc' },
        take: 100
      });

      logger.info(`[ColdStorage7dJob] Encontrados ${leadsToArchive.length} leads`);

      let processed = 0;
      let skipped = 0;

      for (const lead of leadsToArchive) {
        try {
          await this.leadService.archiveLead(lead.tenantId, lead.phone, 'no_response_7d');
          processed++;
        } catch (err) {
          logger.error(`[ColdStorage7dJob] Erro ao arquivar ${lead.phone}:`, err);
          skipped++;
        }
      }

      const duration = Date.now() - startTime;

      await this.prisma.jobLog.update({
        where: { id: jobLog.id },
        data: {
          status: 'SUCCESS',
          leadsProcessed: processed,
          leadsSkipped: skipped,
          completedAt: new Date(),
          duration
        }
      });

      logger.info(
        `[ColdStorage7dJob] ✅ Concluído em ${duration}ms (${processed} arquivados, ${skipped} erros)`
      );
    } catch (error) {
      logger.error('[ColdStorage7dJob] ❌ Erro crítico:', error);

      await this.prisma.jobLog.update({
        where: { id: jobLog.id },
        data: {
          status: 'FAILED',
          error: String(error),
          completedAt: new Date(),
          duration: Date.now() - startTime
        }
      });

      throw error;
    }
  }
}
