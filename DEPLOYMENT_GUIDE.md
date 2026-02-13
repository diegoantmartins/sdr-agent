# Deployment Guide - SDR Agent Core

## 📋 Índice
1. [Quick Start](#quick-start)
2. [Instalação Manual](#instalação-manual)
3. [Docker Deployment](#docker-deployment)
4. [Configuração Produção](#configuração-produção)
5. [Monitoramento](#monitoramento)
6. [Troubleshooting](#troubleshooting)

---

## ⚡ Quick Start

```bash
# 1. Clonar repositório
git clone <repo>
cd sdr-agent

# 2. Executar setup automático (cria estrutura, instala deps, rodas migrations)
bash setup.sh

# 3. Editar .env com suas credenciais
nano .env

# 4. Iniciar desenvolvimento
npm run dev
```

Server rodará em: **http://localhost:3000**

---

## 🛠️ Instalação Manual

### Pré-requisitos
- Node.js 20+
- PostgreSQL 16+
- MongoDB 7.0+
- Redis 7+

### Passo 1: Clonar e instalar

```bash
git clone <repo>
cd sdr-agent
npm install
```

### Passo 2: Configurar ambiente

```bash
cp .env.example .env
# Editar .env com suas credenciais
```

### Passo 3: Setup do banco de dados

```bash
# PostgreSQL deve estar rodando
# Rodar migrations
npx prisma migrate deploy

# Gerar Prisma client
npx prisma generate

# Opcional: Popular dados de teste
npx prisma db seed
```

### Passo 4: Build e Start

```bash
# Build TypeScript
npm run build

# Iniciar servidor
npm start
```

---

## 🌐 Subdomínio para o Painel de Configuração do Agente

Com o painel em `GET /admin/agent-config`, você pode publicar em um subdomínio dedicado como:

- `sdr-synapasea.sentiia.com.br` → rota de UI
- `sdr-synapasea.sentiia.com.br/api/admin/agent-config` → API de configuração

> Recomendado em produção: definir `ADMIN_CONFIG_TOKEN` e restringir acesso por IP/VPN no proxy.


### Passos recomendados para publicar `sdr-synapasea.sentiia.com.br`

1. Criar registro DNS `A/CNAME` do subdomínio apontando para o servidor do proxy.
2. Garantir TLS (Let's Encrypt/Cloudflare) no subdomínio.
3. Definir token admin no servidor:
   ```bash
   openssl rand -hex 32
   ```
4. Salvar o valor em `.env`:
   ```env
   ADMIN_CONFIG_TOKEN=<TOKEN_GERADO>
   ```
5. Reiniciar o serviço Node para carregar o token.

### Exemplo Nginx (subdomínio dedicado)

```nginx
upstream sdr_agent_backend {
  server 127.0.0.1:3000;
  keepalive 32;
}

server {
  listen 80;
  server_name sdr-synapasea.sentiia.com.br;

  # Opcional: limite de origem/IP aqui
  # allow 10.0.0.0/8;
  # deny all;

  location / {
    proxy_pass http://sdr_agent_backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### Exemplo Traefik (Docker labels)

```yaml
services:
  app:
    image: sdr-agent:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.agent-config.rule=Host(`sdr-synapasea.sentiia.com.br`)"
      - "traefik.http.routers.agent-config.entrypoints=websecure"
      - "traefik.http.routers.agent-config.tls=true"
      - "traefik.http.services.agent-config.loadbalancer.server.port=3000"
```

### Exemplo de chamada da API com token

```bash
curl -X PUT https://sdr-synapasea.sentiia.com.br/api/admin/agent-config   -H "Content-Type: application/json"   -H "x-admin-token: SEU_TOKEN"   -d '{
    "autoReplyEnabled": true,
    "companyName": "Minha Empresa",
    "objective": "Qualificar e converter leads para reunião",
    "tone": "consultivo e direto",
    "language": "português do Brasil",
    "maxReplyChars": 420
  }'
```

---

## 🐳 Docker Deployment

### Option 1: Tudo com Docker

```bash
# Iniciar todos os containers (PostgreSQL, MongoDB, Redis, App)
docker-compose up

# Em background
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Parar
docker-compose down
```

### Option 2: Apenas bancos de dados

```bash
# Iniciar apenas PostgreSQL, MongoDB, Redis
docker-compose up postgres mongodb redis

# Depois rodar app localmente
npm run dev
```

### Variáveis para Docker

Edite `docker-compose.yml`:

```yaml
environment:
  DATABASE_URL: postgresql://user:password@postgres:5432/agent
  MONGODB_URL: mongodb://root:password@mongodb:27017/agent
  REDIS_URL: redis://redis:6379
```

---

## ⚙️ Configuração Produção

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:strongpass@prod-host:5432/agent
MONGODB_URL=mongodb://root:strongpass@prod-host:27017/agent

# Redis (com SSL)
REDIS_URL=redis://:password@prod-redis:6379

# APIs
OPENAI_API_KEY=sk-...
CHATWOOT_API_TOKEN=token...
UAZAPI_KEY=key...

# Slack (opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Server
PORT=3000
NODE_ENV=production
LOG_LEVEL=warn

# Performance
FOLLOW_UP_DELAY_HOURS=24
COLD_STORAGE_DAYS=7
MIN_INTENT_SCORE=0.7
```

### PM2 Configuration

Crie `pm2.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'sdr-agent',
      script: 'dist/src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
```

Start com PM2:

```bash
npm install -g pm2
pm2 start pm2.config.js
pm2 save
pm2 startup
```

### Nginx Reverse Proxy

```nginx
upstream agent {
  server localhost:3000;
  keepalive 64;
}

server {
  listen 80;
  server_name api.agent.com;

  location / {
    proxy_pass http://agent;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  # Health check
  location /health {
    access_log off;
    proxy_pass http://agent;
  }
}
```

---

## 📊 Monitoramento

### Health Check

```bash
curl http://localhost:3000/health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2024-01-27T10:00:00Z"
}
```

### Logs

```bash
# Development
tail -f logs/combined.log

# Errors only
tail -f logs/error.log

# Docker
docker-compose logs -f app
```

### Métricas

- Número de leads ativos
- Score médio
- Taxa de conversão
- Tempo de resposta da IA

Acessar via `/api/leads` e `/api/leads/hot`

---

## 🔧 Troubleshooting

### Erro: "Database connection failed"

```bash
# Verificar PostgreSQL
psql -h localhost -U agent -d agent

# Verificar DATABASE_URL no .env
echo $DATABASE_URL
```

### Erro: "MongoDB connection failed"

```bash
# Verificar MongoDB
mongosh --eval "db.adminCommand('ping')"

# Verificar MONGODB_URL
echo $MONGODB_URL
```

### Erro: "OpenAI API Error"

- Verificar se `OPENAI_API_KEY` está correto
- Verificar se a chave tem limite de chamadas
- Verificar modelo: `OPENAI_MODEL=gpt-5-nano`

### Erro: "Port 3000 already in use"

```bash
# Liberar porta
lsof -i :3000
kill -9 <PID>

# Ou usar porta diferente
PORT=3001 npm run dev
```

### Erro: "Prisma migrations failed"

```bash
# Reset banco (⚠️ deleta dados!)
npx prisma migrate reset

# Ou apenas rodar migrations
npx prisma migrate deploy

# Ver status
npx prisma migrate status
```

### Build TypeScript failing

```bash
# Limpar dist
rm -rf dist

# Rebuild
npm run build

# Check tipos
npm run type-check
```

---

## 📈 Performance Tips

1. **Database Indexing**: Verifique que todos os índices estão criados
2. **Redis Caching**: Use para cache de labels e classificações
3. **Connection Pooling**: PostgreSQL já otimizado
4. **Batch Operations**: Processar múltiplos leads em batch
5. **Log Level**: Use `warn` em produção

---

## 🚀 Deploy Checklist

- [ ] .env com credenciais produção
- [ ] Database migrado
- [ ] Build TypeScript compilado
- [ ] Redis conectado
- [ ] OpenAI API key válida
- [ ] Chatwoot URL e token corretos
- [ ] UAZAPI key válida
- [ ] Webhook URLs apontando para produção
- [ ] PM2 ou systemd configurado
- [ ] Reverse proxy (Nginx) configurado
- [ ] SSL/HTTPS ativo
- [ ] Backups do banco configurados
- [ ] Monitoring e alertas ativados

---

**Versão**: 2.0.0  
**Last Updated**: 2024
