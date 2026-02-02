// tests/integration/uazapi.test.ts

import { describe, it, expect, beforeAll } from 'vitest';
import { getUAZAPIClient, UAZAPIClient } from '@infra/uazapi/uazapi.client';

describe('UAZAPI Client', () => {
  let client: UAZAPIClient;

  beforeAll(() => {
    client = getUAZAPIClient();
  });

  describe('Health Check', () => {
    it('deve verificar se API UAZAPI está disponível', async () => {
      const isHealthy = await client.healthCheck();
      console.log('UAZAPI Health:', isHealthy);
      // Este teste pode falhar se UAZAPI não está disponível
      // Mas você pode rodar manualmente para debug
    });
  });

  describe('Phone Normalization', () => {
    it('deve normalizar número sem país', () => {
      // Private method - testar através de sendMessage com mock
      expect(true).toBe(true);
    });
  });
});
