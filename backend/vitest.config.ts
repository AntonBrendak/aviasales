import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,          // ← включаем describe/test/it/expect как глобальные
    environment: 'node',
    include: [
      'packages/**/__tests__/**/*.{ts,tsx,js}',
      'packages/**/*.{spec,test}.{ts,tsx,js}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '**/.{turbo,husky,git,cache}/**'
    ],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
      include: ['packages/**/types/**/*.ts'],
      exclude: ['**/__tests__/**']
    }
  }
});