// src/domain/intent/intent.classifier.ts

import OpenAI from 'openai';
import { logger } from '../../shared/utils/logger';
import { retryAsync } from '../../shared/utils/retry';

type IntentType = 'BUY_NOW' | 'SUPPORT' | 'TRIAGE';

export interface ClassificationResult {
  intent: IntentType;
  confidence: number;
  reasoning: string;
  triggeredKeywords?: string[];
}

const INTENT_KEYWORDS = {
  BUY_NOW: [
    'quero contratar',
    'qual o preço',
    'gostaria de fechar',
    'quer começar agora',
    'como posso comprar',
    'aceito a proposta',
    'vamos contratar',
    'fazer agora',
    'começar hoje',
    'contrate já',
    'valor do',
    'custo',
    'investimento'
  ],
  SUPPORT: [
    'não entendo',
    'como usar',
    'como funciona',
    'qual o benefício',
    'quais as vantagens',
    'diferença entre',
    'pode explicar',
    'dúvida',
    'é possível',
    'funciona para'
  ]
};

export class IntentClassifier {
  private openai?: OpenAI;

  constructor(apiKey: string, private model: string = 'gpt-4o-mini') {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async classify(message: string): Promise<ClassificationResult> {
    const normalizedMsg = message.toLowerCase().trim();

    // Passo 1: Pattern matching rápido
    const patternResult = this.matchPatterns(normalizedMsg);
    if (patternResult.confidence > 0.8) {
      logger.debug(`[IntentClassifier] Pattern match: ${patternResult.intent}`);
      return patternResult;
    }

    if (!this.openai) {
      logger.warn('[IntentClassifier] OpenAI não configurado, usando TRIAGE fallback');
      return {
        intent: 'TRIAGE',
        confidence: 0.4,
        reasoning: 'OpenAI API key ausente, usando fallback'
      };
    }

    // Passo 2: LLM classification (fallback)
    try {
      return await retryAsync(
        () => this.classifyWithLLM(message),
        { maxAttempts: 2, delayMs: 500 }
      );
    } catch (error) {
      logger.warn('[IntentClassifier] LLM error, using TRIAGE fallback:', error);
      return {
        intent: 'TRIAGE',
        confidence: 0.5,
        reasoning: 'LLM classification failed, using fallback'
      };
    }
  }

  private matchPatterns(message: string): ClassificationResult {
    // Check BUY_NOW
    for (const keyword of INTENT_KEYWORDS.BUY_NOW) {
      if (message.includes(keyword)) {
        return {
          intent: 'BUY_NOW',
          confidence: 0.95,
          reasoning: `Detected keyword: "${keyword}"`,
          triggeredKeywords: [keyword]
        };
      }
    }

    // Check SUPPORT
    for (const keyword of INTENT_KEYWORDS.SUPPORT) {
      if (message.includes(keyword)) {
        return {
          intent: 'SUPPORT',
          confidence: 0.85,
          reasoning: `Detected support keyword: "${keyword}"`,
          triggeredKeywords: [keyword]
        };
      }
    }

    // Default: TRIAGE
    return {
      intent: 'TRIAGE',
      confidence: 0.3,
      reasoning: 'No pattern match'
    };
  }

  private async classifyWithLLM(message: string): Promise<ClassificationResult> {
    if (!this.openai) {
      throw new Error('OpenAI client não configurado');
    }

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `Você é um classificador de intenção de lead para uma plataforma de consultoria.

Classifique a mensagem do usuário em uma destas categorias:
- BUY_NOW: Usuário quer comprar/contratar agora
- SUPPORT: Usuário quer entender melhor, faz perguntas
- TRIAGE: Qualquer outra coisa

Responda APENAS em JSON:
{
  "intent": "BUY_NOW" | "SUPPORT" | "TRIAGE",
  "confidence": 0.0-1.0,
  "reasoning": "Explicação breve"
}`
        },
        { role: 'user', content: message }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const parsed = JSON.parse(responseText);

    return {
      intent: (parsed.intent || 'TRIAGE') as IntentType,
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || 'LLM classification'
    };
  }

  generateHandoffSummary(
    intent: IntentType,
    message: string,
    leadName: string
  ): string {
    const summaries: Record<IntentType, string> = {
      BUY_NOW: `🔥 *${leadName} quer contratar agora!*\n"${message}"\n⏰ URGENTE`,
      SUPPORT: `❓ ${leadName} tem dúvidas\n"${message}"\n💡 Pode ser oportunidade`,
      TRIAGE: `📋 Triagem em andamento\n"${message}"`
    };

    return summaries[intent] || summaries.TRIAGE;
  }
}
