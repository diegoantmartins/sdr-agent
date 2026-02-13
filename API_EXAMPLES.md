# 📝 EXEMPLOS DE REQUISIÇÕES - SDR API

**Base URL**: `http://localhost:3000`

---

## 🏥 Health Check

### Request
```bash
curl http://localhost:3000/health
```

### Response (200 OK)
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T19:16:33.621Z"
}
```

---

## 👥 LEADS - CRIAR

### Request
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "name": "João da Silva",
    "email": "joao@example.com",
    "company": "Tech Solutions",
    "source": "whatsapp",
    "campaignId": "camp_123",
    "metadata": {
      "utm_source": "google_ads",
      "utm_medium": "search"
    }
  }'
```

### Response (201 Created)
```json
{
  "id": "cmkwz9pvj00005rq084oexcqa",
  "phone": "5511999999999",
  "name": "João da Silva",
  "email": "joao@example.com",
  "company": "Tech Solutions",
  "score": 0,
  "intentClassified": null,
  "firstMessageAt": "2026-01-27T19:16:54.463Z",
  "lastMessageAt": "2026-01-27T19:16:54.463Z",
  "messageCount": 1,
  "status": "TRIAGE",
  "conversionStage": null,
  "chatwootContactId": null,
  "chatwootConvId": null,
  "syncedAt": null,
  "source": "whatsapp",
  "campaignId": "camp_123",
  "tags": [],
  "metadata": {
    "utm_source": "google_ads",
    "utm_medium": "search"
  },
  "createdAt": "2026-01-27T19:16:54.463Z",
  "updatedAt": "2026-01-27T19:16:54.463Z"
}
```

---

## 👥 LEADS - LISTAR TODOS

### Request
```bash
curl http://localhost:3000/api/leads
```

### Response (200 OK)
```json
{
  "leads": [
    {
      "id": "cmkwz9pvj00005rq084oexcqa",
      "phone": "5511999999999",
      "name": "João da Silva",
      "email": "joao@example.com",
      "company": "Tech Solutions",
      "score": 45,
      "intentClassified": "CONSULTATION",
      "status": "HOT",
      "source": "whatsapp",
      "createdAt": "2026-01-27T19:16:54.463Z",
      "updatedAt": "2026-01-27T19:20:12.789Z"
    }
  ]
}
```

---

## 👤 LEADS - OBTER DETALHE

### Request
```bash
curl http://localhost:3000/api/leads/5511999999999
```

### Response (200 OK)
```json
{
  "lead": {
    "id": "cmkwz9pvj00005rq084oexcqa",
    "phone": "5511999999999",
    "name": "João da Silva",
    "score": 45,
    "status": "HOT",
    "createdAt": "2026-01-27T19:16:54.463Z"
  },
  "messages": [
    {
      "id": "msg_123",
      "content": "Quero saber sobre seus serviços",
      "type": "incoming",
      "createdAt": "2026-01-27T19:16:54.463Z"
    }
  ]
}
```

---

## 🔥 LEADS - OBTER HOT LEADS

### Request
```bash
curl http://localhost:3000/api/leads/hot
```

### Response (200 OK)
```json
{
  "leads": [
    {
      "id": "cmkwz9pvj00005rq084oexcqa",
      "phone": "5511999999999",
      "name": "João da Silva",
      "score": 85,
      "intentClassified": "BUY_NOW",
      "status": "HOT",
      "createdAt": "2026-01-27T19:16:54.463Z"
    }
  ]
}
```

---

## 💬 WEBHOOK - MENSAGEM WHATSAPP RECEBIDA

### Cenário: Cliente envia mensagem via WhatsApp

```bash
curl -X POST http://localhost:3000/webhooks/uazapi/message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "name": "João da Silva",
    "message": "Preciso de ajuda com meu pedido #12345",
    "messageId": "msg_uazapi_123",
    "timestamp": "2026-01-27T19:20:00.000Z"
  }'
```

### Response (200 OK)
```json
{
  "success": true,
  "messageId": "msg_uazapi_123"
}
```

**O que acontece nos bastidores:**
1. Lead é criado ou localizado
2. Mensagem é armazenada
3. Intenção é classificada (padrão + OpenAI se configurado)
4. Score é atualizado automaticamente
5. Status pode mudar para HOT se score > 80

---

## 🧪 TESTE - ENVIAR MENSAGEM E CLASSIFICAR

### Request
```bash
curl -X POST http://localhost:3000/test/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Quero comprar agora mesmo!"
  }'
```

