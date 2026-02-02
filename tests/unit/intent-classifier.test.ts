// tests/unit/intent-classifier.test.ts

import { describe, it, expect } from 'vitest';
import { IntentClassifier } from '@domain/intent/intent.classifier';

describe('IntentClassifier', () => {
  const classifier = new IntentClassifier('test-key', 'gpt-4o-mini');

  describe('Pattern Matching', () => {
    it('deve detectar BUY_NOW intent', async () => {
      const result = await classifier.classify('quero contratar agora');
      expect(result.intent).toBe('BUY_NOW');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('deve detectar SUPPORT intent', async () => {
      const result = await classifier.classify('como funciona?');
      expect(result.intent).toBe('SUPPORT');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('deve padrão TRIAGE para mensagem desconhecida', async () => {
      const result = await classifier.classify('oi');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('generateHandoffSummary', () => {
    it('deve gerar summary para BUY_NOW', () => {
      const summary = classifier.generateHandoffSummary(
        'BUY_NOW',
        'Quero contratar agora',
        'João'
      );
      expect(summary).toContain('🔥');
      expect(summary).toContain('João');
    });
  });
});
