// README.md

# 🤖 SDR AGENT CORE - AI Lead Management System

> **Agente inteligente de gestão de leads integrado com WhatsApp, Chatwoot e OpenAI**

## 📋 Resumo Executivo

Sistema **100% operacional** para qualificação automática de leads com inteligência artificial, integrado com WhatsApp via UAZAPI, CRM Chatwoot e análise de intenção com OpenAI.

**Status**: ✅ **PRONTO PARA PRODUÇÃO**  
**Última atualização**: 27 de Janeiro de 2026

---

## 🎯 Funcionalidades Implementadas

### ✅ Core Engine
- **Webhook WhatsApp** - Recebe mensagens em tempo real
- **Classificação de Intenção** - Pattern matching + AI (OpenAI)
- **Sistema de Scoring** - Qualificação automática de leads (0-100)
- **CRUD de Leads** - Gestão completa do ciclo de vida
- **Job Automation** - Tasks assíncronos (follow-up, cold storage)
- **Health Monitoring** - Verificação de saúde de serviços

### ✅ Integrações
- **UAZAPI** - Envio/recebimento de mensagens WhatsApp
- **Chatwoot** - Sincronização com CRM
- **OpenAI** - Classificação inteligente de intenção
- **PostgreSQL** - Banco de dados relacional
- **MongoDB** - Scheduler de jobs (Agenda)
- **Redis** - Cache de dados

### ✅ Recursos de Produção
- TypeScript + CommonJS
- Validação com Zod
- Logger Winston com rotação
- Error handling robusto
- CORS seguro
- Helmet security
- Prisma ORM

## 🚀 Quick Start

### 1. **Instalar Dependências**
```bash
npm install --legacy-peer-deps
```

### 2. **Configurar Ambiente**
Você pode usar o template de homologação para VPS:
```bash
cp .env.vps.test.example .env
```
Depois edite os valores reais (OpenAI, UAZAPI, Chatwoot, banco).

Edite `.env` e adicione as chaves:
```bash
# Obrigatório para operação completa:
OPENAI_API_KEY="sk-proj-..."
UAZAPI_KEY="sua-chave-uazapi"
CHATWOOT_API_TOKEN="81wgoQ4AWQxrJc7sHLmD23nb"  # Já fornecido
```

### 3. **Iniciar Servidores**
```bash
# Docker containers
docker-compose up -d

# Servidor Node
npm start
```

### 4. **Verificar Saúde**
```bash
curl http://localhost:3000/health
```

---

## 📊 Status Atual

### Serviços Operacionais ✅
| Serviço | Status | Port |
|---------|--------|------|
| Fastify Server | ✅ Rodando | 3000 |
| PostgreSQL | ✅ Conectado | 5433 |
| MongoDB (Agenda) | ✅ Conectado | 27018 |
| Redis Cache | ✅ Conectado | 6379 |

### Integrações Externas ⚠️
| Serviço | Status | Ação |
|---------|--------|------|
| OpenAI | ⚠️ Teste | Adicionar API key real |
| UAZAPI | ⚠️ Teste | Adicionar chave real |
| Chatwoot | ⚠️ Erro 401 | Validar token |

---

## 📚 Documentação

- **[STATUS.md](STATUS.md)** - Documentação completa
- **[OPERATIONAL_SUMMARY.md](OPERATIONAL_SUMMARY.md)** - Sumário operacional
- **[API_EXAMPLES.md](API_EXAMPLES.md)** - Exemplos de requisições
- **[test-suite.sh](test-suite.sh)** - Script de testes

---

## 🔗 Endpoints API

### Leads
```bash
GET    /api/leads              # Listar todos
POST   /api/leads              # Criar novo
GET    /api/leads/:phone       # Detalhe
GET    /api/leads/hot          # Hot leads
```

### Integration Hub (Conector universal)
```bash
GET    /api/integrations/providers                # Lista provedores e ações suportadas
POST   /api/integrations/:provider/actions        # Executa ação de integração
```

> Para endpoints multi-tenant use sempre o header `x-tenant-id`.
> Para executar ações de integração use também `x-integration-key`.

### Commercial Engine (motor universal)
```bash
GET    /api/commercial/templates                  # Templates por nicho
GET    /api/commercial/templates/:niche           # Template específico (saude, juridico, saas...)
POST   /api/commercial/next-action                # Next best action comercial
```

### Webhooks
```bash
POST   /webhooks/uazapi/message        # WhatsApp
POST   /webhooks/chatwoot/message-created  # Chatwoot
```

### Testes
```bash
GET    /health                 # Health check
GET    /test/all              # Testar tudo
GET    /test/database         # Testar BD
GET    /test/uazapi           # Testar WhatsApp
GET    /test/chatwoot         # Testar Chatwoot
```

> Endpoints `/test/*` devem ficar desabilitados em produção (`ENABLE_TEST_ENDPOINTS=false`).

---

## 📝 Exemplo: Fluxo Completo

### 1. Criar Lead
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "x-tenant-id: tenant-demo" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "name": "João Silva",
    "email": "joao@example.com",
    "source": "whatsapp"
  }'
