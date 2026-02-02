// src/services/chatwootService.ts

import { getChatClient } from '../infra/chatwoot/chatwoot.client';
import { logger } from '../shared/utils/logger';

export interface SyncMessagePayload {
  phone: string;
  name?: string;
  message: string;
  messageType?: 'incoming' | 'outgoing';
}

export class ChatwootService {
  private chatClient = getChatClient();

  /**
   * Sincronizar mensagem com Chatwoot
   */
  async syncMessage(payload: SyncMessagePayload): Promise<{
    success: boolean;
    conversationId?: number;
    messageId?: number;
    error?: string;
  }> {
    try {
      const { phone, name, message, messageType = 'incoming' } = payload;

      logger.debug('[ChatwootService] Sincronizando mensagem', { phone, messageType });

      // 1. Obter ou criar contato
      const contact = await this.chatClient.getOrCreateContact(phone, name);
      logger.debug('[ChatwootService] Contato obtido/criado', { contactId: contact.id, phone });

      // 2. Obter ou criar conversa
      const conversation = await this.chatClient.getOrCreateConversation(contact.id);
      logger.debug('[ChatwootService] Conversa obtida/criada', {
        conversationId: conversation.id,
        contactId: contact.id
      });

      // 3. Enviar mensagem
      const messageResponse = await this.chatClient.sendMessage(
        conversation.id,
        message,
        messageType
      );

      logger.info('[ChatwootService] Mensagem sincronizada com sucesso', {
        phone,
        conversationId: conversation.id,
        messageId: messageResponse.id
      });

      return {
        success: true,
        conversationId: conversation.id,
        messageId: messageResponse.id
      };
    } catch (error: any) {
      logger.error('[ChatwootService] Erro ao sincronizar mensagem:', {
        phone: payload.phone,
        error: error.message,
        status: error.response?.status
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Testar conexão com Chatwoot
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.chatClient.healthCheck();
    } catch (error: any) {
      logger.error('[ChatwootService] Erro ao testar conexão:', error.message);
      return false;
    }
  }
}

export const chatService = new ChatwootService();
