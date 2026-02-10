# 🚀 DEPLOYMENT CHECKLIST - SDR Agent Core

**Data**: 27 de Janeiro de 2026  
**Status**: Pronto para produção

---

## ✅ PRÉ-REQUISITOS ATENDIDOS

- [x] Node.js 18+ instalado
- [x] Docker e Docker Compose funcionando
- [x] PostgreSQL 16 configurado (porta 5433)
- [x] MongoDB 6.0 configurado (porta 27018)
- [x] Redis 7 configurado (porta 6379)
- [x] npm dependencies instalados (465 packages)
- [x] TypeScript compilando sem erros
- [x] Servidor Fastify iniciando normalmente

---

## ⚠️ CHAVES E CREDENCIAIS NECESSÁRIAS

### 1. OpenAI API Key ⚠️ **REQUERIDO PARA IA**
- [ ] Obter em: https://platform.openai.com/api-keys
- [ ] Copiar chave (formato: `sk-proj-...`)
- [ ] Adicionar em `.env` como `OPENAI_API_KEY`
- [ ] Testar: `curl -X POST http://localhost:3000/test/send-message \-H "Content-Type: application/json" \-d '{"phone": "5511999999999", "message": "Teste OpenAI"}'`

### 2. UAZAPI Key ⚠️ **REQUERIDO PARA WHATSAPP**
- [ ] Obter com suporte UAZAPI
- [ ] Adicionar em `.env` como `UAZAPI_KEY`
- [ ] Testar: `curl http://localhost:3000/test/uazapi`

### 3. Chatwoot Token ⚠️ **REQUER VALIDAÇÃO**
- [x] URL já atualizada: `https://connect.synapsea.com.br`
- [x] Token fornecido: `81wgoQ4AWQxrJc7sHLmD23nb`
- [x] Account ID: `1`
- [ ] Se erro 401 persistir: Gerar novo token no painel Chatwoot
- [ ] Testar: `curl http://localhost:3000/test/chatwoot`

---

## 📋 CHECKLIST DE DEPLOY

### Fase 1: Preparação Local
- [x] Clonar/criar repositório
- [x] npm install --legacy-peer-deps executado
- [x] .env criado com configurações base
- [x] docker-compose.yml verificado
- [x] TypeScript build bem-sucedido
- [x] Servidor iniciando sem erros

### Fase 2: Testes Funcionais
- [x] Health check respondendo
- [x] Banco de dados conectado
- [x] MongoDB iniciado com Agenda
- [x] Redis operacional
- [x] CRUD de Leads funcionando
- [x] Webhook endpoints prontos

### Fase 3: Chaves de API
- [ ] OPENAI_API_KEY adicionada e testada
- [ ] UAZAPI_KEY adicionada e testada
- [ ] CHATWOOT_API_TOKEN validada

### Fase 4: Validação Final
- [ ] `npm run build` sem erros
- [ ] `npm start` iniciando normalmente
- [ ] `curl http://localhost:3000/test/all` retornando status
- [ ] Logs sem warnings críticos

---

## 📦 DEPLOYMENT OPTIONS

### Option 1: Servidor Linux (Recomendado)
```bash
# 1. Clone o repositório
cd /root/home/agente\ de\ i.a/sdr-agent

# 2. Instale dependências
npm install --legacy-peer-deps

# 3. Configure .env com chaves reais
vi .env

# 4. Inicie Docker containers
docker-compose up -d

# 5. Compile e inicie servidor
npm run build
npm start

# 6. Verifique
curl http://localhost:3000/health
```

### Option 2: Docker Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build e deploy:
```bash
docker build -t sdr-agent:v2 .
docker run -p 3000:3000 --env-file .env sdr-agent:v2
```

### Option 3: Docker Compose (Full Stack)
```bash
docker-compose up -d
```

Verifica status:
```bash
docker-compose ps
```

---

## 🔐 SEGURANÇA PRÉ-DEPLOY

### Environment Variables
- [ ] Verificar que `.env` contém chaves reais
- [ ] Certificar que `.env` **NÃO está** em git
- [ ] Verificar `.gitignore` inclui `.env`
- [ ] Usar secrets manager em produção

### Credentials
- [ ] OpenAI key tem scopo limitado
- [ ] UAZAPI key tem IP whitelist
- [ ] Chatwoot token tem permissões mínimas
- [ ] PostgreSQL tem senha forte

### Networking
- [ ] CORS configurado corretamente
- [ ] Helmet security headers ativo
- [ ] Rate limiting implementado (opcional)
- [ ] Firewall liberando portas 3000, 5433, 27018

### Database
- [ ] Backup automático configurado
- [ ] Replicação ativa (se multiple instances)
- [ ] Logs de auditoria habilitados
- [ ] Índices criados (Prisma migrate)

