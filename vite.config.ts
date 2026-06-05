import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'strip-quill-sourcemap',
        enforce: 'pre',
        transform(code, id) {
          if (id.includes('node_modules/react-quill-new/dist') && id.endsWith('.css')) {
            return {
              code: code.replace(/\/\*# sourceMappingURL=.*\*\//g, ''),
              map: null
            };
          }
        }
      }
    ],
    css: {
      devSourcemap: false
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
    exclude: ['@google/genai'],
  },
  build: {
    rollupOptions: {
      external: ['@google/genai'],
    },
  },
  server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
