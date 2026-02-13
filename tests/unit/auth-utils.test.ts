import { describe, expect, it } from 'vitest';
import { assertRole, resolveRoleFromApiKey } from '../../src/shared/utils/auth';

describe('auth utils', () => {
  const config = {
    adminKeys: ['adm-1'],
    sdrKeys: ['sdr-1'],
    clientKeys: ['cli-1']
  };

  it('resolve role corretamente', () => {
    expect(resolveRoleFromApiKey('adm-1', config)).toBe('admin');
    expect(resolveRoleFromApiKey('sdr-1', config)).toBe('sdr');
    expect(resolveRoleFromApiKey('cli-1', config)).toBe('client');
  });

  it('assertRole permite hierarquia', () => {
    const role = assertRole({ 'x-api-key': 'adm-1' }, 'sdr', config);
    expect(role).toBe('admin');
  });
});
