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
    rsc({
      async findClientComponentsForClientBuild() {
        // In client build, create a local server to discover client componets
        const server = await createServer({
          clearScreen: false,
          server: {middlewareMode: 'ssr'},
        });

        // Load server entry to discover client components early
        await server.ssrLoadModule(RSC_ENTRY);
        await server.close();

        // At this point, the server has loaded all the components in the module graph
        return rsc.findClientComponentsFromServer(server);
      },
    }),

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
