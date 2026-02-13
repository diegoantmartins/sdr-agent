import { describe, expect, it } from 'vitest';
import { PROVIDER_CAPABILITIES } from '@domain/integrations/integration.types';

describe('Integration capabilities', () => {
  it('deve expor provider calcom com create_meeting', () => {
    expect(PROVIDER_CAPABILITIES.calcom).toContain('create_meeting');
  });

  it('deve expor provider rd_station com upsert_lead', () => {
    expect(PROVIDER_CAPABILITIES.rd_station).toContain('upsert_lead');
  });

  it('deve manter generic_http com custom_request', () => {
    expect(PROVIDER_CAPABILITIES.generic_http).toEqual(['custom_request']);
  });
});
