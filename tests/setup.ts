// tests/setup.ts

import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  // Configuração antes dos testes
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Limpeza após testes
});
