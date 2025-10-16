import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuração do Vite responsável por compilar o projeto React.
// O plugin oficial `@vitejs/plugin-react` habilita Fast Refresh e suporte a JSX.
// A opção `base` permanece como '/' para garantir caminhos absolutos corretos
// em ambientes de deploy como a Vercel.
export default defineConfig({
  base: '/',
  plugins: [react()],
});