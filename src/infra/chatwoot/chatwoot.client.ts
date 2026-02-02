// src/infra/chatwoot/chatwoot.client.ts

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config/env';
import { logger } from '../../shared/utils/logger';
import { ExternalApiError } from '../../shared/utils/errors';

export interface ChatwootConversation {
  id: number;
  contact_id: number;
  contact?: {
    id: number;
    name: string;
    phone_number: string;
  };
}

export interface ChatwootContact {
  id: number;
  name: string;
  email?: string;
  phone_number: string;
}

export interface ChatwootMessage {
  id: number;
  content: string;
  message_type: number;
  created_at: string;
}

export class ChatwootClient {
  private client: AxiosInstance;
  private baseURL: string;
  private accountId: string;

  constructor() {
    this.baseURL = config.CHATWOOT_URL;
    this.accountId = config.CHATWOOT_ACCOUNT_ID;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': config.CHATWOOT_API_TOKEN
      }
    });

    // Interceptors
    this.client.interceptors.response.use(
      response => response,
      error => {
        logger.error('[CHATWOOT] Error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });
        throw error;
      }
    );
  }

  /**
   * Buscar ou criar contato no Chatwoot
   */
  async getOrCreateContact(phone: string, name?: string): Promise<ChatwootContact> {
    try {
      // 1. Tentar buscar contato existente
      const listResponse = await this.client.get(`/api/v1/accounts/${this.accountId}/contacts`, {
        params: {
          phone_number: phone
        }
      });

      if (listResponse.data?.payload?.length > 0) {
        logger.debug('[CHATWOOT] Contato encontrado', { phone });
        return listResponse.data.payload[0];
      }

      // 2. Se não encontrar, criar novo contato
      logger.debug('[CHATWOOT] Criando novo contato', { phone, name });
      const createResponse = await this.client.post(
        `/api/v1/accounts/${this.accountId}/contacts`,
        {
          name: name || `Lead ${phone}`,
          phone_number: phone,
          identifier: phone
        }
      );

      return createResponse.data?.contact || createResponse.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 422) {
        // Se der erro ao buscar, tenta criar direto
        try {
          const createResponse = await this.client.post(
            `/api/v1/accounts/${this.accountId}/contacts`,
            {
              name: name || `Lead ${phone}`,
              phone_number: phone,
              identifier: phone
            }
          );
          return createResponse.data?.contact || createResponse.data;
        } catch (createError: any) {
          logger.error('[CHATWOOT] Erro ao criar contato:', createError.message);
          throw createError;
        }
      }
      throw error;
    }
  }

  /**
   * Obter ou criar conversa
   */
  async getOrCreateConversation(
    contactId: number,
    inboxId?: number
  ): Promise<ChatwootConversation> {
    try {
      // Buscar conversas existentes do contato
      const listResponse = await this.client.get(
        `/api/v1/accounts/${this.accountId}/conversations`,
        {
          params: {
            status: 'open',
            filter: 'inbox'
          }
        }
      );

      // Filtrar conversa do contato específico
      const conversation = listResponse.data?.payload?.find(
        (conv: ChatwootConversation) => conv.contact_id === contactId
      );

      if (conversation) {
        logger.debug('[CHATWOOT] Conversa encontrada', { contactId, conversationId: conversation.id });
        return conversation;
      }

      // Se não encontrar, criar nova conversa
      logger.debug('[CHATWOOT] Criando nova conversa', { contactId });
      
      // Usar primeiro inbox disponível se não especificado
      if (!inboxId) {
        const inboxResponse = await this.client.get(
          `/api/v1/accounts/${this.accountId}/inboxes`
        );
        inboxId = inboxResponse.data?.payload?.[0]?.id || 1;
      }

      const createResponse = await this.client.post(
        `/api/v1/accounts/${this.accountId}/conversations`,
        {
          source_id: String(contactId),
          inbox_id: inboxId,
          contact_id: contactId
        }
      );

      return createResponse.data;
    } catch (error: any) {
      logger.error('[CHATWOOT] Erro ao obter/criar conversa:', error.message);
      throw error;
    }
  }

  /**
   * Enviar mensagem na conversa
   */
  async sendMessage(
    conversationId: number,
    content: string,
    messageType: 'incoming' | 'outgoing' = 'incoming'
  ): Promise<ChatwootMessage> {
    try {
      logger.debug('[CHATWOOT] Enviando mensagem', {
        conversationId,
        contentLength: content.length
      });

      const response = await this.client.post(
        `/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`,
        {
          content,
          message_type: messageType === 'incoming' ? 0 : 1,
          private: false
        }
      );

      logger.info('[CHATWOOT] Mensagem enviada com sucesso', {
        conversationId,
        messageId: response.data?.id
      });

      return response.data;
    } catch (error: any) {
      logger.error('[CHATWOOT] Erro ao enviar mensagem:', error.message);
      throw error;
    }
  }

  /**
   * Health check do Chatwoot
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get(`/api/v1/accounts/${this.accountId}`, {
        timeout: 5000
      });

      const isHealthy = response.status === 200;
      
      if (isHealthy) {
        logger.debug('[CHATWOOT] Health check OK');
      }

      return isHealthy;
    } catch (error: any) {
      logger.warn('[CHATWOOT] Health check failed:', {
        status: error.response?.status,
        message: error.message
      });
      return false;
    }
  }
}

// Singleton instance
let chatClient: ChatwootClient | null = null;

export function getChatClient(): ChatwootClient {
  if (!chatClient) {
    chatClient = new ChatwootClient();
  }
  return chatClient;
}

export default ChatwootClient;
