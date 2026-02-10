import axios from 'axios';
import { URL } from 'url';
import { config } from '../../config/env';
import {
  IntegrationAction,
  IntegrationProvider,
  IntegrationRequest,
  IntegrationResult,
  PROVIDER_CAPABILITIES
} from '../../domain/integrations/integration.types';
import { ExternalApiError, ValidationError } from '../../shared/utils/errors';
import { logger } from '../../shared/utils/logger';

export class IntegrationHubService {
  private getAllowedHosts(): string[] {
    return (config.INTEGRATION_ALLOWED_HOSTS || '')
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(Boolean);
  }

  private assertAllowedUrl(targetUrl: string): void {
    const allowedHosts = this.getAllowedHosts();
    if (allowedHosts.length === 0) {
      throw new ValidationError('INTEGRATION_ALLOWED_HOSTS não configurado para generic_http');
    }

    const parsed = new URL(targetUrl);
    if (!allowedHosts.includes(parsed.hostname.toLowerCase())) {
      throw new ValidationError(`Host não permitido para generic_http: ${parsed.hostname}`);
    }
  }

  private assertAction(provider: IntegrationProvider, action: IntegrationAction): void {
    if (!PROVIDER_CAPABILITIES[provider]?.includes(action)) {
      throw new ValidationError(`Ação ${action} não suportada para provider ${provider}`);
    }
  }

  async execute(request: IntegrationRequest): Promise<IntegrationResult> {
    const { provider, action, payload } = request;
    this.assertAction(provider, action);

    try {
      switch (provider) {
        case 'calcom':
          return await this.handleCalcom(action, payload);
        case 'google_calendar':
          return await this.handleGoogleCalendar(action, payload);
        case 'google_sheets':
          return await this.handleGoogleSheets(action, payload);
        case 'rd_station':
          return await this.handleRdStation(action, payload);
        case 'instagram':
        case 'facebook':
        case 'meta_api':
          return await this.handleMeta(provider, action, payload);
        case 'generic_http':
          return await this.handleGenericHttp(action, payload);
        default:
          throw new ValidationError(`Provider não suportado: ${provider}`);
      }
    } catch (error: any) {
      logger.error('[IntegrationHub] Falha de integração', { provider, action, error: error.message });
      return {
        success: false,
        provider,
        action,
        error: error.message
      };
    }
  }

  private async handleCalcom(action: IntegrationAction, payload: Record<string, any>): Promise<IntegrationResult> {
    if (!config.CALCOM_API_KEY || !config.CALCOM_API_URL) {
      throw new ValidationError('CALCOM_API_KEY/CALCOM_API_URL não configurados');
    }

    if (action === 'create_meeting') {
      const response = await axios.post(
        `${config.CALCOM_API_URL}/bookings`,
        payload,
        { headers: { Authorization: `Bearer ${config.CALCOM_API_KEY}` }, timeout: 15000 }
      );

      return { success: true, provider: 'calcom', action, data: response.data };
    }

    return this.handleGenericAuthorizedRequest('calcom', action, payload, config.CALCOM_API_URL, config.CALCOM_API_KEY);
  }

  private async handleGoogleCalendar(action: IntegrationAction, payload: Record<string, any>): Promise<IntegrationResult> {
    if (!config.GOOGLE_CALENDAR_API_URL || !config.GOOGLE_CALENDAR_TOKEN) {
      throw new ValidationError('GOOGLE_CALENDAR_API_URL/GOOGLE_CALENDAR_TOKEN não configurados');
    }

    if (action === 'create_calendar_event') {
      const response = await axios.post(
        `${config.GOOGLE_CALENDAR_API_URL}/events`,
        payload,
        { headers: { Authorization: `Bearer ${config.GOOGLE_CALENDAR_TOKEN}` }, timeout: 15000 }
      );
      return { success: true, provider: 'google_calendar', action, data: response.data };
    }

    return this.handleGenericAuthorizedRequest('google_calendar', action, payload, config.GOOGLE_CALENDAR_API_URL, config.GOOGLE_CALENDAR_TOKEN);
  }

