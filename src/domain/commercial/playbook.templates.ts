export type QualificationFramework = 'BANT' | 'MEDDICC' | 'SPICED';

export interface NichePlaybookTemplate {
  niche: string;
  framework: QualificationFramework;
  stages: string[];
  discoveryQuestions: string[];
  objectionPlaybook: Record<string, string>;
  followUpCadenceHours: number[];
}

export const PLAYBOOK_TEMPLATES: NichePlaybookTemplate[] = [
  {
    niche: 'saude',
    framework: 'SPICED',
    stages: ['triage', 'qualification', 'clinical-fit', 'proposal', 'closing'],
    discoveryQuestions: [
      'Qual o principal gargalo no atendimento hoje?',
      'Qual volume mensal de pacientes e canais de entrada?',
      'Quais integrações com prontuário/CRM são mandatórias?'
    ],
    objectionPlaybook: {
      preco: 'Mostrar ROI por redução de no-show e aumento de conversão.',
      tempo: 'Propor rollout em ondas com quick wins na primeira semana.'
    },
    followUpCadenceHours: [2, 24, 72]
  },
  {
    niche: 'juridico',
    framework: 'BANT',
    stages: ['triage', 'qualification', 'case-fit', 'proposal', 'closing'],
    discoveryQuestions: [
      'Qual tipo de caso gera mais receita para o escritório?',
      'Como o time capta e prioriza novos casos hoje?',
      'Existe SLA de retorno para novos leads?'
    ],
    objectionPlaybook: {
      preco: 'Comparar CAC atual com o CAC otimizado pelo funil automatizado.',
      risco: 'Oferecer piloto com escopo controlado e métricas de sucesso.'
    },
    followUpCadenceHours: [4, 24, 48, 96]
  },
  {
    niche: 'saas',
    framework: 'MEDDICC',
    stages: ['triage', 'discovery', 'qualification', 'demo', 'proposal', 'closing'],
    discoveryQuestions: [
      'Qual MRR meta para os próximos 6 meses?',
      'Quem é o champion e quem aprova orçamento?',
      'Qual stack atual de CRM, onboarding e suporte?'
    ],
    objectionPlaybook: {
      integracao: 'Mapear plano de integração com milestones e responsáveis.',
      migracao: 'Definir migração assistida com risco zero de downtime.'
    },
    followUpCadenceHours: [1, 24, 48, 72]
  },
  {
    niche: 'ecommerce',
    framework: 'SPICED',
    stages: ['triage', 'qualification', 'offer-fit', 'proposal', 'closing'],
    discoveryQuestions: [
      'Qual ticket médio e taxa de abandono atuais?',
      'Qual canal tem maior ROI hoje?',
      'Como vocês tratam carrinho abandonado e recompra?'
    ],
    objectionPlaybook: {
      sazonalidade: 'Construir campanha por janela promocional com automação.',
      margem: 'Ajustar ofertas por cohort para proteger margem.'
    },
    followUpCadenceHours: [1, 12, 24, 72]
  },
  {
    niche: 'educacao',
    framework: 'BANT',
    stages: ['triage', 'qualification', 'course-fit', 'enrollment', 'closing'],
    discoveryQuestions: [
      'Qual curso/produto concentra maior conversão?',
      'Qual janela de matrícula mais importante?',
      'Como vocês tratam leads indecisos?'
    ],
    objectionPlaybook: {
      prazo: 'Oferecer trilha com marcos e lembretes automatizados.',
      valor: 'Evidenciar empregabilidade/resultados de alunos.'
    },
    followUpCadenceHours: [2, 24, 48, 120]
  },
  {
    niche: 'imobiliario',
    framework: 'SPICED',
    stages: ['triage', 'qualification', 'property-fit', 'visit', 'proposal', 'closing'],
    discoveryQuestions: [
      'Compra para morar ou investir?',
      'Faixa de orçamento e prazo de decisão?',
      'Preferências de região e metragem?'
    ],
    objectionPlaybook: {
      localizacao: 'Apresentar comparativo de bairros com dados objetivos.',
      financiamento: 'Conduzir pré-análise com parceiro financeiro integrado.'
    },
    followUpCadenceHours: [2, 24, 72, 168]
  }
];
