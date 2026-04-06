export function buildSynapseaAppPage() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Synapsea App</title>
  <style>
    :root { --bg:#070a1a; --card:#121935; --text:#eaf1ff; --muted:#9aa7cf; --accent:#7b61ff; --accent2:#1ec8ff; }
    body { margin:0; font-family:Inter,system-ui,sans-serif; background: radial-gradient(circle at top, #151f4b 0%, var(--bg) 55%); color:var(--text); }
    .container { max-width:1100px; margin:0 auto; padding:24px; }
    .hero { display:flex; justify-content:space-between; align-items:end; gap:16px; margin-bottom:20px; }
    h1 { margin:0; font-size:2rem; }
    .subtitle { color:var(--muted); margin-top:4px; }
    .grid { display:grid; gap:14px; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); }
    .card { background:linear-gradient(145deg,#141d41,#0f1633); border:1px solid #273265; border-radius:16px; padding:16px; box-shadow:0 8px 28px rgba(0,0,0,.32); }
    .kpi { font-size:1.5rem; font-weight:700; }
    .label { color:var(--muted); font-size:.9rem; }
    table { width:100%; border-collapse: collapse; }
    th,td { padding:10px; border-bottom:1px solid #2e3c76; text-align:left; }
    .status-online { color:#4cff98; } .status-offline { color:#ff9a76; }
    textarea { width:100%; min-height:110px; background:#0b122d; border:1px solid #33458e; color:var(--text); border-radius:10px; padding:10px; }
    button { border:none; padding:10px 14px; background:linear-gradient(90deg,var(--accent),var(--accent2)); color:white; border-radius:10px; font-weight:700; cursor:pointer; }
    pre { white-space:pre-wrap; background:#090f24; border:1px solid #29386d; padding:12px; border-radius:10px; max-height:320px; overflow:auto; }
  </style>
</head>
<body>
  <div class="container">
    <section class="hero">
      <div>
        <h1>Synapsea Growth Command</h1>
        <div class="subtitle">Aplicativo com usuários, agente de IA para relatórios e dashboard benchmark global.</div>
      </div>
    </section>

    <section class="grid" id="kpis"></section>

    <section class="card" style="margin-top:14px;">
      <h3>Usuários da operação</h3>
      <table><thead><tr><th>Nome</th><th>Função</th><th>Empresa</th><th>Status</th></tr></thead><tbody id="users"></tbody></table>
    </section>

    <section class="card" style="margin-top:14px;">
      <h3>Benchmark: maiores empresas do mundo</h3>
      <table><thead><tr><th>Empresa</th><th>Crescimento</th><th>Eficiência</th><th>Adoção de IA</th></tr></thead><tbody id="companies"></tbody></table>
    </section>

    <section class="card" style="margin-top:14px;">
      <h3>Agente de IA - Relatórios</h3>
      <textarea id="prompt">Gere um relatório executivo para escalar a performance comercial da Synapsea em 90 dias.</textarea>
      <div style="margin-top:10px;"><button id="run">Gerar relatório</button></div>
      <pre id="report">Aguardando geração de relatório...</pre>
    </section>
  </div>

<script>
async function loadData(){
  const [usersRes, dashRes] = await Promise.all([fetch('/api/app/users'), fetch('/api/app/dashboard')]);
  const usersData = await usersRes.json();
  const dashData = await dashRes.json();

  var kpiLabels = {
    totalLeads: 'Leads totais',
    hotLeads: 'Leads quentes',
    avgLeadScore: 'Score médio',
    inboundLast24h: 'Entradas 24h',
    benchmarkCompanies: 'Empresas benchmark',
    benchmarkAverageEfficiency: 'Eficiência média global',
    benchmarkAiAdoption: 'Adoção IA média',
    recommendedFocus: 'Foco recomendado'
  };

  document.getElementById('kpis').innerHTML = Object.entries(dashData.kpis).map(function(entry){
    var key = entry[0];
    var label = kpiLabels[key] || key;
    return '<div class="card"><div class="label">' + label + '</div><div class="kpi">' + entry[1] + '</div></div>';
  }).join('');

  document.getElementById('users').innerHTML = usersData.users.map(function(u){
    return '<tr><td>' + u.name + '</td><td>' + u.role + '</td><td>' + u.company + '</td><td class="status-' + u.status + '">' + u.status + '</td></tr>';
  }).join('');

  document.getElementById('companies').innerHTML = dashData.companies.map(function(c){
    return '<tr><td>' + c.company + '</td><td>' + c.growth + '</td><td>' + c.efficiency + '%</td><td>' + c.aiAdoption + '%</td></tr>';
  }).join('');
}

document.getElementById('run').onclick = async function () {
  const prompt = document.getElementById('prompt').value;
  const res = await fetch('/api/app/reports', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({prompt: prompt})});
  const data = await res.json();
  document.getElementById('report').textContent = data.report;
};

loadData();
</script>
</body>
</html>`;
}