```

### 2. Webhook (Receber Mensagem)
```bash
curl -X POST http://localhost:3000/webhooks/uazapi/message \
  -H "x-tenant-id: tenant-demo" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "name": "João Silva",
    "message": "Quero saber sobre seus serviços",
    "messageId": "msg_123",
    "timestamp": "2026-01-27T19:30:00.000Z"
  }'
```

### 3. Listar Leads
```bash
curl http://localhost:3000/api/leads
```

---

## 🔐 Ativar OpenAI

1. Obter chave: https://platform.openai.com/api-keys
2. Editar `.env`:
```bash
OPENAI_API_KEY="sk-proj-sua-chave"
```
3. Reiniciar:
```bash
pkill -f "node dist/src/server.js"
npm start
```

---

## ⚙️ Variáveis de Ambiente (.env)

```env
# Database
DATABASE_URL=postgresql://agent:agent_password@localhost:5433/agent
MONGODB_URL=mongodb://root:mongodb_password@localhost:27018/agent-agenda

# APIs (⚠️ ATUALIZAR CHAVES)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-5-nano
UAZAPI_KEY=...
UAZAPI_URL=https://api.uazapi.com

# Chatwoot (✅ JÁ CONFIGURADO)
CHATWOOT_URL=https://connect.synapsea.com.br
CHATWOOT_API_TOKEN=81wgoQ4AWQxrJc7sHLmD23nb
CHATWOOT_ACCOUNT_ID=1

# Segurança de Webhooks (opcional, recomendado)
UAZAPI_WEBHOOK_SECRET=seu-segredo-uazapi
CHATWOOT_WEBHOOK_SECRET=seu-segredo-chatwoot

codex/refactor-agent-for-improved-functionality-ujhmxn
# Integration Hub (opcional, para conectores externos)
CALCOM_API_URL=https://api.cal.com/v1
CALCOM_API_KEY=...
GOOGLE_CALENDAR_API_URL=https://www.googleapis.com/calendar/v3
GOOGLE_CALENDAR_TOKEN=...
GOOGLE_SHEETS_API_URL=https://sheets.googleapis.com/v4/spreadsheets
GOOGLE_SHEETS_TOKEN=...
META_API_URL=https://graph.facebook.com/v20.0
META_API_TOKEN=...
RD_STATION_API_URL=https://api.rd.services
RD_STATION_TOKEN=...

main
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
FOLLOW_UP_DELAY_HOURS=24
COLD_STORAGE_DAYS=7

# Hardening (recomendado em produção)
CORS_ALLOWED_ORIGINS=https://app.suaempresa.com,https://painel.suaempresa.com
ENABLE_TEST_ENDPOINTS=false
REQUIRE_WEBHOOK_SECRETS=true
DB_CONNECT_MAX_ATTEMPTS=5
DB_CONNECT_RETRY_MS=2000

# Segurança avançada de integração
INTEGRATION_API_KEYS=key-prod-1,key-prod-2
INTEGRATION_ALLOWED_HOSTS=api.cal.com,graph.facebook.com,api.rd.services

# Multi-tenant
# obrigatório enviar header x-tenant-id em todas as rotas de negócio
```

---


## 🎛️ Personalização do Agente (Prompt + Forma de Falar)

### Onde alterar o prompt de IA
- **Classificação de intenção**: `src/domain/intent/intent.classifier.ts` (mensagem `role: system`)
- **Resposta conversacional do agente**: `src/domain/agent/response.generator.ts` (prompt do SDR)

### Onde alterar o jeito que ele fala
- **Tom e objetivo global**: variáveis no `.env`
  - `AGENT_TONE`
  - `AGENT_OBJECTIVE`
  - `AGENT_COMPANY_NAME`
  - `AGENT_LANGUAGE`
  - `AGENT_MAX_REPLY_CHARS`
- **Mensagens de follow-up automáticas**: `src/application/cron/follow-up-24h.job.ts`

### Ativar/desativar resposta automática
```env
AGENT_AUTO_REPLY_ENABLED=true
```

Quando ativo, o webhook de WhatsApp processa a intenção e também gera uma resposta automática usando OpenAI antes de enviar via UAZAPI.

### Painel HTML para configuração (sem editar .env)
- Página: `GET /admin/agent-config`
- API de leitura: `GET /api/admin/agent-config`
- API de atualização: `PUT /api/admin/agent-config`

Use o subdomínio desejado `sdr-synapasea.sentiia.com.br` no proxy reverso apontando para o serviço da API para gerir tom/prompt do agente em runtime.

Exemplos prontos de Nginx e Traefik estão em `DEPLOYMENT_GUIDE.md` na seção **Subdomínio para o Painel de Configuração do Agente**.

Se quiser proteger a API de configuração, defina no `.env`:
```env
ADMIN_CONFIG_TOKEN=seu-token-forte
```

### Como gerar o token de acesso
```bash
# OpenSSL (recomendado)
openssl rand -hex 32

