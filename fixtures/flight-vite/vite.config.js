import {defineConfig, createServer} from 'vite';
import react from '@vitejs/plugin-react';
import rsc from 'react-server-dom-vite/plugin';
import apiRoutes from './server/api.js';

const RSC_ENTRY = '/server/rsc.server.js';

// https://vitejs.dev/config/
export default defineConfig({
  ssr: {
    noExternal: [/react-server-dom-vite/],
  },
  optimizeDeps: {
    // Turn CJS deps into ESM
    include: [
      'react',
      'react-dom/client',
      // https://github.com/vitejs/vite/issues/6215
      'react/jsx-runtime',
      'react-fetch',
    ],
  },
  plugins: [
    react(),
    rsc({serverBuildEntries: [RSC_ENTRY]}),

    // Custom plugin
    {
      name: 'my-dev-server',
      configureServer(server) {
        apiRoutes.forEach(({route, handler}) =>
          server.middlewares.use(route, handler)
        );

        return () => {
          server.middlewares.use(async function(req, res, next) {
            if (!/^\/__react($|\?)/.test(req.originalUrl)) {
              return next();
            }

            const {default: handleRSC} = await server.ssrLoadModule(RSC_ENTRY);

            return handleRSC(req, res);
          });
        };
      },
    },
  ],
});
