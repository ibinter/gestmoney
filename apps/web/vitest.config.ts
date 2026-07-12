/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Environnement DOM (simulé avec jsdom)
    environment: 'jsdom',

    // Fichier de configuration du DOM (setup Testing Library)
    setupFiles: ['./src/__tests__/setup.ts'],

    // Patterns de fichiers de tests
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],

    // Couverture de code
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.{ts,tsx}',
        'src/__tests__/**',
        'src/app/layout.tsx',
        'src/app/providers.tsx',
      ],
    },

    // Globals : expect, describe, it, vi disponibles sans import
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
