import { describe, expect, it } from 'vitest';
import { isWebhookAuthorized } from '@application/webhooks/webhook-auth';
import { safeCompare } from '@shared/utils/security';

describe('webhook auth', () => {
  it('deve autorizar quando não há segredo esperado', () => {
    const authorized = isWebhookAuthorized({}, {});
    expect(authorized).toBe(true);
  });

  it('deve negar quando segredo esperado existe mas header não foi enviado', () => {
    const authorized = isWebhookAuthorized({}, { expectedSecret: 'abc123' });
    expect(authorized).toBe(false);
  });

  it('deve autorizar quando header possui segredo correto', () => {
    const authorized = isWebhookAuthorized(
      { 'x-webhook-secret': 'abc123' },
      { expectedSecret: 'abc123' }
    );

    expect(authorized).toBe(true);
  });

  it('deve negar quando segredo não corresponde', () => {
    const authorized = isWebhookAuthorized(
      { 'x-webhook-secret': 'errado' },
      { expectedSecret: 'abc123' }
    );

    expect(authorized).toBe(false);
  });

  it('safeCompare deve retornar false para tamanhos diferentes', () => {
    expect(safeCompare('abc', 'abcd')).toBe(false);
  });
});
