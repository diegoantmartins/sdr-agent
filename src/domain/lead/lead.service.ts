// src/domain/lead/lead.service.ts

import { ActiveLead, IntentType, LeadStatus, PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger';
import { NotFoundError } from '../../shared/utils/errors';

export interface CreateLeadDTO {
  tenantId: string;
  phone: string;
  name: string;
  email?: string;
  company?: string;
  source?: string;
  campaignId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateLeadDTO {
  name?: string;
  email?: string;
  company?: string;
  score?: number;
  status?: LeadStatus;
  conversionStage?: string;
  intentClassified?: IntentType;
  metadata?: Record<string, any>;
}

export class LeadService {
  constructor(private prisma: PrismaClient) {}

  async createLead(data: CreateLeadDTO): Promise<ActiveLead> {
    const existing = await this.prisma.activeLead.findUnique({
      where: {
        tenant_phone_unique: {
          tenantId: data.tenantId,
          phone: data.phone
        }
      }
    });

    if (existing) {
      logger.info(`[LeadService] Lead ${data.phone} já existe (tenant=${data.tenantId})`);
      return existing;
    }

    const lead = await this.prisma.activeLead.create({
      data: {
        tenantId: data.tenantId,
        phone: data.phone,
        name: data.name,
        email: data.email,
        company: data.company,
        source: data.source || 'whatsapp',
        campaignId: data.campaignId,
        metadata: data.metadata || {}
      }
    });

    logger.info(`[LeadService] Lead criado: ${data.phone} (tenant=${data.tenantId})`);
    return lead;
  }

  async getLead(tenantId: string, phone: string): Promise<ActiveLead | null> {
    return this.prisma.activeLead.findUnique({
      where: {
        tenant_phone_unique: {
          tenantId,
          phone
        }
      }
    });
  }

  async getLeadOrThrow(tenantId: string, phone: string): Promise<ActiveLead> {
    const lead = await this.getLead(tenantId, phone);
    if (!lead) {
      throw new NotFoundError(`Lead ${phone} não encontrado`);
    }
    return lead;
  }

  async updateLead(tenantId: string, phone: string, data: UpdateLeadDTO): Promise<ActiveLead> {
    const lead = await this.getLeadOrThrow(tenantId, phone);

    return this.prisma.activeLead.update({
      where: { id: lead.id },
      data: {
        name: data.name || lead.name,
        email: data.email || lead.email,
        company: data.company || lead.company,
        score: data.score !== undefined ? data.score : lead.score,
        status: data.status || lead.status,
        intentClassified: data.intentClassified !== undefined ? data.intentClassified : lead.intentClassified,
        conversionStage: data.conversionStage || lead.conversionStage,
        metadata: data.metadata ? { ...(lead.metadata as any), ...data.metadata } : lead.metadata
      }
    });
  }

  async registerIncomingMessage(tenantId: string, phone: string): Promise<void> {
    const lead = await this.getLeadOrThrow(tenantId, phone);

    await this.prisma.activeLead.update({
      where: { id: lead.id },
      data: {
        messageCount: {
          increment: 1
        },
        lastMessageAt: new Date()
      }
    });
  }

  async incrementScore(tenantId: string, phone: string, points: number): Promise<void> {
    const lead = await this.getLeadOrThrow(tenantId, phone);
    const newScore = Math.min(100, Math.max(0, lead.score + points));

    await this.prisma.activeLead.update({
      where: { id: lead.id },
      data: { score: newScore }
    });

    logger.debug(`[LeadService] Score de ${phone} atualizado: ${lead.score} -> ${newScore}`);
  }

  async getHotLeads(tenantId: string): Promise<ActiveLead[]> {
    return this.prisma.activeLead.findMany({
      where: {
        tenantId,
        status: { in: ['HOT'] as LeadStatus[] },
        score: { gte: 80 }
      },
      orderBy: { score: 'desc' }
    });
  }

  async getTriageLeads(tenantId: string, limit: number = 50): Promise<ActiveLead[]> {
    return this.prisma.activeLead.findMany({
      where: { tenantId, status: 'TRIAGE' },
      orderBy: { lastMessageAt: 'desc' },
      take: limit
    });
  }

  async getLeadsForFollowUp(tenantId: string, hoursAgo: number): Promise<ActiveLead[]> {
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    return this.prisma.activeLead.findMany({
      where: {
        tenantId,
        lastMessageAt: { lt: since },
        status: { in: ['TRIAGE', 'FOLLOW_UP'] as LeadStatus[] }
      },
      orderBy: { lastMessageAt: 'asc' }
    });
  }

  async archiveLead(tenantId: string, phone: string, reason: string): Promise<void> {
    const lead = await this.getLeadOrThrow(tenantId, phone);

    await this.prisma.activeLead.update({
      where: { id: lead.id },
      data: { status: 'ARCHIVED' }
    });

    await this.prisma.coldLead.create({
      data: {
        tenantId,
        originalLeadId: lead.id,
        phone: lead.phone,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        lastScore: lead.score,
        lastStatus: lead.status,
        freezeReason: reason,
        conversationData: {
          messages: lead.messageCount,
          stage: lead.conversionStage
        } as any
      }
    });

    logger.info(`[LeadService] Lead ${phone} arquivado: ${reason}`);
  }
}
