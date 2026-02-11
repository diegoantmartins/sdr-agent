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
import { isWebhookAuthorized } from './application/webhooks/webhook-auth';
codex/refactor-agent-for-improved-functionality-ujhmxn
import { integrationHubService } from './services/integrations/integration-hub.service';
import {
  IntegrationAction,
  IntegrationProvider,
  PROVIDER_CAPABILITIES
} from './domain/integrations/integration.types';
import { AppError, ValidationError } from './shared/utils/errors';
import { assertRole, parseApiKeys } from './shared/utils/auth';
import { enforceTenantRateLimit } from './shared/utils/rate-limit';
import { ConversationMetricsService } from './services/metrics/conversation-metrics.service';
import { commercialEngineService } from './services/commercial/commercial-engine.service';
 main

// Instâncias globais
let prisma: PrismaClient;
let app: FastifyInstance;
let intentClassifier: IntentClassifier;
let leadService: LeadService;
let uazapiClient: any;
let conversationMetricsService: ConversationMetricsService;

function parseAllowedOrigins(originsCsv?: string): string[] {
  if (!originsCsv) return [];
  return originsCsv
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function getTenantIdFromHeaders(headers: Record<string, any>): string {
  const tenantIdHeader = headers['x-tenant-id'];
  const tenantId = Array.isArray(tenantIdHeader) ? tenantIdHeader[0] : tenantIdHeader;
  if (!tenantId || typeof tenantId !== 'string') {
    throw new ValidationError('x-tenant-id é obrigatório');
  }
  return tenantId;
}

function getIntegrationApiKeys(): string[] {
  return (config.INTEGRATION_API_KEYS || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}


function getAuthConfig() {
  return {
    adminKeys: parseApiKeys(config.ADMIN_API_KEYS),
    sdrKeys: parseApiKeys(config.SDR_API_KEYS),
    clientKeys: parseApiKeys(config.CLIENT_API_KEYS)
  };
}
function assertIntegrationKey(headers: Record<string, any>): void {
  const allowedKeys = getIntegrationApiKeys();
  if (allowedKeys.length === 0) {
    throw new ValidationError('INTEGRATION_API_KEYS não configurado');
  }

  const raw = headers['x-integration-key'];
  const providedKey = Array.isArray(raw) ? raw[0] : raw;
  if (!providedKey || !allowedKeys.includes(String(providedKey))) {
    throw new ValidationError('x-integration-key inválido');
  }
}

async function auditEvent(
  tenantId: string,
  action: string,
  success: boolean,
  metadata: Record<string, any> = {},
  actor?: string
): Promise<void> {
  try {
    await prisma.governanceAudit.create({
      data: {
        tenantId,
        action,
        actor,
        success,
        metadata
      }
    });
  } catch (error) {
    logger.warn('[GovernanceAudit] falha ao registrar evento', { tenantId, action, error: String(error) });
  }
}

async function connectWithRetry(client: PrismaClient): Promise<void> {
  const maxAttempts = Math.max(1, config.DB_CONNECT_MAX_ATTEMPTS);
  const delayMs = Math.max(250, config.DB_CONNECT_RETRY_MS);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await client.$connect();
      logger.info(`✅ PostgreSQL conectado (tentativa ${attempt}/${maxAttempts})`);
      return;
    } catch (error) {
      logger.error(`❌ Falha ao conectar PostgreSQL (tentativa ${attempt}/${maxAttempts})`, error);
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

async function initializeApp(): Promise<FastifyInstance> {
  // ========== Database Setup ==========
  prisma = new PrismaClient();

  try {
    await connectWithRetry(prisma);
  } catch (error) {
    logger.error('❌ Erro ao conectar PostgreSQL:', error);
    process.exit(1);
  }

  // ========== Services Setup ==========
  intentClassifier = new IntentClassifier(config.OPENAI_API_KEY, config.OPENAI_MODEL);
  leadService = new LeadService(prisma);
  conversationMetricsService = new ConversationMetricsService(prisma);
  uazapiClient = getUAZAPIClient();

  // ========== Fastify Setup ==========
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL
    }
  });

  app.addHook('onRequest', async (request, _reply) => {
    const requestId = request.id || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    (request as any).requestContext = {
      requestId
    };
  });

  app.setErrorHandler((error, request, reply) => {
    const requestId = (request as any)?.requestContext?.requestId || request.id;
    const isAppError = error instanceof AppError;

    logger.error('[HTTP] Unhandled error', {
      requestId,
      method: request.method,
      url: request.url,
      statusCode: isAppError ? error.statusCode : 500,
      code: isAppError ? error.code : 'INTERNAL_SERVER_ERROR',
      message: error.message
    });

    return reply.code(isAppError ? error.statusCode : 500).send({
      error: isAppError ? error.code : 'INTERNAL_SERVER_ERROR',
      message: error.message,
      requestId
    });
  });

  // Middleware
  const allowedOrigins = parseAllowedOrigins(config.CORS_ALLOWED_ORIGINS);
  await app.register(fastifyCors, {
    origin: allowedOrigins.length > 0 ? allowedOrigins : config.NODE_ENV !== 'production',
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
codex/refactor-agent-for-improved-functionality-ujhmxn
      if (config.REQUIRE_WEBHOOK_SECRETS && !config.UAZAPI_WEBHOOK_SECRET) {
        throw new ValidationError('UAZAPI_WEBHOOK_SECRET é obrigatório quando REQUIRE_WEBHOOK_SECRETS=true');
      }

 main
      if (!isWebhookAuthorized(request.headers, { expectedSecret: config.UAZAPI_WEBHOOK_SECRET })) {
        logger.warn('[WEBHOOK:UAZAPI] Tentativa com segredo inválido');
        return reply.code(401).send({ error: 'unauthorized webhook' });
      }

 codex/refactor-agent-for-improved-functionality-ujhmxn
      const tenantId = getTenantIdFromHeaders(request.headers as any);
 main
      const { phone, name, message, messageId, timestamp } = request.body as any;

      if (!phone || !message) {
        return reply.code(400).send({ error: 'phone e message são obrigatórios' });
      }

      logger.info(`[WEBHOOK:UAZAPI] Mensagem recebida de ${phone}`);

      // 1. Criar ou buscar lead
      let lead = await leadService.getLead(tenantId, phone);

      if (!lead) {
        lead = await leadService.createLead({
          tenantId,
          phone,
          name: name || 'Lead sem nome',
          source: 'whatsapp'
        });
      }

      // 2. Salvar mensagem (tratar duplicatas de chatwootMessageId)
      let messageRecord;
      let isDuplicate = false;
      try {
        messageRecord = await prisma.message.create({
          data: {
            tenantId,
            leadId: lead.id,
            content: message,
            type: 'incoming',
            chatwootMessageId: messageId
          }
        });
      } catch (err: any) {
        // P2002 = Unique constraint failed
        if (err.code === 'P2002' && err.meta?.target?.includes('chatwootMessageId')) {
          logger.warn('[WEBHOOK:UAZAPI] Mensagem duplicada detectada, buscando registro existente');
          isDuplicate = true;
          messageRecord = await prisma.message.findFirst({ where: { chatwootMessageId: messageId } });
        } else {
          throw err;
        }
      }

      if (isDuplicate) {
        await auditEvent(tenantId, 'webhook_uazapi_duplicate', true, { phone, messageId });
        return reply.code(200).send({ success: true, messageId, duplicate: true });
      }

      // 2.1 Atualizar contadores e atividade do lead
      await leadService.registerIncomingMessage(tenantId, phone);
      await conversationMetricsService.registerMessage(lead.id, 'incoming');

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
      await leadService.updateLead(tenantId, phone, {
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
        await leadService.incrementScore(tenantId, phone, scoreChange);
      }

      // 7. Atualizar status se score for alto
      const updatedLead = await leadService.getLead(tenantId, phone);
      if (updatedLead && updatedLead.score > 80 && intentResult.intent === 'BUY_NOW') {
        await leadService.updateLead(tenantId, phone, { status: 'HOT' });
      }

      logger.info(`[WEBHOOK:UAZAPI] ✅ Mensagem processada - Intent: ${intentResult.intent}`);
      await auditEvent(tenantId, 'webhook_uazapi_processed', true, { phone, intent: intentResult.intent });
      return reply.code(200).send({ success: true, messageId });
    } catch (error) {
      logger.error('[WEBHOOK:UAZAPI] ❌ Erro:', error);
      return reply.code(500).send({ error: String(error) });
    }
  });

  // ========== WEBHOOK: Chatwoot (Message) ==========
  app.post('/webhooks/chatwoot/message-created', async (request, reply) => {
    try {
 codex/refactor-agent-for-improved-functionality-ujhmxn
      if (config.REQUIRE_WEBHOOK_SECRETS && !config.CHATWOOT_WEBHOOK_SECRET) {
        throw new ValidationError('CHATWOOT_WEBHOOK_SECRET é obrigatório quando REQUIRE_WEBHOOK_SECRETS=true');
      }

 main
      if (!isWebhookAuthorized(request.headers, { expectedSecret: config.CHATWOOT_WEBHOOK_SECRET })) {
        logger.warn('[WEBHOOK:CHATWOOT] Tentativa com segredo inválido');
        return reply.code(401).send({ error: 'unauthorized webhook' });
      }

 codex/refactor-agent-for-improved-functionality-ujhmxn
      const tenantId = getTenantIdFromHeaders(request.headers as any);
 main
      const payload = request.body as any;
      const { message, conversation, contact } = payload;

      const messageContent = message?.content || message?.text || payload?.content;
      const phone = contact?.phone_number || conversation?.meta?.sender?.phone_number;
      const name = contact?.name || conversation?.meta?.sender?.name || 'Lead sem nome';

      logger.info(`[WEBHOOK:CHATWOOT] Mensagem no Chatwoot`);

      if (phone && messageContent) {
        let lead = await leadService.getLead(tenantId, phone);
        if (!lead) {
          lead = await leadService.createLead({
            tenantId,
            phone,
            name,
            source: 'chatwoot'
          });
        }

        await prisma.message.create({
          data: {
            tenantId,
            leadId: lead.id,
            content: messageContent,
            type: message?.message_type === 1 ? 'outgoing' : 'incoming',
            chatwootMessageId: String(message?.id || payload?.id || '') || undefined
          }
        }).catch((err: any) => {
          if (!(err.code === 'P2002' && err.meta?.target?.includes('chatwootMessageId'))) {
            throw err;
          }
        });

        const isOutgoing = message?.message_type === 1;
        if (!isOutgoing) {
          await leadService.registerIncomingMessage(tenantId, phone);
        }
        await conversationMetricsService.registerMessage(lead.id, isOutgoing ? 'outgoing' : 'incoming');
      }

      await auditEvent(tenantId, 'webhook_chatwoot_processed', true, {
        hasPhone: Boolean(phone),
        messageId: message?.id || payload?.id
      });

      return reply.code(200).send({ success: true });
    } catch (error) {
      logger.error('[WEBHOOK:CHATWOOT] Erro:', error);
      return reply.code(500).send({ error: String(error) });
    }
  });

  // ========== API: Get Leads ==========
  app.get('/api/leads', async (request, reply) => {
    try {
      assertRole(request.headers as any, 'client', getAuthConfig());
      const tenantId = getTenantIdFromHeaders(request.headers as any);
      const leads = await prisma.activeLead.findMany({
        where: { tenantId },
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
      assertRole(request.headers as any, 'sdr', getAuthConfig());
      const tenantId = getTenantIdFromHeaders(request.headers as any);
      const body = request.body as Record<string, any>;
      const { phone, name, email, company, source, campaignId, metadata } = body;

      if (!phone) {
        return reply.code(400).send({ error: 'phone é obrigatório' });
      }

      const lead = await leadService.createLead({
        tenantId,
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
        assertRole(request.headers as any, 'client', getAuthConfig());
        const tenantId = getTenantIdFromHeaders(request.headers as any);
        const { phone } = request.params;
        const lead = await leadService.getLead(tenantId, phone);

        if (!lead) {
          return reply.code(404).send({ error: 'Lead not found' });
        }

        const messages = await prisma.message.findMany({
          where: { leadId: lead.id, tenantId },
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
      assertRole(request.headers as any, 'client', getAuthConfig());
      const tenantId = getTenantIdFromHeaders(request.headers as any);
      const hotLeads = await leadService.getHotLeads(tenantId);
      return reply.send({ leads: hotLeads });
    } catch (error) {
      logger.error('[API:HOT_LEADS] Erro:', error);
      return reply.code(500).send({ error: String(error) });
    }
  });

  if (config.ENABLE_TEST_ENDPOINTS || config.NODE_ENV !== 'production') {
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
          const tenantId = getTenantIdFromHeaders(request.headers as any);
          const webhookResponse = await fetch('http://localhost:3000/webhooks/uazapi/message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': tenantId
            },
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
  }

  // ========== API: Integration Hub ==========
  app.get('/api/integrations/providers', async (_request, reply) => {
    return reply.send({ providers: PROVIDER_CAPABILITIES });
  });

  app.post<{
    Params: { provider: IntegrationProvider };
    Body: { action: IntegrationAction; payload: Record<string, any> };
  }>('/api/integrations/:provider/actions', async (request, reply) => {
    try {
      assertRole(request.headers as any, 'sdr', getAuthConfig());
      assertIntegrationKey(request.headers as any);
      const tenantId = getTenantIdFromHeaders(request.headers as any);
      enforceTenantRateLimit(tenantId, 'integration_execute', config.INTEGRATION_RATE_LIMIT_PER_MINUTE, 60_000);
      const { provider } = request.params;
      const { action, payload } = request.body || ({} as any);

      if (!action) {
        return reply.code(400).send({ error: 'action é obrigatório' });
      }

      if (!Object.keys(PROVIDER_CAPABILITIES).includes(provider)) {
        return reply.code(400).send({ error: `provider inválido: ${provider}` });
      }

      const result = await integrationHubService.execute({
        provider,
        action,
        payload: payload || {}
      });

      await auditEvent(tenantId, 'integration_execute', result.success, {
        provider,
        action
      });

      if (!result.success) {
        return reply.code(502).send(result);
      }

      return reply.code(200).send(result);
    } catch (error) {
      logger.error('[API:INTEGRATIONS] Erro:', error);
      return reply.code(500).send({ error: String(error) });
    }
  });

  // ========== API: Commercial Engine ==========
  app.get('/api/commercial/templates', async (request, reply) => {
    assertRole(request.headers as any, 'client', getAuthConfig());
    return reply.send({ templates: commercialEngineService.getTemplates() });
  });

  app.get<{ Params: { niche: string } }>('/api/commercial/templates/:niche', async (request, reply) => {
    try {
      assertRole(request.headers as any, 'client', getAuthConfig());
      const template = commercialEngineService.getTemplateByNiche(request.params.niche);
      return reply.send({ template });
    } catch (error) {
      logger.error('[API:COMMERCIAL:TEMPLATE] Erro:', error);
      return reply.code(400).send({ error: String(error) });
    }
  });

  app.post<{
    Body: { niche: string; leadStage?: string; intent?: 'BUY_NOW' | 'SUPPORT' | 'TRIAGE'; score?: number }
  }>('/api/commercial/next-action', async (request, reply) => {
    try {
      assertRole(request.headers as any, 'sdr', getAuthConfig());
      const tenantId = getTenantIdFromHeaders(request.headers as any);
      const { niche, leadStage, intent, score } = request.body || ({} as any);
      if (!niche) {
        return reply.code(400).send({ error: 'niche é obrigatório' });
      }

      const recommendation = commercialEngineService.getNextBestAction({
        niche,
        leadStage,
        intent,
        score
      });

      await auditEvent(tenantId, 'commercial_next_action', true, {
        niche,
        leadStage,
        intent,
        score: score ?? null
      });

      return reply.send({ recommendation });
    } catch (error) {
      logger.error('[API:COMMERCIAL:NEXT_ACTION] Erro:', error);
      return reply.code(400).send({ error: String(error) });
    }
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