### Response (200 OK) - Com OpenAI ativo
```json
{
  "success": true,
  "messageId": "msg_test_456",
  "message": "Mensagem enviada com sucesso via UAZAPI",
  "intent": "BUY_NOW",
  "confidence": 0.95
}
```

### Response (503 Error) - Com chave de teste
```json
{
  "success": false,
  "error": "ExternalApiError: Falha ao enviar mensagem para 5511999999999"
}
```

---

## 🧪 TESTE - VERIFICAR UAZAPI

### Request
```bash
curl http://localhost:3000/test/uazapi
```

### Response (200 OK)
```json
{
  "status": "unhealthy",
  "message": "UAZAPI não está respondendo"
}
```

**Com chave real**:
```json
{
  "status": "connected",
  "message": "UAZAPI está funcionando"
}
```

---

## 🧪 TESTE - VERIFICAR BANCO DE DADOS

### Request
```bash
curl http://localhost:3000/test/database
```

### Response (200 OK)
```json
{
  "status": "connected",
  "timestamp": [
    {
      "now": "2026-01-27T19:16:49.535Z"
    }
  ],
  "leadsCount": 5,
  "message": "PostgreSQL está conectado e funcionando"
}
```

---

## 🧪 TESTE - VERIFICAR CHATWOOT

### Request
```bash
curl http://localhost:3000/test/chatwoot
```

### Response (200 OK) - Com token válido
```json
{
  "status": "connected",
  "accountId": 1,
  "accountName": "Synapsea",
  "message": "Chatwoot está acessível"
}
```

### Response (503 Error) - Token inválido
```json
{
  "status": "error",
  "message": "Chatwoot não está acessível",
  "error": "Request failed with status code 401"
}
```

---

## 🧪 TESTE - TESTAR TODOS SERVIÇOS

### Request
```bash
curl http://localhost:3000/test/all
```

### Response (200 OK)
```json
{
  "database": {
    "status": "ok"
  },
  "uazapi": {
    "status": "unhealthy"
  },
  "chatwoot": {
    "status": "error",
    "error": "AxiosError: Request failed with status code 401"
  }
}
```

---

## 📊 STATUSES POSSÍVEIS DE LEADS

```
TRIAGE      - Lead novo, aguardando qualificação
HOT         - Lead com alta probabilidade de conversão (score > 80, intent BUY_NOW)
FOLLOW_UP   - Lead que precisa de acompanhamento
COLD        - Lead inativo por > 7 dias
ARCHIVED    - Lead finalizado/descartado
OPEN        - Lead em discussão ativa
```

---

## 🎯 INTENTS POSSÍVEIS (CLASSIFICAÇÃO)

```
BUY_NOW           - Cliente quer comprar agora
CONSULTATION      - Cliente quer consultoria/demo
SUPPORT           - Cliente precisa de suporte
INFO_REQUEST      - Cliente quer mais informações
OBJECTION         - Cliente tem objeções
COMPLAINT         - Cliente reclamando
GENERIC           - Mensagem genérica (padrão)
UNKNOWN           - Não foi possível classificar
```

---

## ⚙️ SCORING

```
Padrão base:     0
Mensagem recebida: +1
Intent BUY_NOW: +30
Intent SUPPORT: +10
Intent CONSULTATION: +15
Cada 10 mensagens: +5
Max: 100
```

---

## 🔐 Headers Suportados

```
Content-Type: application/json          (obrigatório para POST)
Authorization: Bearer <token>            (futuro, se ativar autenticação)
```

---

## ❌ Códigos de Erro Comuns

```
400 - Bad Request           (validação falhou)
401 - Unauthorized          (token inválido)
404 - Not Found             (recurso não existe)
500 - Internal Server Error (erro no servidor)
503 - Service Unavailable   (serviço externo offline)
```

---

## 🚀 Exemplo de Fluxo Completo

```bash
# 1. Criar lead
LEAD=$(curl -s -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511988776655",
    "name": "Maria Santos",
    "source": "whatsapp"
  }')

# 2. Simular webhook de mensagem
curl -X POST http://localhost:3000/webhooks/uazapi/message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511988776655",
    "name": "Maria Santos",
    "message": "Quero saber mais sobre o plano premium",
    "messageId": "msg_123",
    "timestamp": "2026-01-27T19:30:00.000Z"
  }'

# 3. Consultar lead atualizado
curl http://localhost:3000/api/leads/5511988776655

# 4. Listar hot leads
curl http://localhost:3000/api/leads/hot
```

---

**✅ API Completa e Documentada!**
