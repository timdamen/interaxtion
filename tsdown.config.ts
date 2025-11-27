import { defineConfig } from 'tsdown'

export default defineConfig({
  exports: true,
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
})
