import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the consulta-cclass-trib project.
// The base option is set to '/' so that the app works correctly
// when deployed from the root of a domain (for example on Vercel).
export default defineConfig({
  base: '/',
  plugins: [react()],
});