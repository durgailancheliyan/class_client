import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

// Vercel serves 404.html when path is not found. Copy index.html so SPA loads for /attend/:slug etc.
function vercel404Plugin() {
  return {
    name: 'vercel-404',
    closeBundle() {
      const outDir = join(process.cwd(), 'dist');
      const index = join(outDir, 'index.html');
      const notFound = join(outDir, '404.html');
      if (existsSync(index)) {
        copyFileSync(index, notFound);
        console.log('Copied index.html → 404.html for Vercel SPA fallback');
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), vercel404Plugin()],
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } } }
});