---

## 🧪 TESTES PRÉ-DEPLOY

### 1. Health Checks
```bash
# Servidor
curl http://localhost:3000/health

# Todos serviços
curl http://localhost:3000/test/all

# Database específico
curl http://localhost:3000/test/database

# WhatsApp
curl http://localhost:3000/test/uazapi

# CRM
curl http://localhost:3000/test/chatwoot
```

### 2. Fluxo End-to-End
```bash
# 1. Criar lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511988776655", "name": "Teste", "source": "whatsapp"}'

# 2. Webhook mensagem
curl -X POST http://localhost:3000/webhooks/uazapi/message \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511988776655", "message": "Teste", "messageId": "msg_1", "timestamp": "2026-01-27T19:30:00.000Z"}'

# 3. Listar leads
curl http://localhost:3000/api/leads

# 4. Hot leads
curl http://localhost:3000/api/leads/hot
```

### 3. Performance
```bash
# Medir tempo de resposta
time curl http://localhost:3000/api/leads

# Load testing (exemplo)
ab -n 1000 -c 10 http://localhost:3000/health
```

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### Logs
```bash
# Ver logs em tempo real
tail -f /tmp/agent.log

# Buscar erros
grep ERROR /tmp/agent.log

# Last 100 lines
tail -100 /tmp/agent.log
```

### Docker Logs
```bash
docker-compose logs -f

# Específico
docker-compose logs postgres
docker-compose logs mongo
```

### Health Endpoint
```bash
# Monitoring script
watch 'curl -s http://localhost:3000/health | jq'
```

### Database Queries
```bash
# Conectar ao PostgreSQL
psql postgresql://agent:agent_password@localhost:5433/agent

# Ver leads
SELECT * FROM active_lead LIMIT 10;

# Ver job logs
SELECT * FROM job_log ORDER BY created_at DESC LIMIT 10;
```

---

## 🚨 TROUBLESHOOTING DEPLOY

### Servidor não inicia
```bash
# Verificar porta
lsof -i :3000

# Ver erro
npm start 2>&1 | head -50

# Limpar node_modules
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
npm start
```

### Database connection error
```bash
# Verificar conexão
psql postgresql://agent:agent_password@localhost:5433/agent -c "SELECT 1"

# Restart container
docker-compose restart postgres

# Ver logs
docker-compose logs postgres
```

### OpenAI não funciona
```bash
# Verificar chave
echo $OPENAI_API_KEY

# Testar com curl
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Verificar quota
# https://platform.openai.com/account/billing/limits
```

### UAZAPI erro
```bash
# Verificar chave
echo $UAZAPI_KEY

# Testar connection
curl -H "Authorization: Bearer $UAZAPI_KEY" $UAZAPI_URL/api/status
```

---

## 📈 SCALING (Futuro)

Quando escalar:

1. **Load Balancer**
   - nginx/HAProxy na porta 80/443
   - Múltiplas instâncias Node (3000, 3001, 3002)

2. **Database**
   - Replicação PostgreSQL
   - Read replicas
   - Connection pooling (PgBouncer)

3. **Cache**
   - Redis Cluster
   - Session store distribuído

4. **Jobs**
   - MongoDB Replicaset
   - Bull queues (alternativa Agenda)

5. **Monitoring**
   - Prometheus + Grafana
   - Sentry para error tracking
   - CloudWatch/DataDog logs

---

## ✅ FINAL DEPLOYMENT CHECKLIST

**ANTES DE DEPLOY:**
- [ ] Todas as chaves de API adicionadas
- [ ] `.env` revisado e validado
- [ ] Builds locais bem-sucedidos
- [ ] Testes funcionais passando
- [ ] Logs verificados
- [ ] Backup do database criado
- [ ] Rollback plan documentado

**DURANTE DEPLOY:**
- [ ] Manter acesso SSH/terminal
- [ ] Monitorar logs em tempo real
- [ ] Ter número de suporte à mão
- [ ] Comunicar stakeholders

**APÓS DEPLOY:**
- [ ] Verificar saúde (health endpoints)
- [ ] Testar fluxo crítico
- [ ] Monitorar por 1 hora
- [ ] Documentar deployment
- [ ] Testar alertas

---

## 📞 SUPORTE

**Documentação**:
- README.md - Overview
- STATUS.md - Documentação completa
- OPERATIONAL_SUMMARY.md - Sumário operacional
- API_EXAMPLES.md - Exemplos requisições

**Contato**:
- Developer: [seu email]
- Ops: [contato ops]
- Emergência: [whatsapp/slack]

---

**Status**: ✅ **PRONTO PARA DEPLOY**  
**Última atualização**: 27 de Janeiro de 2026  
**Versão**: 2.0.0
