import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = (env.VITE_API_PROXY_TARGET || 'http://localhost:4000').replace(/\/$/, '');

  return {
    base: './',
    plugins: [react()],
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/wellflow-api': {
          target: 'https://api.wellflow.dev/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/wellflow-api/, ''),
        },
      },
    },
  };
});
