export function buildAgentConfigPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Synapsea • Agent Config Dashboard</title>
  <style>
    :root {
      --bg: #0A192F;
      --cyan: #00F2FF;
      --purple: #7000FF;
      --text: #E6F1FF;
      --muted: #89a6c7;
      --glass: rgba(255,255,255,0.06);
      --line: rgba(0, 242, 255, 0.35);
      --ok: #1ee7a3;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--text);
      font-family: Inter, Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: radial-gradient(circle at 20% 10%, rgba(112,0,255,0.22), transparent 40%), var(--bg);
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    h1 { margin: 0; font-size: 1.7rem; }
    .sub { color: var(--muted); margin: 6px 0 18px; }

    .topology {
      position: relative;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
      overflow: hidden;
      margin-bottom: 18px;
      backdrop-filter: blur(10px);
    }
    .topology svg { width: 100%; height: 220px; display: block; }
    .pulse-line {
      stroke: url(#synapse);
      stroke-width: 3;
      fill: none;
      stroke-dasharray: 12 10;
      animation: flow 3s linear infinite;
      filter: drop-shadow(0 0 6px rgba(0,242,255,.7));
    }
    .node {
      position: absolute;
      min-width: 180px;
      padding: 10px 12px;
      background: var(--glass);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 14px;
      backdrop-filter: blur(10px);
      box-shadow: inset 0 0 24px rgba(255,255,255,0.04);
      font-size: 0.87rem;
    }
    .node small { color: var(--muted); display:block; margin-top: 2px; }
    .n1 { left: 20px; top: 72px; }
    .n2 { right: 20px; top: 30px; }
    .n3 { right: 20px; bottom: 30px; }
    .core {
      position: absolute;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: 96px; height: 96px;
      border-radius: 50%;
      display: grid; place-items: center;
      color: #fff;
      background: radial-gradient(circle, rgba(0,242,255,.65) 0%, rgba(112,0,255,.55) 45%, rgba(112,0,255,.08) 80%);
      box-shadow: 0 0 30px rgba(0,242,255,.7), inset 0 0 26px rgba(255,255,255,.25);
      animation: pulse 1.8s ease-in-out infinite;
      font-weight: 700;
      font-size: .8rem;
      text-align: center;
      line-height: 1.2;
    }

    .grid { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0,1fr)); }
    .card {
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 16px;
      background: var(--glass);
      box-shadow: inset 0 0 24px rgba(255,255,255,.04);
      padding: 14px;
      backdrop-filter: blur(10px);
    }
    .card h3 { margin: 0 0 6px; font-size: 1rem; }
    .hint { color: var(--muted); font-size: .85rem; margin-bottom: 8px; }
    label { display:block; margin-top: 10px; font-size: .9rem; }
    .badge { font-size: .74rem; margin-left: 6px; padding: 2px 7px; border-radius: 999px; }
    .required { background: rgba(255,87,87,.2); color: #ffafaf; }
    .optional { background: rgba(0,242,255,.18); color: #a8f8ff; }

    input, textarea, select {
      width: 100%;
      margin-top: 6px;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,.16);
      background: rgba(10,25,47,.7);
      color: var(--text);
      outline: none;
    }
    textarea { min-height: 90px; resize: vertical; }
    .row { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0,1fr)); }

    .actions { display:flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
    button {
      border: 1px solid rgba(0,242,255,.4);
      background: rgba(0,242,255,.08);
      color: #dffcff;
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      transition: .2s ease;
    }
    button:hover {
      background: rgba(0,242,255,.2);
      box-shadow: 0 0 20px rgba(0,242,255,.35);
      transform: translateY(-1px);
    }

    .status { margin-top: 10px; color: var(--muted); }
    .ok-dot {
      width: 10px; height: 10px; border-radius: 50%;
      display:inline-block; margin-right: 8px; background: var(--ok);
      box-shadow: 0 0 12px var(--ok);
      animation: blink 1.4s ease-in-out infinite;
    }

    @keyframes flow { to { stroke-dashoffset: -44; } }
    @keyframes pulse { 0%,100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.08); } }
    @keyframes blink { 0%,100% { opacity: .8; } 50% { opacity: 1; } }

    @media (max-width: 900px) {
      .grid, .row { grid-template-columns: 1fr; }
      .topology svg { height: 180px; }
      .n1,.n2,.n3 { position: static; margin: 8px; }
      .core { position: static; transform: none; margin: 12px auto; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Synapsea • Dashboard de Configuração do Agente</h1>
    <p class="sub">Subdomínio alvo: <strong>sdr-synapasea.sentiia.com.br</strong> • controle total por nicho, tipo de venda, prompt e automações.</p>

    <section class="topology">
      <svg viewBox="0 0 1200 220" preserveAspectRatio="none">
        <defs>
          <linearGradient id="synapse" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#00F2FF" />
            <stop offset="100%" stop-color="#7000FF" />
          </linearGradient>
        </defs>
        <path class="pulse-line" d="M160,110 C300,110 330,110 560,110" />
        <path class="pulse-line" d="M640,110 C830,110 860,55 1020,55" />
        <path class="pulse-line" d="M640,110 C830,110 860,165 1020,165" />
      </svg>
      <div class="node n1">Entrada de Dados <small>Webhook / Meta API / Forms</small></div>
      <div class="core">AI<br/>Agent</div>
      <div class="node n2">Cérebro da IA <small>Node.js / RAG / Regras</small></div>
      <div class="node n3">Saída <small>Chatwoot / Connect / WhatsApp</small></div>
    </section>

    <div class="grid">
      <section class="card">
        <h3>Template de Negócio & Venda</h3>
        <p class="hint">Define baseline por nicho e estratégia comercial.</p>

        <label>Template de nicho <span class="badge required">obrigatório</span>
          <select id="businessTemplate">
            <option value="saas_b2b">SaaS B2B</option>
            <option value="clinicas">Clínicas / Saúde</option>
            <option value="educacao">Educação / Cursos</option>
            <option value="imobiliario">Imobiliário</option>
            <option value="servicos_profissionais">Serviços Profissionais</option>
          </select>
        </label>

        <label>Nicho de negócio <span class="badge required">obrigatório</span>
          <input id="businessNiche" placeholder="Ex: CRM para clínicas" />
        </label>

        <label>Tipo de venda <span class="badge required">obrigatório</span>
          <select id="salesType">
            <option value="consultiva">Consultiva</option>
            <option value="transacional">Transacional</option>
            <option value="enterprise">Enterprise</option>
            <option value="trial">Trial / Freemium</option>
          </select>
        </label>

        <label>CTA principal <span class="badge required">obrigatório</span>
          <input id="primaryCTA" placeholder="Ex: Agendar reunião de 20 min" />
        </label>
      </section>

      <section class="card">
        <h3>Personalidade & Prompt</h3>
        <p class="hint">Configura o tom e as instruções do agente.</p>

        <label>Nome da empresa <span class="badge required">obrigatório</span>
          <input id="companyName" />
        </label>

        <label>Objetivo do agente <span class="badge required">obrigatório</span>
          <textarea id="objective"></textarea>
        </label>

        <div class="row">
          <label>Tom de voz <span class="badge required">obrigatório</span>
            <input id="tone" placeholder="consultivo e direto" />
          </label>
          <label>Idioma <span class="badge required">obrigatório</span>
            <input id="language" placeholder="português do Brasil" />
          </label>
        </div>

        <div class="row">
          <label>Tamanho máximo da resposta <span class="badge required">obrigatório</span>
            <input id="maxReplyChars" type="number" min="120" max="1000" />
          </label>
          <label>Mensagem fallback <span class="badge optional">opcional</span>
            <input id="fallbackMessage" placeholder="Mensagem usada se IA falhar" />
          </label>
        </div>

        <label>Prompt customizado <span class="badge optional">opcional</span>
          <textarea id="customPrompt" placeholder="Regras extras do seu negócio..."></textarea>
        </label>
      </section>

      <section class="card">
        <h3>Qualificação & Compliance</h3>
        <p class="hint">Questões-chave e restrições de linguagem.</p>

        <label>Perguntas de qualificação (1 por linha) <span class="badge required">obrigatório</span>
          <textarea id="qualificationQuestions"></textarea>
        </label>

        <label>Termos proibidos (1 por linha) <span class="badge optional">opcional</span>
          <textarea id="disallowedTerms" placeholder="desconto garantido\nresultado garantido"></textarea>
        </label>
      </section>

      <section class="card">
        <h3>Ativações, Integrações e Segurança</h3>
        <p class="hint"><span class="ok-dot"></span>Pontos ativos brilham no dashboard.</p>

        <label><input id="autoReplyEnabled" type="checkbox" /> Resposta automática habilitada <span class="badge required">obrigatório</span></label>
        <label><input id="emojisEnabled" type="checkbox" /> Permitir emojis <span class="badge optional">opcional</span></label>
        <label><input id="handoffEnabled" type="checkbox" /> Handoff para humano (quando necessário) <span class="badge optional">opcional</span></label>
        <label><input id="sendToChatwoot" type="checkbox" /> Sincronizar no Chatwoot <span class="badge optional">opcional</span></label>
        <label><input id="sendToSlack" type="checkbox" /> Notificar Slack <span class="badge optional">opcional</span></label>

        <label>Token admin (não salvar no navegador em máquinas compartilhadas)
          <input id="adminToken" type="password" placeholder="Cole o ADMIN_CONFIG_TOKEN" />
        </label>

        <div class="actions">
          <button id="applyTemplateBtn">Aplicar template selecionado</button>
          <button id="loadBtn">Carregar configuração</button>
          <button id="saveBtn">Salvar configuração</button>
        </div>

        <div class="status" id="status">Pronto para configurar.</div>
      </section>
    </div>
  </div>

  <script>
    const templates = {
      saas_b2b: {
        businessNiche: 'SaaS B2B',
        salesType: 'consultiva',
        primaryCTA: 'Posso te mostrar em 20 minutos como isso se aplica ao seu time?',
        tone: 'consultivo, objetivo e executivo',
        objective: 'Qualificar MQL para reunião comercial e proposta.',
        qualificationQuestions: [
          'Qual meta de crescimento você precisa bater neste trimestre?',
          'Qual stack você usa hoje?',
          'Quem aprova esse tipo de contratação?'
        ]
      },
      clinicas: {
        businessNiche: 'Clínicas e Saúde',
        salesType: 'consultiva',
        primaryCTA: 'Posso te mostrar um plano para aumentar agendamentos com previsibilidade?',
        tone: 'acolhedor, claro e profissional',
        objective: 'Converter interessados em reunião de diagnóstico.',
        qualificationQuestions: [
          'Qual especialidade principal da clínica?',
          'Quantos agendamentos por mês você deseja atingir?',
          'Você já usa CRM ou prontuário integrado?'
        ]
      },
      educacao: {
        businessNiche: 'Educação e Infoprodutos',
        salesType: 'transacional',
        primaryCTA: 'Quer que eu te mostre a trilha ideal para seu nível?',
        tone: 'didático e motivador',
        objective: 'Converter leads em matrícula/venda com clareza de oferta.',
        qualificationQuestions: [
          'Qual seu objetivo principal de aprendizado?',
          'Qual sua disponibilidade semanal?',
          'Você busca formação completa ou módulo específico?'
        ]
      },
      imobiliario: {
        businessNiche: 'Mercado Imobiliário',
        salesType: 'consultiva',
        primaryCTA: 'Posso te apresentar as opções que fazem mais sentido para seu perfil?',
        tone: 'consultivo e confiável',
        objective: 'Qualificar intenção de compra e agendar visita.',
        qualificationQuestions: [
          'Qual faixa de investimento você busca?',
          'Região de preferência?',
          'Compra para morar ou investir?'
        ]
      },
      servicos_profissionais: {
        businessNiche: 'Serviços Profissionais',
        salesType: 'enterprise',
        primaryCTA: 'Quer que eu estruture uma proposta inicial para seu contexto?',
        tone: 'estratégico e orientado a resultado',
        objective: 'Diagnosticar cenário e conduzir para proposta consultiva.',
        qualificationQuestions: [
          'Qual problema crítico você quer resolver?',
          'Existe urgência para implementação?',
          'Qual time participará da decisão?'
        ]
      }
    };

    const fieldIds = [
      'businessNiche','salesType','primaryCTA','companyName','objective','tone','language','maxReplyChars',
      'fallbackMessage','customPrompt','qualificationQuestions','disallowedTerms','autoReplyEnabled',
      'emojisEnabled','handoffEnabled','sendToChatwoot','sendToSlack'
    ];

    function getTokenHeaders() {
      const token = document.getElementById('adminToken').value.trim();
      return token ? { 'x-admin-token': token } : {};
    }

    function setStatus(text) {
      document.getElementById('status').textContent = text;
    }

    function textareaToList(value) {
      return value.split('\n').map(v => v.trim()).filter(Boolean);
    }

    function listToTextarea(list) {
      return Array.isArray(list) ? list.join('\n') : '';
    }

    function applyData(data) {
      document.getElementById('autoReplyEnabled').checked = !!data.autoReplyEnabled;
      document.getElementById('emojisEnabled').checked = !!data.emojisEnabled;
      document.getElementById('handoffEnabled').checked = !!data.handoffEnabled;
      document.getElementById('sendToChatwoot').checked = !!data.sendToChatwoot;
      document.getElementById('sendToSlack').checked = !!data.sendToSlack;
      document.getElementById('companyName').value = data.companyName || '';
      document.getElementById('objective').value = data.objective || '';
      document.getElementById('tone').value = data.tone || '';
      document.getElementById('language').value = data.language || '';
      document.getElementById('maxReplyChars').value = data.maxReplyChars || 420;
      document.getElementById('businessNiche').value = data.businessNiche || '';
      document.getElementById('salesType').value = data.salesType || 'consultiva';
      document.getElementById('primaryCTA').value = data.primaryCTA || '';
      document.getElementById('fallbackMessage').value = data.fallbackMessage || '';
      document.getElementById('customPrompt').value = data.customPrompt || '';
      document.getElementById('qualificationQuestions').value = listToTextarea(data.qualificationQuestions);
      document.getElementById('disallowedTerms').value = listToTextarea(data.disallowedTerms);
    }

    function getPayload() {
      return {
        autoReplyEnabled: document.getElementById('autoReplyEnabled').checked,
        emojisEnabled: document.getElementById('emojisEnabled').checked,
        handoffEnabled: document.getElementById('handoffEnabled').checked,
        sendToChatwoot: document.getElementById('sendToChatwoot').checked,
        sendToSlack: document.getElementById('sendToSlack').checked,
        companyName: document.getElementById('companyName').value,
        objective: document.getElementById('objective').value,
        tone: document.getElementById('tone').value,
        language: document.getElementById('language').value,
        maxReplyChars: Number(document.getElementById('maxReplyChars').value),
        businessNiche: document.getElementById('businessNiche').value,
        salesType: document.getElementById('salesType').value,
        primaryCTA: document.getElementById('primaryCTA').value,
        fallbackMessage: document.getElementById('fallbackMessage').value,
        customPrompt: document.getElementById('customPrompt').value,
        qualificationQuestions: textareaToList(document.getElementById('qualificationQuestions').value),
        disallowedTerms: textareaToList(document.getElementById('disallowedTerms').value)
      };
    }

    async function loadConfig() {
      const res = await fetch('/api/admin/agent-config', { headers: getTokenHeaders() });
      if (!res.ok) throw new Error('Falha ao carregar configuração');
      const data = await res.json();
      applyData(data);
      setStatus('Configuração carregada com sucesso.');
    }

    async function saveConfig() {
      const res = await fetch('/api/admin/agent-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getTokenHeaders() },
        body: JSON.stringify(getPayload())
      });
      if (!res.ok) throw new Error('Falha ao salvar configuração');
      const data = await res.json();
      applyData(data);
      setStatus('✅ Configuração salva com sucesso.');
    }

    function applyTemplate() {
      const id = document.getElementById('businessTemplate').value;
      const t = templates[id];
      if (!t) return;
      document.getElementById('businessNiche').value = t.businessNiche;
      document.getElementById('salesType').value = t.salesType;
      document.getElementById('primaryCTA').value = t.primaryCTA;
      document.getElementById('tone').value = t.tone;
      document.getElementById('objective').value = t.objective;
      document.getElementById('qualificationQuestions').value = t.qualificationQuestions.join('\n');
      setStatus('Template aplicado. Revise e clique em salvar.');
    }

    document.getElementById('loadBtn').addEventListener('click', () => loadConfig().catch(() => setStatus('❌ Erro ao carregar. Verifique token/permissão.')));
    document.getElementById('saveBtn').addEventListener('click', () => saveConfig().catch(() => setStatus('❌ Erro ao salvar. Verifique token/permissão.')));
    document.getElementById('applyTemplateBtn').addEventListener('click', applyTemplate);

    applyTemplate();
  </script>
</body>
</html>`;
}
