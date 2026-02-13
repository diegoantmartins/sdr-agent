# 🔑 GUIA DE CONFIGURAÇÃO DAS CHAVES DE API

**Data**: 27 de Janeiro de 2026

---

## 📋 RESUMO

Para ativar completamente o SDR Agent Core, você precisa de 3 chaves:

| # | Serviço | Status | Tempo | Prioridade |
|---|---------|--------|-------|-----------|
| 1 | OpenAI | ⚠️ Teste | 5 min | 🔴 CRÍTICA |
| 2 | UAZAPI | ⚠️ Teste | 24h | 🔴 CRÍTICA |
| 3 | Chatwoot | ⚠️ Erro 401 | 5 min | 🟡 Validar |

---

## 1️⃣ OpenAI API Key (5 minutos)

### Objetivo
Classificar intenções de mensagens com IA (BUY_NOW, SUPPORT, CONSULTATION, etc)

### Instruções

#### Passo 1: Acessar OpenAI
```
1. Abra: https://platform.openai.com/api-keys
2. Faça login com sua conta
   - Se não tem: https://platform.openai.com/signup
```

#### Passo 2: Gerar Chave
```
1. Clique em "+ Create new secret key"
2. Escolha um nome (ex: "SDR Agent")
3. Clique "Create secret key"
4. COPIE a chave (aparece uma única vez!)
   Formato: sk-proj-XXXXX...
```

#### Passo 3: Adicionar no Projeto
```bash
# Abra o arquivo .env
nano /root/home/agente\ de\ i.a/sdr-agent/.env

# Procure por esta linha:
OPENAI_API_KEY="sk-test-key-please-update"

# Substitua por (colar a chave copiada):
OPENAI_API_KEY="sk-proj-sua-chave-aqui"

# Salve (Ctrl+X, Y, Enter)
```

#### Passo 4: Testar
```bash
# Reinicie o servidor
pkill -f "node dist/src/server.js"
npm start

# Teste a IA
curl -X POST http://localhost:3000/test/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Quero comprar agora"
  }'

# Resposta esperada:
# {"success": true, "messageId": "...", "intent": "BUY_NOW"}
```

#### Validação
- ✅ Nenhuma erro 401/403
- ✅ Resposta em menos de 2 segundos
- ✅ Intent classificado corretamente

---

## 2️⃣ UAZAPI Key (24 horas)

### Objetivo
Enviar e receber mensagens via WhatsApp

### Instruções

#### Passo 1: Contatar UAZAPI
```
1. Acesse: https://www.uazapi.com
2. Crie uma conta
3. Verifique seu email
4. Faça login no painel
```

#### Passo 2: Obter Chave
```
Dashboard UAZAPI:
1. Menu → API Keys
2. Clique "+ Generate New Key"
3. Copie a chave
```

#### Passo 3: Configurar no Projeto
```bash
# Edite .env
nano /root/home/agente\ de\ i.a/sdr-agent/.env

# Procure:
UAZAPI_KEY="test-key-please-update"

# Substitua:
UAZAPI_KEY="sua-chave-uazapi"

# Salve
```

#### Passo 4: Testar
```bash
# Reinicie
pkill -f "node dist/src/server.js"
npm start

# Teste conexão
curl http://localhost:3000/test/uazapi

# Resposta esperada:
# {"status": "connected", "message": "UAZAPI está funcionando"}
```

#### Validação
- ✅ Status "connected"
- ✅ Sem mensagem de erro
- ✅ Health check OK

---

## 3️⃣ Chatwoot Token (5 minutos)

### Objetivo
Sincronizar leads com CRM Chatwoot

### Situação Atual
- ✅ URL já configurada: `https://connect.synapsea.com.br`
- ✅ Token fornecido: `81wgoQ4AWQxrJc7sHLmD23nb`
- ⚠️ Retornando erro 401

### Opção A: Validar Token Atual
```bash
# Testar se token funciona
curl -s -H "Api-Token: 81wgoQ4AWQxrJc7sHLmD23nb" \
  https://connect.synapsea.com.br/api/v1/accounts/1 | jq .

# Se erro 401: token expirou ou permissões faltam
```

### Opção B: Gerar Novo Token
```
1. Acesse: https://connect.synapsea.com.br
2. Faça login
3. Vá para: Settings → API → Tokens
4. Clique "+ Generate Token"
5. Copie o novo token
6. Configure no .env:
   CHATWOOT_API_TOKEN="novo-token-aqui"
```

