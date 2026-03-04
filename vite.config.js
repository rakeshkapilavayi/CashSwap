import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite Configuration
 * Build tool configuration for CashSwap application
 */

export default defineConfig({
  // React plugin for Fast Refresh and JSX support
  plugins: [react()],
  
  // Module resolution configuration
  resolve: {
    alias: {
      // Shorthand path alias for src directory
      '@': path.resolve(__dirname, 'src'),
    },
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
  },
  
  // Build optimization
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
});