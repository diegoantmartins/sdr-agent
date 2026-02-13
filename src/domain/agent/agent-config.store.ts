import { promises as fs } from 'fs';
import path from 'path';

export interface AgentRuntimeConfig {
  // Core
  autoReplyEnabled: boolean;
  companyName: string;
  objective: string;
  tone: string;
  language: string;
  maxReplyChars: number;

  // Negócio e venda
  businessNiche: string;
  salesType: 'consultiva' | 'transacional' | 'enterprise' | 'trial';
  primaryCTA: string;
  qualificationQuestions: string[];

  // Comportamento
  customPrompt: string;
  fallbackMessage: string;
  emojisEnabled: boolean;
  handoffEnabled: boolean;

  // Integrações (opcionais)
  sendToChatwoot: boolean;
  sendToSlack: boolean;

  // Compliance
  disallowedTerms: string[];
}

export class AgentConfigStore {
  private cache: AgentRuntimeConfig;

  constructor(
    private configPath: string,
    defaults: AgentRuntimeConfig
  ) {
    this.cache = defaults;
  }

  async init(): Promise<void> {
    await this.ensureDirectory();

    try {
      const raw = await fs.readFile(this.configPath, 'utf-8');
      const persisted = JSON.parse(raw) as Partial<AgentRuntimeConfig>;
      this.cache = this.mergeAndNormalize(persisted);
    } catch {
      await this.persist(this.cache);
    }
  }

  getConfig(): AgentRuntimeConfig {
    return this.cache;
  }

  async updateConfig(partial: Partial<AgentRuntimeConfig>): Promise<AgentRuntimeConfig> {
    this.cache = this.mergeAndNormalize(partial);
    await this.persist(this.cache);
    return this.cache;
  }

  private mergeAndNormalize(partial: Partial<AgentRuntimeConfig>): AgentRuntimeConfig {
    const merged: AgentRuntimeConfig = {
      ...this.cache,
      ...partial
    };

    const qualificationQuestions = Array.isArray(merged.qualificationQuestions)
      ? merged.qualificationQuestions.map(v => String(v).trim()).filter(Boolean)
      : [];

    const disallowedTerms = Array.isArray(merged.disallowedTerms)
      ? merged.disallowedTerms.map(v => String(v).trim()).filter(Boolean)
      : [];

    return {
      autoReplyEnabled: Boolean(merged.autoReplyEnabled),
      companyName: String(merged.companyName || 'Synapsea').trim(),
      objective: String(merged.objective || 'Qualificar leads e avançar para reunião ou proposta.').trim(),
      tone: String(merged.tone || 'consultivo e cordial').trim(),
      language: String(merged.language || 'português do Brasil').trim(),
      maxReplyChars: Math.min(1000, Math.max(120, Number(merged.maxReplyChars) || 420)),
      businessNiche: String(merged.businessNiche || 'SaaS B2B').trim(),
      salesType: this.normalizeSalesType(merged.salesType),
      primaryCTA: String(merged.primaryCTA || 'Posso te mostrar o próximo passo ideal para o seu cenário?').trim(),
      qualificationQuestions: qualificationQuestions.length > 0
        ? qualificationQuestions
        : [
            'Qual principal desafio você quer resolver agora?',
            'Qual prazo você tem para implementar?',
            'Quem participa da decisão?'
          ],
      customPrompt: String(merged.customPrompt || '').trim(),
      fallbackMessage: String(merged.fallbackMessage || 'Perfeito! Posso te ajudar com o próximo passo agora.').trim(),
      emojisEnabled: Boolean(merged.emojisEnabled),
      handoffEnabled: Boolean(merged.handoffEnabled),
      sendToChatwoot: Boolean(merged.sendToChatwoot),
      sendToSlack: Boolean(merged.sendToSlack),
      disallowedTerms
    };
  }

  private normalizeSalesType(value: AgentRuntimeConfig['salesType'] | undefined): AgentRuntimeConfig['salesType'] {
    if (value === 'consultiva' || value === 'transacional' || value === 'enterprise' || value === 'trial') {
      return value;
    }
    return 'consultiva';
  }

  private async ensureDirectory(): Promise<void> {
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
  }

  private async persist(config: AgentRuntimeConfig): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }
}
