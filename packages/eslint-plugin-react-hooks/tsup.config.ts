import {defineConfig} from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  format: ['cjs'],
  outDir: 'build',
});
