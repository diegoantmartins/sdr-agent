#!/bin/bash
# setup.sh - Script de inicialização completo

set -e

echo "🚀 Iniciando setup do SDR Agent Core..."

# ============ 1. Verificar Node.js ==========
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
  echo "❌ Node.js não encontrado. Instale node 20+"
  exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION encontrado"

# ============ 2. Instalar dependências npm ==========
echo "📦 Instalando dependências npm..."
npm install

# ============ 3. Copiar .env ==========
if [ ! -f .env ]; then
  echo "📝 Criando arquivo .env..."
  cp .env.example .env
  echo "⚠️  Edite .env com suas credenciais antes de iniciar!"
else
  echo "✅ Arquivo .env já existe"
fi

# ============ 4. Fazer build ==========
echo "🔨 Compilando TypeScript..."
npm run build

# ============ 5. Iniciar containers ==========
echo "🐳 Iniciando Docker containers..."
docker-compose up -d

# ============ 6. Aguardar banco de dados ==========
echo "⏳ Aguardando PostgreSQL..."
for i in {1..30}; do
  if docker-compose exec -T postgres pg_isready -U agent > /dev/null 2>&1; then
    echo "✅ PostgreSQL pronto"
    break
  fi
  echo "Tentativa $i/30..."
  sleep 2
done

# ============ 7. Rodra migrations ==========
echo "🔄 Rodando migrations do Prisma..."
npx prisma migrate deploy

# ============ 8. Gerar Prisma client ==========
echo "🔧 Gerando Prisma client..."
npx prisma generate

echo ""
echo "✅ Setup concluído com sucesso!"
echo ""
echo "🚀 Para iniciar o servidor, execute:"
echo "   npm run dev     (desenvolvimento)"
echo "   npm start       (produção)"
echo ""
echo "📊 Para acessar o Prisma Studio:"
echo "   npm run prisma:studio"
