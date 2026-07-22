import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: `base` matters only for GitHub Pages deployment (Stage 6). For a
// project site it must become '/<repo-name>/'. Left as '/' for local dev so
// nothing about the deploy target is baked in prematurely.
export default defineConfig({
  base: '/',
  plugins: [react()],
});
