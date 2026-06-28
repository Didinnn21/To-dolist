// ==========================================================================
// DZHIRASENA - VITE CONFIGURATION
// Proxy /api/* ke Express.js backend (port 3000)
// ==========================================================================

import { defineConfig } from 'vite';

const proxyConfig = {
    '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
    }
};

export default defineConfig({
    server: {
        port: 5173,
        strictPort: false, // Otomatis naik ke port berikutnya jika 5173 terpakai
        proxy: proxyConfig
    },
    preview: {
        port: 4173,
        strictPort: false,
        proxy: proxyConfig
    }
});
