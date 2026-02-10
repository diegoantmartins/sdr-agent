import { IncomingHttpHeaders } from 'http';
import { safeCompare } from '../../shared/utils/security';

export interface WebhookAuthOptions {
  expectedSecret?: string;
  headerName?: string;
}

/**
 * Valida o segredo do webhook, se configurado.
 * Quando não há segredo configurado, o webhook é aceito.
 */
export function isWebhookAuthorized(
  headers: IncomingHttpHeaders,
  options: WebhookAuthOptions
): boolean {
  const { expectedSecret, headerName = 'x-webhook-secret' } = options;

  if (!expectedSecret) {
    return true;
  }

  const rawHeader = headers[headerName] ?? headers[headerName.toLowerCase()];
  const providedSecret = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

  if (!providedSecret) {
    return false;
  }

  return safeCompare(providedSecret, expectedSecret);
}
