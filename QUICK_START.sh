#!/bin/bash
# QUICK_START.sh - Iniciar projeto em 2 minutos

echo "🚀 ============================================="
echo "   SDR AGENT CORE - Quick Start"
echo "============================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js não encontrado${NC}"
  echo "   Instale em: https://nodejs.org (versão 20+)"
  exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"
echo ""

# Ir para diretório do projeto
PROJECT_DIR="/root/home/agente de i.a/sdr-agent"
cd "$PROJECT_DIR" || exit 1

echo "📂 Diretório: $PROJECT_DIR"
echo ""

# Opções de inicialização
echo "Escolha uma opção:"
echo "1) Setup Completo (Docker + Node) - 5 min"
echo "2) Apenas Node.js local - 2 min"
echo "3) Apenas Docker (PostgreSQL, MongoDB, Redis) - 1 min"
echo "4) Verificar instalação existente"
echo ""
read -p "Escolha (1-4): " OPTION

case $OPTION in
  1)
    echo ""
    echo "🔧 Iniciando Setup Completo..."
    echo ""
    
    # Instalar dependências
    echo "📦 Instalando dependências npm..."
    npm install
    
    # Copiar .env
    if [ ! -f .env ]; then
      echo "📝 Criando .env..."
      cp .env.example .env
      echo -e "${YELLOW}⚠️  Edite .env com suas credenciais!${NC}"
    fi
    
    # Build TypeScript
    echo "🔨 Compilando TypeScript..."
    npm run build
    
    # Docker Compose
    echo "🐳 Iniciando Docker containers..."
    docker-compose up -d
    
    echo ""
    echo -e "${GREEN}✅ Setup concluído!${NC}"
    echo ""
    echo "🚀 Para iniciar o servidor:"
    echo "   npm run dev"
    echo ""
    ;;
    
  2)
    echo ""
    echo "🔧 Instalando Node.js localmente..."
    echo ""
    
    # Instalar deps
    echo "📦 npm install..."
    npm install
    
    # Copiar .env
    if [ ! -f .env ]; then
      cp .env.example .env
      echo -e "${YELLOW}⚠️  Edite .env com PostgreSQL, MongoDB, Redis locais${NC}"
    fi
    
    # Build
    echo "🔨 npm run build..."
    npm run build
    
    echo ""
    echo -e "${GREEN}✅ Instalação concluída!${NC}"
    echo ""
    echo "🚀 Para iniciar:"
    echo "   npm run dev"
    echo ""
    ;;
    
  3)
    echo ""
    echo "🐳 Iniciando apenas Docker containers..."
    docker-compose up postgres mongodb redis -d
    
    echo ""
    echo -e "${GREEN}✅ Containers iniciados!${NC}"
    echo ""
    echo "📝 Edite .env se necessário:"
    echo "   DATABASE_URL=postgresql://agent:agent_password@localhost:5432/agent"
    echo "   MONGODB_URL=mongodb://root:mongodb_password@localhost:27017/agent-agenda?authSource=admin"
    echo "   REDIS_URL=redis://localhost:6379"
    echo ""
    echo "🚀 Depois execute:"
    echo "   npm install"
    echo "   npm run build"
    echo "   npm run dev"
    echo ""
    ;;
    
  4)
    echo ""
    echo "🔍 Verificando instalação..."
    echo ""
    
    # Check npm
    if command -v npm &> /dev/null; then
      echo -e "${GREEN}✅ npm${NC}: $(npm -v)"
    else
      echo -e "${RED}❌ npm não encontrado${NC}"
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
      echo -e "${GREEN}✅ Docker${NC}: $(docker --version)"
    else
      echo -e "${RED}❌ Docker não encontrado${NC}"
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
      echo -e "${GREEN}✅ Docker Compose${NC}: $(docker-compose --version)"
    else
      echo -e "${RED}❌ Docker Compose não encontrado${NC}"
    fi
    
    # Check node_modules
    if [ -d "node_modules" ]; then
      echo -e "${GREEN}✅ node_modules${NC}: instalado"
    else
      echo -e "${RED}❌ node_modules${NC}: não encontrado"
    fi
    
    # Check .env
    if [ -f ".env" ]; then
      echo -e "${GREEN}✅ .env${NC}: existente"
    else
      echo -e "${YELLOW}⚠️  .env${NC}: não encontrado (use 'cp .env.example .env')"
    fi
    
    # Check dist
    if [ -d "dist" ]; then
      echo -e "${GREEN}✅ dist${NC}: compilado"
    else
      echo -e "${YELLOW}⚠️  dist${NC}: não compilado (use 'npm run build')"
    fi
    
    echo ""
    ;;
    
  *)
    echo -e "${RED}❌ Opção inválida${NC}"
    exit 1
    ;;
esac

echo "📚 Documentação:"
echo "   - README.md"
echo "   - DEPLOYMENT_GUIDE.md"
echo "   - PROJECT_SUMMARY.md"
echo ""
echo "🎯 Endpoints:"
echo "   GET  /health"
echo "   GET  /api/leads"
echo "   GET  /api/leads/:phone"
echo "   GET  /api/leads/hot"
echo "   POST /webhooks/uazapi/message"
echo ""
