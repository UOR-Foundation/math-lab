import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env files
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determine base path from environment
  const base = env.VITE_APP_ENV === 'staging' 
    ? '/math-lab/staging/' 
    : '/math-lab/';
  
  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': '/src'
      }
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit'],
            visualization: ['d3', 'three']
          }
        }
      }
    },
    worker: {
      format: 'es'
    }
  };
});