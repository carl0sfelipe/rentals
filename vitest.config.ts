import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      '**/*.spec.ts',
      '**/*.e2e-spec.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**'
    ],
    coverage: {
      provider: 'v8',
    },
    // Execução sequencial para evitar conflitos nos testes E2E
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    // Timeout maior para testes E2E
    testTimeout: 30000,
    hookTimeout: 30000
  },
});
