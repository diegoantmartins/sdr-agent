import { describe, expect, it } from 'vitest';
import { commercialEngineService } from '../../src/services/commercial/commercial-engine.service';

describe('CommercialEngineService', () => {
  it('deve retornar templates de nicho', () => {
    const templates = commercialEngineService.getTemplates();
    expect(templates.length).toBeGreaterThan(3);
  });

  it('deve recomendar handoff para lead quente', () => {
    const rec = commercialEngineService.getNextBestAction({
      niche: 'saas',
      score: 90,
      intent: 'BUY_NOW'
    });

    expect(rec.action).toBe('handoff_human_closer');
  });
});
