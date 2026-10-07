import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react()],
    resolve: {
      // Without this, a `yarn link`ed @activitypods/refine-providers resolves react/antd/etc.
      // from its own node_modules instead of this app's, duplicating them in the bundle.
      dedupe: ['react', 'react-dom', 'antd', '@ant-design/icons', '@refinedev/core', '@refinedev/react-router', 'react-router']
    },
    server: {
      host: true,
      port: parseInt(env.VITE_PORT || '4003')
    },
    preview: {
      port: parseInt(env.VITE_PORT || '4003')
    },
    base: '/'
  };
});
