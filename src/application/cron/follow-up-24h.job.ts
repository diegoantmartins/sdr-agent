// src/application/cron/follow-up-24h.job.ts

import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger';
import axios from 'axios';
import { config } from '../../config/env';

export class FollowUp24hJob {
  private uazapiClient = axios.create({
    baseURL: config.UAZAPI_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.UAZAPI_KEY}`
    }
  });

  constructor(private prisma: PrismaClient) {}

  async execute(): Promise<void> {
    const startTime = Date.now();
    logger.info('[FollowUp24hJob] 🔄 Iniciando varredura...');

    const jobLog = await this.prisma.jobLog.create({
      data: {
        jobType: 'follow_up_24h',
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    try {
      // Find leads sem resposta há mais de 24 horas
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const leadsToFollowUp = await this.prisma.activeLead.findMany({
        where: {
          status: { in: ['TRIAGE', 'FOLLOW_UP'] },
          lastMessageAt: { lt: oneDayAgo }
        },
        orderBy: { lastMessageAt: 'asc' },
        take: 50
      });

      logger.info(`[FollowUp24hJob] Encontrados ${leadsToFollowUp.length} leads`);

      let processed = 0;
      let skipped = 0;

      for (const lead of leadsToFollowUp) {
        try {
          // Gerar mensagem de follow-up
          const followUpMsg = this.generateFollowUpMessage(lead.name);

          // Enviar via UAZAPI
          await this.sendFollowUp(lead.phone, followUpMsg);

          // Atualizar lead
          const today = new Date().toISOString().split('T')[0];
          const currentMetadata = typeof lead.metadata === 'object' && lead.metadata ? lead.metadata : {};
          await this.prisma.activeLead.update({
            where: { id: lead.id },
            data: {
              status: 'FOLLOW_UP',
              metadata: {
                ...currentMetadata,
                followUpSentToday: today,
                lastFollowUpAt: new Date()
              }
            }
          });

          processed++;
        } catch (err) {
          logger.error(`[FollowUp24hJob] Erro ao processar ${lead.phone}:`, err);
          skipped++;
        }
      }

      const duration = Date.now() - startTime;

      // Log do job
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
        `[FollowUp24hJob] ✅ Concluído em ${duration}ms (${processed} processados, ${skipped} erros)`
      );
    } catch (error) {
      logger.error('[FollowUp24hJob] ❌ Erro crítico:', error);

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

  private generateFollowUpMessage(leadName: string): string {
    const messages = [
      `Olá ${leadName}! 👋 Tudo bem?\n\nVi que você teve interesse em nossas soluções. Ainda tem dúvidas? Posso ajudar! 💡`,
      `${leadName}, voltei aqui! 🙋‍♂️\n\nVamos conversar sobre como podemos resolver seu desafio? Tô aqui para ajudar!`,
      `Opa ${leadName}! Esbarramos um no outro antes 😊\n\nTá com tempo para bater um papo rápido?`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  private async sendFollowUp(phone: string, message: string): Promise<void> {
    try {
      await this.uazapiClient.post('/send-message', {
        phone: phone.replace(/\D/g, ''),
        message
      });
    } catch (error) {
      logger.error(`[FollowUp24hJob] Falha ao enviar para ${phone}:`, error);
      throw error;
    }
  }
}
