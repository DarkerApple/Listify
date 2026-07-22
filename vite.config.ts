import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves a project site at /<repo>/, so the production build needs
// a matching base or every asset 404s (the "white page"). The deploy workflow
// passes BASE_PATH=/<repo>/; locally we build/serve at '/'. Hash routing means
// no 404.html shim is needed — the base index.html always resolves.
export default defineConfig(({ mode }) => ({
  base: process.env.BASE_PATH ?? (mode === 'production' ? '/Listify/' : '/'),
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Listify — daily journal',
        short_name: 'Listify',
        description: 'A calm, private, offline-first daily journal.',
        theme_color: '#f7f4ec',
        background_color: '#f7f4ec',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: null,
      },
    }),
  ],
}));
