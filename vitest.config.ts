import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx,js}', 'tests/**/*.{test,spec}.{ts,tsx,js}', 'supabase/tests/**/*.test.js', 'supabase/tests/**/*.spec.js', 'src/**/__tests__/*.{ts,tsx,js}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