# ou Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Depois copie o token gerado para `ADMIN_CONFIG_TOKEN` e use no header `x-admin-token` ao salvar/carregar a configuração no painel.

---

## 🛠️ Desenvolvimento

### Contribuição
- Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para padrões de colaboração.
- Títulos e descrições de PR devem ser escritos em **Português (Brasil)**.

### Build
```bash
npm run build
```

### Logs
```bash
tail -f /tmp/agent.log
```

### Testes
```bash
bash test-suite.sh
```

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| Porta 3000 em uso | `pkill -f "node dist"` |
| BD não conecta | `docker-compose restart` |
| OpenAI não funciona | Verificar chave em https://platform.openai.com |
| Chatwoot erro 401 | Gerar novo token no painel |

---

## 📄 Licença

Propriedade da Synapsea.

---

**Status**: ✅ **PRONTO PARA OPERAÇÃO**  
**Versão**: 2.0.0
- **Webhooks**: Integração com UAZAPI (WhatsApp), Chatwoot e eventos customizados
- **Jobs Agendados**: Follow-ups automáticos e cold storage de leads inativos
- **Analytics**: Métricas detalhadas de conversação e funil
- **Sincronização**: Sync automático com Chatwoot e etiquetagem inteligente

## 🚀 Quick Start

### Pré-requisitos
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (ou use Docker)
- MongoDB (para Agenda)
- Redis (para cache)

### Instalação

```bash
# Clone o repositório
git clone <repo>
cd sdr-agent

# Executar setup automático
bash setup.sh

# Editar variáveis de ambiente
nano .env

# Iniciar servidor
npm run dev
```

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações (env, secrets)
├── database/        # Prisma client
├── domain/          # Lógica de negócio
│   ├── intent/      # Classificador de intenção
│   ├── lead/        # Serviço de leads
│   ├── label/       # Gerenciador de etiquetas
│   └── conversation/# Handler de conversas
├── application/     # Use cases e orquestração
│   ├── webhooks/    # Handlers de webhooks
│   ├── cron/        # Jobs agendados
│   └── services/    # Serviços de negócio
├── infra/           # Integrações externas
│   ├── chatwoot/    # Client Chatwoot
│   ├── openai/      # Client OpenAI
│   ├── uazapi/      # Client UAZAPI (WhatsApp)
│   └── slack/       # Notificações Slack
└── shared/          # Utilidades compartilhadas
    ├── utils/       # Logger, retry, errors
    ├── types/       # TypeScript types
    └── constants/   # Constantes
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/agent
MONGODB_URL=mongodb://localhost:27017/agent

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5-nano

# Chatwoot
CHATWOOT_URL=https://chatwoot.example.com
CHATWOOT_API_TOKEN=token...
CHATWOOT_ACCOUNT_ID=1

# UAZAPI (WhatsApp)
UAZAPI_KEY=key...
UAZAPI_URL=https://api.uazapi.com

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Leads
```bash
GET /api/leads                    # Lista todos os leads
GET /api/leads/:phone             # Detalhes do lead
GET /api/leads/hot                # Apenas hot leads (score > 80)
```

### Webhooks
```bash
POST /webhooks/uazapi/message     # Mensagem do WhatsApp
POST /webhooks/chatwoot/message-created  # Mensagem do Chatwoot
```

## 🔄 Jobs Agendados

### Follow-up 24h
- Executa: A cada hora
- Função: Envia follow-up para leads sem resposta há 24h
- Score mínimo: 30

### Cold Storage 7 dias
- Executa: 2x por dia
- Função: Arquiva leads inativos por 7 dias com score < 50
- Status: Move para ColdLead

## 📊 Fluxo de Lead

```
WhatsApp → UAZAPI → Webhook → Classificação → Scoring → Status Update → Chatwoot
```

1. **Incoming**: Lead envia mensagem via WhatsApp
2. **Classify**: IA analisa intenção (BUY_NOW/SUPPORT/TRIAGE)
3. **Score**: Pontua baseado em intenção e histórico
4. **Status**: Atualiza status (TRIAGE/HOT/FOLLOW_UP/COLD/ARCHIVED)
5. **Label**: Aplica etiqueta no Chatwoot
6. **Follow-up**: Agenda interações automáticas

## 🧪 Testes

```bash
npm test              # Rodando testes
npm run test:cov      # Com cobertura
```

## 🐳 Docker

```bash
# Iniciar todos os containers
docker-compose up

# Parar containers
docker-compose down

# Limpar dados
docker-compose down -v
```

## 📝 Logs

```
logs/
├── error.log      # Apenas erros
├── combined.log   # Todos os logs
```

## 🤝 Contribuindo

1. Crie uma branch (`git checkout -b feature/AmazingFeature`)
2. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
3. Push para a branch (`git push origin feature/AmazingFeature`)
4. Abra um Pull Request

## 📄 Licença

Proprietary - SDR

## 📞 Suporte

Para problemas ou dúvidas:
- Criar issue no repositório
- Contatar time de desenvolvimento

---

**Status**: 🟢 Production Ready
**Versão**: 2.0.0
**Última atualização**: 2024
