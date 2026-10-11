import { defineConfig } from 'vite';
import { build as esbuild } from 'esbuild';
import fs from 'node:fs';

// The sandboxed player is built as a classic (non-module) IIFE script so it loads inside an
// opaque-origin sandboxed iframe without CORS, under a strict CSP (script-src 'self').
function playerBuild() {
  return {
    name: 'blockforge-player',
    async closeBundle() {
      fs.mkdirSync('dist/player', { recursive: true });
      await esbuild({
        entryPoints: ['src/player.js'], bundle: true, format: 'iife', minify: true, target: 'es2020',
        outfile: 'dist/player/player.js', logLevel: 'warning',
        define: { __EDITOR_ORIGINS__: JSON.stringify(process.env.PLAYER_EDITOR_ORIGINS || '') },
      });
      fs.copyFileSync('player/index.html', 'dist/player/index.html');
    },
  };
}
export default defineConfig({
  base: './',
  plugins: [playerBuild()],
  build: { outDir: 'dist', assetsDir: 'assets', target: 'es2020' },
  server: { proxy: { '/api': process.env.BLOCKS_API || 'http://127.0.0.1:8795' } },
  preview: { proxy: { '/api': process.env.BLOCKS_API || 'http://127.0.0.1:8795' } },
});
