// vitest.config.ts

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/setup.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@config': path.resolve(__dirname, './src/config'),
      '@database': path.resolve(__dirname, './src/database'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infra': path.resolve(__dirname, './src/infra'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
