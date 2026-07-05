import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const srcPath = fileURLToPath(new URL('./src', import.meta.url));
const reactPath = fileURLToPath(new URL('../../node_modules/react', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': srcPath,
      react: reactPath
    }
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx']
  }
});
