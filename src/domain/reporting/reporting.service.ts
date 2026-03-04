import OpenAI from 'openai';
import { config } from '../../config/env';

export interface AppUser {
  id: string;
  name: string;
  role: 'Admin' | 'SDR' | 'Executivo(a)' | 'Operações';
  company: string;
  status: 'online' | 'offline';
}

export interface OperationalSnapshot {
  totalLeads: number;
  hotLeads: number;
  avgScore: number;
  inboundLast24h: number;
}

const BENCHMARK_COMPANIES = [
  { company: 'Amazon', growth: '+12%', efficiency: 91, aiAdoption: 94 },
  { company: 'Microsoft', growth: '+15%', efficiency: 93, aiAdoption: 96 },
  { company: 'NVIDIA', growth: '+22%', efficiency: 95, aiAdoption: 98 },
  { company: 'Apple', growth: '+10%', efficiency: 90, aiAdoption: 88 },
  { company: 'Alphabet', growth: '+14%', efficiency: 92, aiAdoption: 93 }
];

const APP_USERS: AppUser[] = [
  { id: 'u1', name: 'Ana Souza', role: 'Admin', company: 'Synapsea Brasil', status: 'online' },
  { id: 'u2', name: 'Carlos Lima', role: 'SDR', company: 'Synapsea Brasil', status: 'online' },
  { id: 'u3', name: 'Fernanda Gomes', role: 'Executivo(a)', company: 'Synapsea Brasil', status: 'offline' }
];

export class ReportingService {
  private openai?: OpenAI;

  constructor() {
    if (config.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
    }
  }

  getUsers(): AppUser[] {
    return APP_USERS;
  }

  getDashboard(snapshot?: OperationalSnapshot) {
    const avgEfficiency = Math.round(
      BENCHMARK_COMPANIES.reduce((acc, company) => acc + company.efficiency, 0) / BENCHMARK_COMPANIES.length
    );

    return {
      kpis: {
        totalLeads: snapshot?.totalLeads ?? 0,
        hotLeads: snapshot?.hotLeads ?? 0,
        avgLeadScore: snapshot?.avgScore ?? 0,
        inboundLast24h: snapshot?.inboundLast24h ?? 0,
        benchmarkCompanies: BENCHMARK_COMPANIES.length,
        benchmarkAverageEfficiency: avgEfficiency,
        benchmarkAiAdoption: '93.8%',
        recommendedFocus: 'Automação de follow-up e priorização por intenção'
      },
      companies: BENCHMARK_COMPANIES
    };
  }

  async generateExecutiveReport(prompt: string, snapshot?: OperationalSnapshot): Promise<string> {
    const cleanPrompt = prompt.trim().slice(0, 1200);
    const dashboard = this.getDashboard(snapshot);

    if (!this.openai) {
      return [
        '# Relatório Executivo Synapsea',
        '',
        `Solicitação: ${cleanPrompt}`,
        '',
        `Leads totais: ${dashboard.kpis.totalLeads} | Leads quentes: ${dashboard.kpis.hotLeads} | Média de score: ${dashboard.kpis.avgLeadScore}`,
        '',
        '## Benchmark de empresas globais',
        ...dashboard.companies.map(c => `- ${c.company}: Crescimento ${c.growth}, Eficiência ${c.efficiency}%, Adoção de IA ${c.aiAdoption}%`),
        '',
        '## Recomendações práticas',
        '- Estruturar playbook de SDR com SLA de resposta em até 5 minutos.',
        '- Priorizar leads BUY_NOW com jornada dedicada e handoff imediato.',
        '- Implantar automações de nutrição para SUPPORT com conteúdo contextual.'
      ].join('\n');
    }

    const completion = await this.openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'Você é um agente de IA executivo da Synapsea. Gere um relatório estratégico em português, com visão de negócio, comparação com líderes globais e plano de ação.'
        },
        {
          role: 'user',
          content: `Pedido: ${cleanPrompt}\n\nContexto operacional: ${JSON.stringify(snapshot || {})}\n\nDados benchmark: ${JSON.stringify(dashboard.companies)}`
        }
      ]
    });

    return completion.choices[0]?.message?.content || 'Não foi possível gerar relatório.';
  }
}

export const reportingService = new ReportingService();
