// src/infra/uazapi/uazapi.client.ts

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config/env';
import { logger } from '../../shared/utils/logger';
import { ExternalApiError } from '../../shared/utils/errors';

export interface UAZAPIMessagePayload {
  phone: string;
  message: string;
}

export interface UAZAPIResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface UAZAPIWebhookPayload {
  phone: string;
  name?: string;
  message: string;
  messageId?: string;
  timestamp?: string;
  type?: 'text' | 'image' | 'document';
}

export class UAZAPIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Base URL da API UAZAPI
    this.baseURL = config.UAZAPI_URL;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.UAZAPI_KEY}`
      }
    });

    // Interceptors
    this.client.interceptors.response.use(
      response => response,
      error => {
        logger.error('[UAZAPI] Error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url,
          baseURL: this.baseURL
        });
        throw error;
      }
    );
  }

  /**
   * Enviar mensagem de texto via WhatsApp
   */
  async sendMessage(payload: UAZAPIMessagePayload): Promise<UAZAPIResponse> {
    try {
      logger.debug('[UAZAPI] Enviando mensagem', { phone: payload.phone });

      const response = await this.client.post('/send-message', {
        phone: this.normalizePhone(payload.phone),
        message: payload.message
      });

      logger.info('[UAZAPI] Mensagem enviada com sucesso', {
        phone: payload.phone,
        messageId: response.data?.messageId
      });

      return {
        success: true,
        messageId: response.data?.messageId
      };
    } catch (error) {
      const err = error as any;
      throw new ExternalApiError(
        `Falha ao enviar mensagem para ${payload.phone}`,
        'UAZAPI',
        err
      );
    }
  }

  /**
   * Enviar imagem via WhatsApp
   */
  async sendImage(phone: string, imageUrl: string, caption?: string): Promise<UAZAPIResponse> {
    try {
      logger.debug('[UAZAPI] Enviando imagem', { phone, imageUrl });

      const response = await this.client.post('/send-image', {
        phone: this.normalizePhone(phone),
        image: imageUrl,
        caption: caption || ''
      });

      return {
        success: true,
        messageId: response.data?.messageId
      };
    } catch (error) {
      const err = error as any;
      throw new ExternalApiError(
        `Falha ao enviar imagem para ${phone}`,
        'UAZAPI',
        err
      );
    }
  }

  /**
   * Enviar documento via WhatsApp
   */
  async sendDocument(phone: string, documentUrl: string, filename?: string): Promise<UAZAPIResponse> {
    try {
      logger.debug('[UAZAPI] Enviando documento', { phone, documentUrl });

      const response = await this.client.post('/send-document', {
        phone: this.normalizePhone(phone),
        document: documentUrl,
        filename: filename || 'documento'
      });

      return {
        success: true,
        messageId: response.data?.messageId
      };
    } catch (error) {
      const err = error as any;
      throw new ExternalApiError(
        `Falha ao enviar documento para ${phone}`,
        'UAZAPI',
        err
      );
    }
  }

  /**
   * Verificar status de uma mensagem
   */
  async getMessageStatus(messageId: string): Promise<{ status: string; deliveredAt?: string }> {
    try {
      const response = await this.client.get(`/messages/${messageId}`);

      return {
        status: response.data?.status || 'unknown',
        deliveredAt: response.data?.deliveredAt
      };
    } catch (error) {
      const err = error as any;
      throw new ExternalApiError(
        `Falha ao obter status da mensagem ${messageId}`,
        'UAZAPI',
        err
      );
    }
  }

  /**
   * Health check da API UAZAPI
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/status', {
        timeout: 5000
      });
      
      return response.status === 200;
    } catch (error) {
      logger.warn('[UAZAPI] Health check falhou', { error });
      return false;
    }
  }

  /**
   * Normalizar número de telefone
   */
  private normalizePhone(phone: string): string {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Se não tem país (55 para Brasil), adiciona
    if (!cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }
    
    return cleaned;
  }
}

// Singleton instance
let uazapiClient: UAZAPIClient | null = null;

export function getUAZAPIClient(): UAZAPIClient {
  if (!uazapiClient) {
    uazapiClient = new UAZAPIClient();
  }
  return uazapiClient;
}