### Opção C: Validar Permissões
```
Se token existe mas erro 401:
1. Verifique se token tem permissões:
   - accounts:read
   - contacts:read/write
   - conversations:read
2. Se faltam: gerar novo com todas permissões
```

### Testar
```bash
# Com novo token
pkill -f "node dist/src/server.js"
npm start

# Verificar
curl http://localhost:3000/test/chatwoot

# Resposta esperada:
# {"status": "connected", "accountId": 1, "accountName": "Synapsea"}
```

---

## ✅ CHECKLIST FINAL

Depois de adicionar as 3 chaves:

```bash
# 1. Verifique o arquivo .env
cat /root/home/agente\ de\ i.a/sdr-agent/.env | grep -E "OPENAI|UAZAPI|CHATWOOT"

# Esperado:
# OPENAI_API_KEY=sk-proj-...
# UAZAPI_KEY=...
# CHATWOOT_API_TOKEN=...
# CHATWOOT_URL=https://connect.synapsea.com.br

# 2. Compile
npm run build
# Esperado: sem erros

# 3. Reinicie servidor
pkill -f "node dist/src/server.js"
npm start

# 4. Aguarde inicializar (5 segundos)
sleep 5

# 5. Teste todos serviços
curl http://localhost:3000/test/all | jq .

# Esperado:
# {
#   "database": {"status": "ok"},
#   "uazapi": {"status": "connected"},
#   "chatwoot": {"status": "ok"}
# }
```

---

## 🧪 TESTES DE INTEGRAÇÃO

### Teste 1: Criar Lead e Enviar Mensagem
```bash
# 1. Criar lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "name": "Cliente Teste",
    "source": "whatsapp"
  }'

# 2. Webhook de mensagem
curl -X POST http://localhost:3000/webhooks/uazapi/message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "name": "Cliente Teste",
    "message": "Quero informações sobre seu produto",
    "messageId": "msg_123",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
  }'

# 3. Verificar se foi classificado e pontuado
curl http://localhost:3000/api/leads/5511999999999 | jq '.lead | {score, intentClassified, status}'
```

### Teste 2: Verificar Logs
```bash
# Ver últimas ações
tail -20 /tmp/agent.log

# Procurar por erros de API
grep -i "error\|fail" /tmp/agent.log | tail -10
```

### Teste 3: Validar Jobs Automáticos
```bash
# Ver se jobs estão rodando
curl http://localhost:3000/health

# Logs do Agenda
grep "Agenda\|Job" /tmp/agent.log | tail -10
```

---

## 🚨 TROUBLESHOOTING

### OpenAI retorna 401
```
Causa: Chave inválida ou expirada
Solução:
  1. Gerar nova chave em https://platform.openai.com/api-keys
  2. Deletar chave antiga
  3. Copiar exatamente a chave gerada
  4. Atualizar .env
```

### OpenAI retorna 429 (Rate Limited)
```
Causa: Limite de requisições atingido
Solução:
  1. Aguardar 1 minuto
  2. Atualizar plano (se necessário)
  3. Implementar backoff exponencial (código já tem)
```

### UAZAPI não conecta
```
Causa: Chave inválida ou serviço down
Solução:
  1. Verificar status: https://status.uazapi.com
  2. Gerar nova chave no painel
  3. Testar com curl direto
```

### Chatwoot erro 401
```
Causa: Token expirado ou permissões faltam
Solução:
  1. Verificar se token ainda existe
  2. Se não: gerar novo
  3. Se sim: validar permissões
  4. Se falta permissões: deletar e gerar novo
```

### Banco de dados cheio (erro 413)
```
Causa: Espaço em disco insuficiente
Solução:
  1. Limpar logs: rm -f /tmp/agent.log
  2. Limpeza de dados antigos: (SQL custom)
  3. Aumentar disco se em produção
```

---

## 💡 DICAS

1. **Segurança**: Nunca commite `.env` no git
2. **Backup**: Salve as chaves em local seguro
3. **Rotação**: Regenere chaves a cada 3 meses
4. **Monitoramento**: Monitore usage no painel de cada API
5. **Logs**: Todos os erros de API estão em `/tmp/agent.log`

---

## 📞 SUPORTE

**Se algo não funcionar:**

1. Ver logs: `tail -f /tmp/agent.log`
2. Testar endpoint: `curl http://localhost:3000/test/all`
3. Verificar .env: `cat .env | grep OPENAI`
4. Documentação: Ver README.md e STATUS.md

---

**✅ Próximo**: Adicionar as 3 chaves e testar!

**Tempo estimado**: 30 minutos (incluindo aguardar aprovação UAZAPI)

**Resultado**: Sistema 100% operacional!
