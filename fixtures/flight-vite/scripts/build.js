'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const {builtinModules} = require('module');

function hash(str) {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i);
  }

  return hash;
}

async function build() {
  const vite = await import('vite');
  const {default: reactServer} = await import('react-server-dom-vite/plugin');
  const serverModules = new Set();
  const clientModules = new Set();

  // Building the react server bundle, includes App entry point and
  // server actions
  let bundle = await vite.build({
    build: {
      rollupOptions: {
        input: ['src/App.jsx'],
        external: [...builtinModules.map(m => `node:${m}`)],
        onwarn: (warning, warn) => {
          // suppress warnings about source map issues for now
          // these are caused originally by rollup trying to complain about directives
          // in the middle of the files
          // TODO: fix source map issues
          if (warning.code === 'SOURCEMAP_ERROR') {
            return;
          }
        },
        output: {
          // preserve the export names of the server actions in chunks
          minifyInternalExports: false,
          manualChunks: chunk => {
            // server references should be emitted as separate chunks
            // so that we can load them individually when server actions
            // are called. we need to do this in manualChunks because we don't
            // want to run a preanalysis pass just to identify these
            if (serverModules.has(chunk)) {
              return `${hash(chunk)}`;
            }
          },
          // we want to control the chunk names so that we can load them
          // individually when server actions are called
          chunkFileNames: '[name].js',
        },
      },
      ssr: true,
      ssrManifest: true,
      ssrEmitAssets: true,
      target: 'node18',
      manifest: true,
      outDir: 'build/react-server',
    },
    resolve: {
      conditions: ['node', 'import', 'react-server', process.env.NODE_ENV],
    },
    plugins: [
      reactServer({
        hash,
        onClientReference: id => {
          clientModules.add(id);
        },
        onServerReference: id => {
          serverModules.add(id);
        },
      }),
    ],
    ssr: {
      noExternal: true,
      external: ['react', 'react-dom', 'react-server-dom-vite'],
    },
  });

  // Building the SSR server bundle, includes the client components for SSR
  await vite.build({
    build: {
      rollupOptions: {
        onwarn: (warning, warn) => {
          // suppress warnings about source map issues for now
          // these are caused originally by rollup trying to complain about directives
          // in the middle of the files
          // TODO: fix source map issues
          if (warning.code === 'SOURCEMAP_ERROR') {
            return;
          }
        },
        input: {
          entry: 'src/index.js',
          ...Object.fromEntries(
            [...clientModules.values()].map(c => [hash(c), c])
          ),
        },
        output: {
          entryFileNames: chunk => {
            return chunk.name + '.js';
          },
        },
      },
      ssr: true,
      ssrManifest: true,
      ssrEmitAssets: true,
      manifest: true,
      outDir: 'build/server',
    },
    ssr: {
      external: ['react', 'react-dom', 'react-server-dom-vite'],
    },
  });

  // Building the client bundle, includes the client entry point and client components for hydration
  await vite.build({
    build: {
      rollupOptions: {
        input: {
          entry: 'src/index.js',
          ...Object.fromEntries(
            [...clientModules.values()].map(c => [hash(c), c])
          ),
        },
        onwarn: (warning, warn) => {
          // suppress warnings about source map issues for now
          // these are caused originally by rollup trying to complain about directives
          // in the middle of the files
          // TODO: fix source map issues
          if (warning.code === 'SOURCEMAP_ERROR') {
            return;
          }
        },
        output: {
          // we want to control the names of the client component chunks
          // so that we can load them individually when they are requested
          entryFileNames: chunk => {
            return chunk.name + '.js';
          },
        },
        treeshake: true,
        // required otherwise rollup will remove the exports since they are not used
        // by the other entries
        preserveEntrySignatures: 'exports-only',
      },
      ssrManifest: true,
      target: 'esnext',
      manifest: true,
      outDir: 'build/static',
    },
    ssr: {
      external: ['react', 'react-dom', 'react-server-dom-vite'],
    },
  });
}

build();
