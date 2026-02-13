import { PrismaClient } from '@prisma/client';

export class ConversationMetricsService {
  constructor(private prisma: PrismaClient) {}

  async registerMessage(leadId: string, direction: 'incoming' | 'outgoing'): Promise<void> {
    const metric = await this.prisma.conversationMetric.findFirst({
      where: { leadId },
      orderBy: { createdAt: 'desc' }
    });

    const updates = {
      messageCount: { increment: 1 },
      userMessageCount: direction === 'incoming' ? { increment: 1 } : undefined,
      aiMessageCount: direction === 'outgoing' ? { increment: 1 } : undefined
    } as any;

    if (!metric) {
      await this.prisma.conversationMetric.create({
        data: {
          leadId,
          messageCount: 1,
          userMessageCount: direction === 'incoming' ? 1 : 0,
          aiMessageCount: direction === 'outgoing' ? 1 : 0
        }
      });
      return;
    }

    await this.prisma.conversationMetric.update({
      where: { id: metric.id },
      data: updates
    });
  }
}
