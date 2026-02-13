#!/bin/bash
# TEST_CHECKLIST.sh - Checklist de testes do projeto

echo "🧪 ============================================="
echo "   SDR AGENT CORE - TEST CHECKLIST"
echo "============================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="http://localhost:3000"

echo "📋 TESTES A EXECUTAR:"
echo ""
echo "1. ✅ Testes de Conexão"
echo "2. ✅ Testes de API"
echo "3. ✅ Testes de Webhook"
echo "4. ✅ Testes de Intenção"
echo ""
echo "Começando testes..."
echo ""

# ========== 1. HEALTH CHECK ==========
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  HEALTH CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GET $API_URL/health"
RESPONSE=$(curl -s $API_URL/health)
echo "Response: $RESPONSE"
echo ""

# ========== 2. DATABASE CONNECTION ==========
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  DATABASE CONNECTION TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GET $API_URL/test/database"
RESPONSE=$(curl -s $API_URL/test/database | jq .)
echo "Response:"
echo "$RESPONSE"
echo ""

# ========== 3. UAZAPI CONNECTION ==========
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  UAZAPI CONNECTION TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GET $API_URL/test/uazapi"
RESPONSE=$(curl -s $API_URL/test/uazapi | jq .)
echo "Response:"
echo "$RESPONSE"
echo ""

# ========== 4. CHATWOOT CONNECTION ==========
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  CHATWOOT CONNECTION TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GET $API_URL/test/chatwoot"
RESPONSE=$(curl -s $API_URL/test/chatwoot | jq .)
echo "Response:"
echo "$RESPONSE"
echo ""

# ========== 5. ALL SERVICES ==========
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  ALL SERVICES HEALTH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GET $API_URL/test/all"
RESPONSE=$(curl -s $API_URL/test/all | jq .)
echo "Response:"
echo "$RESPONSE"
echo ""

# ========== 6. LIST LEADS ==========
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  LIST LEADS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GET $API_URL/api/leads"
RESPONSE=$(curl -s $API_URL/api/leads | jq .)
echo "Response:"
echo "$RESPONSE"
echo ""

# ========== 7. SEND TEST MESSAGE ==========
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  SEND TEST MESSAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "POST $API_URL/test/send-message"
echo "Body: {\"phone\": \"5511999999999\", \"message\": \"Teste do agente\"}"
RESPONSE=$(curl -s -X POST $API_URL/test/send-message \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999999999", "message": "Teste do agente"}' | jq .)
echo "Response:"
echo "$RESPONSE"
echo ""

echo "✅ Testes concluídos!"
echo ""
echo "📝 Próximos passos:"
echo "1. Verificar que todos os testes retornam status 200"
echo "2. Editar UAZAPI_KEY e OPENAI_API_KEY em .env"
echo "3. Executar npm run build"
echo "4. Executar npm run dev"
echo "5. Fazer testes com webhooks reais"
