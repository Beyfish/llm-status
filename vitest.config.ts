import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['src/__tests__/onboarding-flow.test.tsx', 'jsdom'],
    ],
    exclude: [
      '**/node_modules/**',
      '**/llm-status/**',
      '**/.worktrees/**',
      '**/e2e/**',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
