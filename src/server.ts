// src/server.ts - SERVIDOR PRINCIPAL FASTIFY

import Fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { PrismaClient } from '@prisma/client';
import { config } from './config/env';
import { logger } from './shared/utils/logger';
import { IntentClassifier } from './domain/intent/intent.classifier';
import { LeadService } from './domain/lead/lead.service';
import { setupAgenda } from './application/cron/agenda-setup';
import { getUAZAPIClient } from './infra/uazapi/uazapi.client';
import { chatService } from './services/chatwootService';

// Instâncias globais
let prisma: PrismaClient;
let app: FastifyInstance;
let intentClassifier: IntentClassifier;
let leadService: LeadService;
let uazapiClient: any;

async function initializeApp(): Promise<FastifyInstance> {
  // ========== Database Setup ==========
  prisma = new PrismaClient();

  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL conectado');
  } catch (error) {
    logger.error('❌ Erro ao conectar PostgreSQL:', error);
    process.exit(1);
  }

  // ========== Services Setup ==========
  intentClassifier = new IntentClassifier(config.OPENAI_API_KEY, config.OPENAI_MODEL);
  leadService = new LeadService(prisma);
  uazapiClient = getUAZAPIClient();

  // ========== Fastify Setup ==========
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL
    }
  });

  // Middleware
  await app.register(fastifyCors, {
    origin: true,
    credentials: true
  });

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false
  });

  // ========== Health Check ==========
  app.get('/health', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.code(200).send({ status: 'ok', timestamp: new Date() });
    } catch (error) {
      return reply.code(503).send({ status: 'error', error: String(error) });
    }
  });

  // ========== WEBHOOK: UAZAPI (WhatsApp Incoming) ==========
  app.post('/webhooks/uazapi/message', async (request, reply) => {
    try {
      const { phone, name, message, messageId, timestamp } = request.body as any;

      if (!phone || !message) {
        return reply.code(400).send({ error: 'phone e message são obrigatórios' });
      }

      logger.info(`[WEBHOOK:UAZAPI] Mensagem recebida de ${phone}`);

      // 1. Criar ou buscar lead
      let lead = await leadService.getLead(phone);

      if (!lead) {
        lead = await leadService.createLead({
          phone,
          name: name || 'Lead sem nome',
          source: 'whatsapp'
        });
      }

      // 2. Salvar mensagem (tratar duplicatas de chatwootMessageId)
      let messageRecord;
      let isNewMessage = false;
      try {
        messageRecord = await prisma.message.create({
          data: {
            leadId: lead.id,
            content: message,
            type: 'incoming',
            chatwootMessageId: messageId
          }
        });
        isNewMessage = true;
      } catch (err: any) {
        // P2002 = Unique constraint failed
        if (err.code === 'P2002' && err.meta?.target?.includes('chatwootMessageId')) {
          logger.warn('[WEBHOOK:UAZAPI] Mensagem duplicada detectada, buscando registro existente');
          messageRecord = await prisma.message.findFirst({ where: { chatwootMessageId: messageId } });
        } else {
          throw err;
        }
      }

      if (isNewMessage) {
        await leadService.incrementMessageCount(phone);
      }

      // 3. Sincronizar com Chatwoot (async, não bloqueia resposta)
      chatService.syncMessage({
        phone,
        name: lead.name,
        message,
        messageType: 'incoming'
      }).catch(error => {
        logger.warn('[WEBHOOK:UAZAPI] Erro ao sincronizar com Chatwoot:', error);
      });

      // 4. Classificar intenção
      const intentResult = await intentClassifier.classify(message);

      // 5. Atualizar lead com intent
      await leadService.updateLead(phone, {
        intentClassified: intentResult.intent,
        conversionStage: 'consideration'
      });

      // 6. Aplicar score baseado em intenção
      let scoreChange = 0;
      if (intentResult.intent === 'BUY_NOW') {
        scoreChange = 30;
      } else if (intentResult.intent === 'SUPPORT') {
        scoreChange = 10;
      }

      if (scoreChange > 0) {
        await leadService.incrementScore(phone, scoreChange);
      }

      // 7. Atualizar status se score for alto
      const updatedLead = await leadService.getLead(phone);
      if (updatedLead && updatedLead.score > 80 && intentResult.intent === 'BUY_NOW') {
        await leadService.updateLead(phone, { status: 'HOT' });
      }

      logger.info(`[WEBHOOK:UAZAPI] ✅ Mensagem processada - Intent: ${intentResult.intent}`);
      return reply.code(200).send({ success: true, messageId });
    } catch (error) {
      logger.error('[WEBHOOK:UAZAPI] ❌ Erro:', error);
      return reply.code(500).send({ error: String(error) });
    }
  });

  // ========== WEBHOOK: Chatwoot (Message) ==========
  app.post('/webhooks/chatwoot/message-created', async (request, reply) => {
    try {
      const payload = request.body as any;
      const { message, conversation } = payload;

      logger.info(`[WEBHOOK:CHATWOOT] Mensagem no Chatwoot`);

      return reply.code(200).send({ success: true });
    } catch (error) {
      logger.error('[WEBHOOK:CHATWOOT] Erro:', error);
      return reply.code(500).send({ error: String(error) });
    }
  });

  // ========== API: Get Leads ==========
  app.get('/api/leads', async (request, reply) => {
    try {
      const leads = await prisma.activeLead.findMany({
        take: 50,
        orderBy: { score: 'desc' }
      });

      return reply.send({ leads });
    } catch (error) {
      logger.error('[API:GET_LEADS] Erro:', error);
      return reply.code(500).send({ error: String(error) });
    }
  });

  // ========== API: Create Lead ==========
  app.post('/api/leads', async (request, reply) => {
    try {
      const body = request.body as Record<string, any>;
      const { phone, name, email, company, source, campaignId, metadata } = body;

      if (!phone) {
        return reply.code(400).send({ error: 'phone é obrigatório' });
      }

      const lead = await leadService.createLead({
        phone,
        name: name || 'Lead sem nome',
        email,
        company,
        source: source || 'api',
        campaignId,
        metadata
      });

      logger.info(`[API:CREATE_LEAD] Lead criado: ${phone}`);
      return reply.code(201).send(lead);
    } catch (error) {
      logger.error('[API:CREATE_LEAD] Erro:', error);
      return reply.code(500).send({ error: String(error) });
    }
  });

  // ========== API: Get Lead Details ==========
  app.get<{ Params: { phone: string } }>(
    '/api/leads/:phone',
    async (request, reply) => {
      try {
        const { phone } = request.params;
        const lead = await leadService.getLead(phone);

        if (!lead) {
          return reply.code(404).send({ error: 'Lead not found' });
        }

        const messages = await prisma.message.findMany({
          where: { leadId: lead.id },
          orderBy: { createdAt: 'desc' }
        });

        return reply.send({ lead, messages });
      } catch (error) {
        logger.error('[API:LEAD_DETAILS] Erro:', error);
        return reply.code(500).send({ error: String(error) });
      }
    }
  );

  // ========== API: Hot Leads ==========
  app.get('/api/leads/hot', async (request, reply) => {
    try {
      const hotLeads = await leadService.getHotLeads();
      return reply.send({ leads: hotLeads });
    } catch (error) {
      logger.error('[API:HOT_LEADS] Erro:', error);
      return reply.code(500).send({ error: String(error) });
    }
  });

  // ========== TEST: UAZAPI Connection ==========
  app.get('/test/uazapi', async (request, reply) => {
    try {
      const isHealthy = await uazapiClient.healthCheck();
      return reply.send({
        status: isHealthy ? 'connected' : 'unhealthy',
        message: isHealthy ? 'UAZAPI está funcionando' : 'UAZAPI não está respondendo'
      });
    } catch (error) {
      logger.error('[TEST:UAZAPI] Erro:', error);
      return reply.code(503).send({
        status: 'error',
        message: 'UAZAPI não está acessível',
        error: String(error)
      });
    }
  });

  // ========== TEST: Send Test Message ==========
  app.post<{ Body: { phone: string; message: string } }>(
    '/test/send-message',
    async (request, reply) => {
      try {
        const { phone, message } = request.body;

        if (!phone || !message) {
          return reply.code(400).send({
            error: 'phone e message são obrigatórios'
          });
        }

        logger.info('[TEST:SEND_MESSAGE] Simulando webhook do UAZAPI', { phone, message });

        // Simular webhook do UAZAPI
        try {
          const webhookResponse = await fetch('http://localhost:3000/webhooks/uazapi/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone,
              name: 'Teste',
              message,
              messageId: `test-${Date.now()}`,
              timestamp: new Date().toISOString()
            })
          });

          const webhookData = await webhookResponse.json();

          return reply.code(webhookResponse.status).send({
            success: webhookResponse.ok,
            webhookResponse: webhookData,
            message: 'Mensagem processada e sincronizada com Chatwoot'
          });
        } catch (error) {
          logger.error('[TEST:SEND_MESSAGE] Erro ao simular webhook:', error);
          throw error;
        }
      } catch (error) {
        logger.error('[TEST:SEND_MESSAGE] Erro:', error);
        return reply.code(503).send({
          success: false,
          error: String(error)
        });
      }
    }
  );

  // ========== TEST: Database Connection ==========
  app.get('/test/database', async (request, reply) => {
    try {
      const result = await prisma.$queryRaw`SELECT NOW()`;
      const leadCount = await prisma.activeLead.count();

      return reply.send({
        status: 'connected',
        timestamp: result,
        leadsCount: leadCount,
        message: 'PostgreSQL está conectado e funcionando'
      });
    } catch (error) {
      logger.error('[TEST:DATABASE] Erro:', error);
      return reply.code(503).send({
        status: 'error',
        message: 'Banco de dados não está acessível',
        error: String(error)
      });
    }
  });

  // ========== TEST: Chatwoot Connection ==========
  app.get('/test/chatwoot', async (request, reply) => {
    try {
      const axios = require('axios');
      const chatClient = axios.create({
        baseURL: config.CHATWOOT_URL,
        timeout: 5000,
        headers: {
          'api_access_token': config.CHATWOOT_API_TOKEN
        }
      });

      const response = await chatClient.get(`/api/v1/accounts/${config.CHATWOOT_ACCOUNT_ID}`);

      return reply.send({
        status: 'connected',
        accountId: response.data?.id,
        accountName: response.data?.name,
        message: 'Chatwoot está acessível'
      });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Erro desconhecido';
      return reply.code(503).send({
        status: 'error',
        message: 'Chatwoot não está acessível',
        error: errorMsg
      });
    }
  });

  // ========== TEST: All Services ==========
  app.get('/test/all', async (request, reply) => {
    const results: any = {};

    // Database
    try {
      await prisma.$queryRaw`SELECT 1`;
      results.database = { status: 'ok' };
    } catch (e) {
      results.database = { status: 'error', error: String(e) };
    }

    // UAZAPI
    try {
      const healthy = await uazapiClient.healthCheck();
      results.uazapi = { status: healthy ? 'ok' : 'unhealthy' };
    } catch (e) {
      results.uazapi = { status: 'error', error: String(e) };
    }

    // Chatwoot
    try {
      const axios = require('axios');
      const chatClient = axios.create({
        baseURL: config.CHATWOOT_URL,
        timeout: 5000,
        headers: { 'api_access_token': config.CHATWOOT_API_TOKEN }
      });
      await chatClient.get(`/api/v1/accounts/${config.CHATWOOT_ACCOUNT_ID}`);
      results.chatwoot = { status: 'ok' };
    } catch (e) {
      results.chatwoot = { status: 'error', error: String(e) };
    }

    return reply.send(results);
  });

  return app;
}

async function startServer() {
  try {
    app = await initializeApp();

    // ========== Setup Cron Jobs ==========
    try {
      await setupAgenda(config.MONGODB_URL, prisma);
    } catch (error) {
      logger.error('Erro ao inicializar Agenda:', error);
    }

    // ========== Start Server ==========
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    logger.info(`🚀 Servidor rodando em http://localhost:${config.PORT}`);
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// ========== Graceful Shutdown ==========
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido, encerrando...');
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT recebido, encerrando...');
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});

// ========== Start ==========
startServer().catch(error => {
  logger.error('Erro fatal:', error);
  process.exit(1);
});
