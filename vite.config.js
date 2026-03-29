import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Carregar variáveis de ambiente do .env
  const env = loadEnv(mode, process.cwd(), '');

  // Mapear REACT_APP_* para process.env para compatibilidade com CRA
  const processEnvDefines = {};
  Object.keys(env).forEach((key) => {
    if (key.startsWith('REACT_APP_') || key === 'NODE_ENV' || key === 'PUBLIC_URL') {
      processEnvDefines[`process.env.${key}`] = JSON.stringify(env[key]);
    }
  });
  // Garantir NODE_ENV sempre definido
  processEnvDefines['process.env.NODE_ENV'] = JSON.stringify(mode === 'production' ? 'production' : 'development');
  processEnvDefines['process.env.PUBLIC_URL'] = JSON.stringify('');

  return {
    plugins: [
      react(),
      nodePolyfills({
        // Habilitar polyfills de process e buffer
        include: ['process', 'buffer'],
        globals: {
          process: true,
          Buffer: true,
        },
      }),
    ],
    root: '.',
    publicDir: 'public',
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor';
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    define: {
      ...processEnvDefines,
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
