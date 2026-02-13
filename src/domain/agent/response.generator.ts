import OpenAI from 'openai';
import { logger } from '../../shared/utils/logger';

export type LeadIntent = 'BUY_NOW' | 'SUPPORT' | 'TRIAGE';

export interface AgentPromptConfig {
  companyName: string;
  objective: string;
  tone: string;
  language: string;
  maxReplyChars: number;
  businessNiche: string;
  salesType: string;
  primaryCTA: string;
  qualificationQuestions: string[];
  customPrompt: string;
  disallowedTerms: string[];
  fallbackMessage: string;
  emojisEnabled: boolean;
}

export interface GenerateReplyInput {
  leadName: string;
  incomingMessage: string;
  intent: LeadIntent;
  score: number;
  conversationStage?: string | null;
}

export class ResponseGenerator {
  private openai: OpenAI;

  constructor(
    apiKey: string,
    private model: string,
    private promptConfig: AgentPromptConfig
  ) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateReply(input: GenerateReplyInput): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        temperature: 0.5,
        max_tokens: 260,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: JSON.stringify({
              leadName: input.leadName,
              incomingMessage: input.incomingMessage,
              intent: input.intent,
              score: input.score,
              conversationStage: input.conversationStage || 'awareness'
            })
          }
        ]
      });

      const reply = completion.choices[0]?.message?.content?.trim();
      if (!reply) {
        return this.fallbackReply(input.intent, input.leadName);
      }

      return this.limitLength(reply);
    } catch (error) {
      logger.warn('[ResponseGenerator] Falha ao gerar resposta via LLM. Usando fallback.', error);
      return this.fallbackReply(input.intent, input.leadName);
    }
  }

  private buildSystemPrompt(): string {
    return `Você é um SDR virtual da empresa ${this.promptConfig.companyName}.

Contexto do negócio:
- Nicho: ${this.promptConfig.businessNiche}
- Tipo de venda: ${this.promptConfig.salesType}
- Objetivo principal: ${this.promptConfig.objective}

Regras de estilo:
- Responda em ${this.promptConfig.language}.
- Use tom ${this.promptConfig.tone}.
- Mensagem curta e clara (máximo ${this.promptConfig.maxReplyChars} caracteres).
- Emojis ${this.promptConfig.emojisEnabled ? 'permitidos com moderação' : 'não permitidos'}.
- Faça no máximo 1 pergunta por resposta.
- Não invente preços ou promessas não informadas.
- CTA prioritário: ${this.promptConfig.primaryCTA}
- Perguntas de qualificação prioritárias: ${this.promptConfig.qualificationQuestions.join(' | ')}
- Termos proibidos: ${this.promptConfig.disallowedTerms.join(', ') || 'nenhum'}
- Se a intenção for BUY_NOW, avance para próximo passo comercial.
- Se for SUPPORT, explique de forma simples e convide para continuidade.
- Se for TRIAGE, faça uma pergunta para qualificar necessidade.
- Nunca mencione que é um modelo de IA.

Instruções customizadas:
${this.promptConfig.customPrompt || 'Sem instruções adicionais.'}

Responda apenas com o texto final da mensagem para o lead.`;
  }

  private fallbackReply(intent: LeadIntent, leadName: string): string {
    const templates: Record<LeadIntent, string> = {
      BUY_NOW: `Perfeito, ${leadName}! ${this.promptConfig.primaryCTA}`,
      SUPPORT: `${leadName}, ótima pergunta. Posso explicar de forma objetiva e te mostrar o melhor caminho para o seu caso.`,
      TRIAGE: `Obrigado pela mensagem, ${leadName}! ${this.promptConfig.qualificationQuestions[0] || 'Qual resultado você quer alcançar agora?'}`
    };

    const selected = templates[intent] || this.promptConfig.fallbackMessage;
    return this.limitLength(selected);
  }

  private limitLength(content: string): string {
    const max = this.promptConfig.maxReplyChars;
    if (content.length <= max) return content;
    return `${content.slice(0, max - 3).trim()}...`;
  }
}
