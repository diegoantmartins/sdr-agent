import { describe, expect, it, vi } from 'vitest';
import { LeadService } from '@domain/lead/lead.service';

describe('LeadService', () => {
  it('deve aplicar intentClassified no updateLead', async () => {
    const prisma = {
      activeLead: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'lead-1',
          tenantId: 'tenant-a',
          phone: '5511999999999',
          name: 'Lead',
          email: null,
          company: null,
          score: 10,
          status: 'TRIAGE',
          conversionStage: null,
          intentClassified: null,
          metadata: {}
        }),
        update: vi.fn().mockResolvedValue({ id: 'lead-1', intentClassified: 'BUY_NOW' })
      }
    } as any;

    const service = new LeadService(prisma);

    await service.updateLead('tenant-a', '5511999999999', {
      intentClassified: 'BUY_NOW'
    });

    expect(prisma.activeLead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          intentClassified: 'BUY_NOW'
        })
      })
    );
  });

  it('deve consultar hot leads somente com status HOT', async () => {
    const prisma = {
      activeLead: {
        findMany: vi.fn().mockResolvedValue([])
      }
    } as any;

    const service = new LeadService(prisma);
    await service.getHotLeads('tenant-a');

    expect(prisma.activeLead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-a',
          status: { in: ['HOT'] }
        })
      })
    );
  });
});
