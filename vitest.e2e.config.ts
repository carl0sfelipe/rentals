import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'test/**/*.e2e-spec.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**'
    ],
    coverage: {
      provider: 'v8',
    },
    // Executar testes sequencialmente para evitar conflitos de banco
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  },
});
