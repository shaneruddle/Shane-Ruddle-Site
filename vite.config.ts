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
        transform(code, id) {
          if (id.includes('quill.snow.css') || id.includes('quill.bubble.css') || id.includes('quill.core.css')) {
            return {
              code: code.replace(/\/\*# sourceMappingURL=.* \*\/| \/\*# sourceMappingURL=.* \*\//g, ''),
              map: null
            };
          }
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
