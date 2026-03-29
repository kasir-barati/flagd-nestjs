import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