  private async handleGoogleSheets(action: IntegrationAction, payload: Record<string, any>): Promise<IntegrationResult> {
    if (!config.GOOGLE_SHEETS_API_URL || !config.GOOGLE_SHEETS_TOKEN) {
      throw new ValidationError('GOOGLE_SHEETS_API_URL/GOOGLE_SHEETS_TOKEN não configurados');
    }

    if (action === 'append_sheet_row') {
      const response = await axios.post(
        `${config.GOOGLE_SHEETS_API_URL}/rows:append`,
        payload,
        { headers: { Authorization: `Bearer ${config.GOOGLE_SHEETS_TOKEN}` }, timeout: 15000 }
      );
      return { success: true, provider: 'google_sheets', action, data: response.data };
    }

    return this.handleGenericAuthorizedRequest('google_sheets', action, payload, config.GOOGLE_SHEETS_API_URL, config.GOOGLE_SHEETS_TOKEN);
  }

  private async handleRdStation(action: IntegrationAction, payload: Record<string, any>): Promise<IntegrationResult> {
    if (!config.RD_STATION_API_URL || !config.RD_STATION_TOKEN) {
      throw new ValidationError('RD_STATION_API_URL/RD_STATION_TOKEN não configurados');
    }

    const endpoint = action === 'upsert_lead' ? '/platform/contacts' : '/custom';
    const response = await axios.post(`${config.RD_STATION_API_URL}${endpoint}`, payload, {
      headers: { Authorization: `Bearer ${config.RD_STATION_TOKEN}` },
      timeout: 15000
    });

    return { success: true, provider: 'rd_station', action, data: response.data };
  }

  private async handleMeta(provider: IntegrationProvider, action: IntegrationAction, payload: Record<string, any>): Promise<IntegrationResult> {
    if (!config.META_API_URL || !config.META_API_TOKEN) {
      throw new ValidationError('META_API_URL/META_API_TOKEN não configurados');
    }

    const endpoint = action === 'upsert_lead' ? '/leads' : '/messages';
    const response = await axios.post(`${config.META_API_URL}${endpoint}`, {
      channel: provider,
      ...payload
    }, {
      headers: { Authorization: `Bearer ${config.META_API_TOKEN}` },
      timeout: 15000
    });

    return { success: true, provider, action, data: response.data };
  }

  private async handleGenericHttp(action: IntegrationAction, payload: Record<string, any>): Promise<IntegrationResult> {
    if (!payload?.url || !payload?.method) {
      throw new ValidationError('generic_http requer payload.url e payload.method');
    }

    this.assertAllowedUrl(payload.url);

    const response = await axios.request({
      url: payload.url,
      method: payload.method,
      headers: payload.headers,
      data: payload.body,
      timeout: payload.timeout ?? 15000
    });

    return {
      success: true,
      provider: 'generic_http',
      action,
      data: response.data
    };
  }

  private async handleGenericAuthorizedRequest(
    provider: IntegrationProvider,
    action: IntegrationAction,
    payload: Record<string, any>,
    baseUrl: string,
    token: string
  ): Promise<IntegrationResult> {
    if (!payload?.path || !payload?.method) {
      throw new ValidationError('custom_request requer payload.path e payload.method');
    }

    try {
      const response = await axios.request({
        baseURL: baseUrl,
        url: payload.path,
        method: payload.method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(payload.headers || {})
        },
        data: payload.body,
        timeout: payload.timeout ?? 15000
      });

      return { success: true, provider, action, data: response.data };
    } catch (error: any) {
      throw new ExternalApiError(
        `Falha na integração ${provider}`,
        provider,
        error
      );
    }
  }
}

export const integrationHubService = new IntegrationHubService();
