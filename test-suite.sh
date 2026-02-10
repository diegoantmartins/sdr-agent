#!/bin/bash

# SDR Agent Core - Test Suite
# Uso: bash test-suite.sh

API="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 SDR Agent Core - Test Suite${NC}\n"

# Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
curl -s $API/health | jq .
echo ""

# Database Connection
echo -e "${YELLOW}2. Testing Database Connection...${NC}"
curl -s $API/test/database | jq .
echo ""

# UAZAPI (WhatsApp)
echo -e "${YELLOW}3. Testing UAZAPI (WhatsApp)...${NC}"
curl -s $API/test/uazapi | jq .
echo ""

# Chatwoot
echo -e "${YELLOW}4. Testing Chatwoot Integration...${NC}"
curl -s $API/test/chatwoot | jq .
echo ""

# Create a Test Lead
echo -e "${YELLOW}5. Creating Test Lead...${NC}"
LEAD=$(curl -s -X POST $API/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "name": "Test User",
    "email": "test@example.com",
    "company": "Test Company",
    "source": "WhatsApp"
  }')
echo "$LEAD" | jq .
LEAD_ID=$(echo "$LEAD" | jq -r '.id' 2>/dev/null)
echo ""

# List Leads
echo -e "${YELLOW}6. Listing All Leads...${NC}"
curl -s $API/api/leads | jq '.'
echo ""

# Send Test Message (Intent Classification)
echo -e "${YELLOW}7. Testing Intent Classification (OpenAI)...${NC}"
echo -e "${YELLOW}   (Will use pattern matching, OpenAI if key configured)${NC}"
curl -s -X POST $API/test/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "from": "5511999999999",
    "message": "Quero saber sobre seus serviços de consultoria"
  }' | jq .
echo ""

# Test All Services
echo -e "${YELLOW}8. Testing All Services at Once...${NC}"
curl -s $API/test/all | jq .
echo ""

echo -e "${GREEN}✅ Test suite completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Status Overview:${NC}"
echo "  ✅ Server: http://localhost:3000"
echo "  ✅ Database: PostgreSQL (port 5433)"
echo "  ✅ Jobs: MongoDB + Agenda (port 27018)"
echo "  ✅ Cache: Redis (port 6379)"
echo ""
echo -e "${YELLOW}🔴 Pending:${NC}"
echo "  ⚠️  OPENAI_API_KEY in .env (test key is dummy)"
echo "  ⚠️  UAZAPI_KEY in .env (test key is dummy)"
echo "  ⚠️  Chatwoot URL/Token (offline for testing)"
echo ""
