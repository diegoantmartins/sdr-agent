import { ValidationError } from './errors';

export type ApiRole = 'admin' | 'sdr' | 'client';

export interface AuthConfig {
  adminKeys: string[];
  sdrKeys: string[];
  clientKeys: string[];
}

const ROLE_WEIGHT: Record<ApiRole, number> = {
  client: 1,
  sdr: 2,
  admin: 3
};

export function parseApiKeys(csv?: string): string[] {
  return (csv || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

export function resolveRoleFromApiKey(apiKey: string, config: AuthConfig): ApiRole | null {
  if (config.adminKeys.includes(apiKey)) return 'admin';
  if (config.sdrKeys.includes(apiKey)) return 'sdr';
  if (config.clientKeys.includes(apiKey)) return 'client';
  return null;
}

export function assertRole(
  headers: Record<string, any>,
  requiredRole: ApiRole,
  config: AuthConfig
): ApiRole {
  const raw = headers['x-api-key'];
  const apiKey = Array.isArray(raw) ? raw[0] : raw;

  if (!apiKey || typeof apiKey !== 'string') {
    throw new ValidationError('x-api-key é obrigatório');
  }

  const role = resolveRoleFromApiKey(apiKey, config);
  if (!role) {
    throw new ValidationError('x-api-key inválido');
  }

  if (ROLE_WEIGHT[role] < ROLE_WEIGHT[requiredRole]) {
    throw new ValidationError(`permissão insuficiente: requer role ${requiredRole}`);
  }

  return role;
}
