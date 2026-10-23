import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const shim = (file) => here(`./src/demo/shims/${file}`);

/**
 * Lets the browser demo (src/demo) import the real backend code: Node-only
 * pieces (Express, better-sqlite3, the file system) are swapped for small
 * browser stand-ins, and the backend's npm imports (zod) resolve from here.
 */
function trailDemoBackend() {
  const swaps = [
    ['/backend/src/db/index.js', 'db.js'],
    ['/backend/src/config/env.js', 'env.js'],
    ['/backend/src/db/migrate.js', 'migrate.js'],
    ['/backend/src/lib/upload.js', 'upload.js'],
  ];
  return {
    name: 'trail-demo-backend',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || !importer.replace(/\\/g, '/').includes('/backend/src/')) return null;
      if (source === 'express') return shim('express.js');
      if (source === 'node:path') return shim('node-path.js');
      if (source === 'node:url') return shim('node-url.js');
      if (!source.startsWith('.') && !source.startsWith('/')) {
        return this.resolve(source, here('./src/main.jsx'), { ...options, skipSelf: true });
      }
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      const hit = resolved && swaps.find(([end]) => resolved.id.replace(/\\/g, '/').endsWith(end));
      return hit ? shim(hit[1]) : null;
    },
  };
}

export default defineConfig({
  plugins: [react(), trailDemoBackend()],
  server: {
    port: 5173,
    // host: true exposes the dev server on your LAN, so your phone can open it.
    host: true,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
    // The browser demo bundles files from ../backend.
    fs: { allow: ['..'] },
  },
  build: { outDir: 'dist', sourcemap: true },
});
