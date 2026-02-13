export type IntegrationProvider =
  | 'calcom'
  | 'google_calendar'
  | 'google_sheets'
  | 'instagram'
  | 'facebook'
  | 'meta_api'
  | 'rd_station'
  | 'generic_http';

export type IntegrationAction =
  | 'create_meeting'
  | 'create_calendar_event'
  | 'append_sheet_row'
  | 'upsert_lead'
  | 'send_message'
  | 'custom_request';

export interface IntegrationRequest {
  provider: IntegrationProvider;
  action: IntegrationAction;
  payload: Record<string, any>;
}

export interface IntegrationResult {
  success: boolean;
  provider: IntegrationProvider;
  action: IntegrationAction;
  data?: any;
  error?: string;
}

export const PROVIDER_CAPABILITIES: Record<IntegrationProvider, IntegrationAction[]> = {
  calcom: ['create_meeting', 'custom_request'],
  google_calendar: ['create_calendar_event', 'custom_request'],
  google_sheets: ['append_sheet_row', 'custom_request'],
  instagram: ['send_message', 'custom_request'],
  facebook: ['send_message', 'custom_request'],
  meta_api: ['send_message', 'upsert_lead', 'custom_request'],
  rd_station: ['upsert_lead', 'custom_request'],
  generic_http: ['custom_request']
};
