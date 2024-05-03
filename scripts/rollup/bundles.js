'use strict';

const RELEASE_CHANNEL = process.env.RELEASE_CHANNEL;

const __EXPERIMENTAL__ =
  typeof RELEASE_CHANNEL === 'string'
    ? RELEASE_CHANNEL === 'experimental'
    : true;

const bundleTypes = {
  NODE_ES2015: 'NODE_ES2015',
  ESM_DEV: 'ESM_DEV',
  ESM_PROD: 'ESM_PROD',
  NODE_DEV: 'NODE_DEV',
  NODE_PROD: 'NODE_PROD',
  NODE_PROFILING: 'NODE_PROFILING',
  BUN_DEV: 'BUN_DEV',
  BUN_PROD: 'BUN_PROD',
  FB_WWW_DEV: 'FB_WWW_DEV',
  FB_WWW_PROD: 'FB_WWW_PROD',
  FB_WWW_PROFILING: 'FB_WWW_PROFILING',
  RN_OSS_DEV: 'RN_OSS_DEV',
  RN_OSS_PROD: 'RN_OSS_PROD',
  RN_OSS_PROFILING: 'RN_OSS_PROFILING',
  RN_FB_DEV: 'RN_FB_DEV',
  RN_FB_PROD: 'RN_FB_PROD',
  RN_FB_PROFILING: 'RN_FB_PROFILING',
  BROWSER_SCRIPT: 'BROWSER_SCRIPT',
};

const {
  NODE_ES2015,
  ESM_DEV,
  ESM_PROD,
  NODE_DEV,
  NODE_PROD,
  NODE_PROFILING,
  BUN_DEV,
  BUN_PROD,
  FB_WWW_DEV,
  FB_WWW_PROD,
  FB_WWW_PROFILING,
  RN_OSS_DEV,
  RN_OSS_PROD,
  RN_OSS_PROFILING,
  RN_FB_DEV,
  RN_FB_PROD,
  RN_FB_PROFILING,
  BROWSER_SCRIPT,
} = bundleTypes;

const moduleTypes = {
  // React
  ISOMORPHIC: 'ISOMORPHIC',
  // Individual renderers. They bundle the reconciler. (e.g. ReactDOM)
  RENDERER: 'RENDERER',
  // Helper packages that access specific renderer's internals. (e.g. TestUtils)
  RENDERER_UTILS: 'RENDERER_UTILS',
  // Standalone reconciler for third-party renderers.
  RECONCILER: 'RECONCILER',
};

const {ISOMORPHIC, RENDERER, RENDERER_UTILS, RECONCILER} = moduleTypes;

const bundles = [
  /******* Isomorphic *******/
  {
    bundleTypes: [
      NODE_DEV,
      NODE_PROD,
      FB_WWW_DEV,
      FB_WWW_PROD,
      FB_WWW_PROFILING,
      RN_FB_DEV,
      RN_FB_PROD,
      RN_FB_PROFILING,
    ],
    moduleType: ISOMORPHIC,
    entry: 'react',
    hasteFileName: 'React',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    externals: ['ReactNativeInternalFeatureFlags'],
  },

  /******* Isomorphic Shared Subset *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react/src/ReactServer.js',
    name: 'react.react-server',
    condition: 'react-server',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: [],
  },

  /******* React JSX Runtime *******/
  {
    bundleTypes: [
      NODE_DEV,
      NODE_PROD,
      NODE_PROFILING,
      // TODO: use on WWW.
      RN_FB_DEV,
      RN_FB_PROD,
      RN_FB_PROFILING,
    ],
    moduleType: ISOMORPHIC,
    entry: 'react/jsx-runtime',
    hasteFileName: 'JSXRuntime',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'ReactNativeInternalFeatureFlags'],
  },

  /******* Compiler Runtime *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, NODE_PROFILING],
    moduleType: ISOMORPHIC,
    entry: 'react/compiler-runtime',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React JSX Runtime React Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react/src/jsx/ReactJSXServer.js',
    name: 'react-jsx-runtime.react-server',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'ReactNativeInternalFeatureFlags'],
  },

  /******* React JSX DEV Runtime *******/
  {
    bundleTypes: [
      NODE_DEV,
      NODE_PROD,
      NODE_PROFILING,
      FB_WWW_DEV,
      FB_WWW_PROD,
      FB_WWW_PROFILING,
      RN_FB_DEV,
      RN_FB_PROD,
      RN_FB_PROFILING,
    ],
    moduleType: ISOMORPHIC,
    entry: 'react/jsx-dev-runtime',
    hasteFileName: 'JSXDEVRuntime',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'ReactNativeInternalFeatureFlags'],
  },

  /******* React JSX DEV Runtime React Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react/src/jsx/ReactJSXServer.js',
    name: 'react-jsx-dev-runtime.react-server',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'ReactNativeInternalFeatureFlags'],
  },

  /******* React DOM *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-dom',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },
  /******* React DOM Client *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-dom/client',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    externals: ['react', 'react-dom'],
  },

  /******* React DOM Profiling (Client) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROFILING],
    moduleType: RENDERER,
    entry: 'react-dom/profiling',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    externals: ['react', 'react-dom'],
  },
  /******* React DOM FB *******/
  {
    bundleTypes: [FB_WWW_DEV, FB_WWW_PROD, FB_WWW_PROFILING],
    moduleType: RENDERER,
    entry: 'react-dom/src/ReactDOMFB.js',
    hasteFileName: 'ReactDOM',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },

  /******* React DOM React Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-dom/src/ReactDOMReactServer.js',
    name: 'react-dom.react-server',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* Test Utils *******/
  {
    moduleType: RENDERER_UTILS,
    bundleTypes: [FB_WWW_DEV, NODE_DEV, NODE_PROD],
    entry: 'react-dom/test-utils',
    hasteFileName: 'ReactTestUtils',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },

  /******* React DOM - Testing *******/
  {
    moduleType: RENDERER,
    bundleTypes: __EXPERIMENTAL__ ? [NODE_DEV, NODE_PROD] : [],
    entry: 'react-dom/unstable_testing',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },

  /******* React DOM - www - Testing *******/
  {
    moduleType: RENDERER,
    bundleTypes: [FB_WWW_DEV, FB_WWW_PROD],
    entry: 'react-dom/src/ReactDOMTestingFB.js',
    hasteFileName: 'ReactDOMTesting',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React DOM Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, FB_WWW_DEV, FB_WWW_PROD],
    moduleType: RENDERER,
    entry: 'react-dom/src/server/ReactDOMLegacyServerBrowser.js',
    name: 'react-dom-server-legacy.browser',
    hasteFileName: 'ReactDOMServer',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
    babel: opts =>
      Object.assign({}, opts, {
        plugins: opts.plugins.concat([
          [require.resolve('@babel/plugin-transform-classes'), {loose: true}],
        ]),
      }),
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-dom/src/server/ReactDOMLegacyServerNode.js',
    name: 'react-dom-server-legacy.node',
    externals: ['react', 'stream', 'react-dom'],
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    babel: opts =>
      Object.assign({}, opts, {
        plugins: opts.plugins.concat([
          [require.resolve('@babel/plugin-transform-classes'), {loose: true}],
        ]),
      }),
  },

  /******* React DOM Fizz Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-dom/src/server/react-dom-server.browser.js',
    name: 'react-dom-server.browser',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-dom/src/server/react-dom-server.node.js',
    name: 'react-dom-server.node',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'util', 'crypto', 'async_hooks', 'react-dom'],
  },
  {
    bundleTypes: __EXPERIMENTAL__ ? [FB_WWW_DEV, FB_WWW_PROD] : [],
    moduleType: RENDERER,
    entry: 'react-server-dom-fb/src/ReactDOMServerFB.js',
    hasteFileName: 'ReactDOMServerStreaming',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },

  /******* React DOM Fizz Server Edge *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-dom/src/server/react-dom-server.edge.js',
    name: 'react-dom-server.edge', // 'node_modules/react/*.js',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },

  /******* React DOM Fizz Server Bun *******/
  {
    bundleTypes: [BUN_DEV, BUN_PROD],
    moduleType: RENDERER,
    entry: 'react-dom/src/server/react-dom-server.bun.js',
    name: 'react-dom-server.bun', // 'node_modules/react/*.js',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },

  /******* React DOM Fizz Server External Runtime *******/
  {
    bundleTypes: __EXPERIMENTAL__ ? [BROWSER_SCRIPT] : [],
    moduleType: RENDERER,
    entry: 'react-dom/unstable_server-external-runtime',
    outputPath: 'unstable_server-external-runtime.js',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [],
  },

  /******* React Server DOM Webpack Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack/server.browser',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack/server.node',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'util', 'crypto', 'async_hooks', 'react-dom'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack/server.node.unbundled',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'util', 'crypto', 'async_hooks', 'react-dom'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack/server.edge',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'util', 'crypto', 'async_hooks', 'react-dom'],
  },

  /******* React Server DOM Webpack Client *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack/client.browser',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack/client.node',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom', 'util', 'crypto'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack/client.node.unbundled',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom', 'util', 'crypto'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack/client.edge',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },

  /******* React Server DOM Webpack Plugin *******/
  {
    bundleTypes: [NODE_ES2015],
    moduleType: RENDERER_UTILS,
    entry: 'react-server-dom-webpack/plugin',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['fs', 'path', 'url', 'neo-async'],
  },

  /******* React Server DOM Webpack Node.js Loader *******/
  {
    bundleTypes: [ESM_PROD],
    moduleType: RENDERER_UTILS,
    entry: 'react-server-dom-webpack/node-loader',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['acorn'],
  },

  /******* React Server DOM Webpack Node.js CommonJS Loader *******/
  {
    bundleTypes: [NODE_ES2015],
    moduleType: RENDERER_UTILS,
    entry: 'react-server-dom-webpack/src/ReactFlightWebpackNodeRegister',
    name: 'react-server-dom-webpack-node-register',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['url', 'module', 'react-server-dom-webpack/server'],
  },

  /******* React Server DOM Turbopack Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-turbopack/server.browser',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-turbopack/server.node',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'util', 'async_hooks', 'react-dom'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-turbopack/server.node.unbundled',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'util', 'async_hooks', 'react-dom'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-turbopack/server.edge',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'util', 'async_hooks', 'react-dom'],
  },

  /******* React Server DOM Turbopack Client *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-turbopack/client.browser',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-turbopack/client.node',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom', 'util'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-turbopack/client.node.unbundled',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom', 'util'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-turbopack/client.edge',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },

  /******* React Server DOM Turbopack Plugin *******/
  // There is no plugin the moment because Turbopack
  // does not expose a plugin interface yet.

  /******* React Server DOM Turbopack Node.js Loader *******/
  {
    bundleTypes: [ESM_PROD],
    moduleType: RENDERER_UTILS,
    entry: 'react-server-dom-turbopack/node-loader',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['acorn'],
  },

  /******* React Server DOM Turbopack Node.js CommonJS Loader *******/
  {
    bundleTypes: [NODE_ES2015],
    moduleType: RENDERER_UTILS,
    entry: 'react-server-dom-turbopack/src/ReactFlightTurbopackNodeRegister',
    name: 'react-server-dom-turbopack-node-register',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['url', 'module', 'react-server-dom-turbopack/server'],
  },

  /******* React Server DOM ESM Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-esm/server.node',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'util', 'crypto', 'async_hooks', 'react-dom'],
  },

  /******* React Server DOM ESM Client *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, ESM_DEV, ESM_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-esm/client.browser',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-esm/client.node',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom', 'util', 'crypto'],
  },

  /******* React Server DOM ESM Node.js Loader *******/
  {
    bundleTypes: [ESM_PROD],
    moduleType: RENDERER_UTILS,
    entry: 'react-server-dom-esm/node-loader',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['acorn'],
  },

  /******* React Suspense Test Utils *******/
  {
    bundleTypes: [NODE_ES2015],
    moduleType: RENDERER_UTILS,
    entry: 'react-suspense-test-utils',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React ART *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, FB_WWW_DEV, FB_WWW_PROD],
    moduleType: RENDERER,
    entry: 'react-art',
    hasteFileName: 'ReactART',
    externals: ['react'],
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    babel: opts =>
      Object.assign({}, opts, {
        // Include JSX
        presets: opts.presets.concat([
          require.resolve('@babel/preset-react'),
          require.resolve('@babel/preset-flow'),
        ]),
        plugins: opts.plugins.concat([
          [require.resolve('@babel/plugin-transform-classes'), {loose: true}],
        ]),
      }),
  },

  /******* React Native *******/
  {
    bundleTypes: __EXPERIMENTAL__
      ? []
      : [RN_FB_DEV, RN_FB_PROD, RN_FB_PROFILING],
    moduleType: RENDERER,
    entry: 'react-native-renderer',
    hasteFileName: 'ReactNativeRenderer',
    externals: ['react-native', 'ReactNativeInternalFeatureFlags'],
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    babel: opts =>
      Object.assign({}, opts, {
        plugins: opts.plugins.concat([
          [require.resolve('@babel/plugin-transform-classes'), {loose: true}],
        ]),
      }),
  },
  {
    bundleTypes: [RN_OSS_DEV, RN_OSS_PROD, RN_OSS_PROFILING],
    moduleType: RENDERER,
    entry: 'react-native-renderer',
    hasteFileName: 'ReactNativeRenderer',
    externals: ['react-native'],
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    babel: opts =>
      Object.assign({}, opts, {
        plugins: opts.plugins.concat([
          [require.resolve('@babel/plugin-transform-classes'), {loose: true}],
        ]),
      }),
  },

  /******* React Native Fabric *******/
  {
    bundleTypes: __EXPERIMENTAL__
      ? []
      : [RN_FB_DEV, RN_FB_PROD, RN_FB_PROFILING],
    moduleType: RENDERER,
    entry: 'react-native-renderer/fabric',
    hasteFileName: 'ReactFabric',
    externals: ['react-native', 'ReactNativeInternalFeatureFlags'],
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    babel: opts =>
      Object.assign({}, opts, {
        plugins: opts.plugins.concat([
          [require.resolve('@babel/plugin-transform-classes'), {loose: true}],
        ]),
      }),
  },
  {
    bundleTypes: [RN_OSS_DEV, RN_OSS_PROD, RN_OSS_PROFILING],
    moduleType: RENDERER,
    hasteFileName: 'ReactFabric',
    entry: 'react-native-renderer/fabric',
    externals: ['react-native'],
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    babel: opts =>
      Object.assign({}, opts, {
        plugins: opts.plugins.concat([
          [require.resolve('@babel/plugin-transform-classes'), {loose: true}],
        ]),
      }),
  },

  /******* React Test Renderer *******/
  {
    bundleTypes: [
      FB_WWW_DEV,
      NODE_DEV,
      NODE_PROD,
      RN_FB_DEV,
      RN_FB_PROD,
      RN_FB_PROFILING,
    ],
    moduleType: RENDERER,
    entry: 'react-test-renderer',
    hasteFileName: 'ReactTestRenderer',
    externals: [
      'react',
      'scheduler',
      'scheduler/unstable_mock',
      'ReactNativeInternalFeatureFlags',
    ],
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    babel: opts =>
      Object.assign({}, opts, {
        plugins: opts.plugins.concat([
          [require.resolve('@babel/plugin-transform-classes'), {loose: true}],
        ]),
      }),
  },

  /******* React Noop Renderer (used for tests) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-noop-renderer',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'scheduler', 'scheduler/unstable_mock', 'expect'],
  },

  /******* React Noop Persistent Renderer (used for tests) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-noop-renderer/persistent',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'scheduler', 'expect'],
  },

  /******* React Noop Server Renderer (used for tests) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-noop-renderer/server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'scheduler', 'expect'],
  },

  /******* React Noop Flight Server (used for tests) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-noop-renderer/flight-server',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [
      'react',
      'scheduler',
      'expect',
      'react-noop-renderer/flight-modules',
    ],
  },

  /******* React Noop Flight Client (used for tests) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-noop-renderer/flight-client',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [
      'react',
      'scheduler',
      'expect',
      'react-noop-renderer/flight-modules',
    ],
  },

  /******* React Reconciler *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, NODE_PROFILING, FB_WWW_DEV, FB_WWW_PROD],
    moduleType: RECONCILER,
    entry: 'react-reconciler',
    hasteFileName: 'ReactReconciler',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React Flight Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-server/flight',
    condition: 'react-server',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React Flight Client *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-client/flight',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* Reconciler Reflection *******/
  {
    moduleType: RENDERER_UTILS,
    bundleTypes: [NODE_DEV, NODE_PROD],
    entry: 'react-reconciler/reflection',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: [],
  },

  /******* Reconciler Constants *******/
  {
    moduleType: RENDERER_UTILS,
    bundleTypes: [NODE_DEV, NODE_PROD],
    entry: 'react-reconciler/constants',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: [],
  },

  /******* React Is *******/
  {
    bundleTypes: [
      NODE_DEV,
      NODE_PROD,
      FB_WWW_DEV,
      FB_WWW_PROD,
      RN_FB_DEV,
      RN_FB_PROD,
      RN_FB_PROFILING,
    ],
    moduleType: ISOMORPHIC,
    entry: 'react-is',
    hasteFileName: 'ReactIs',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['ReactNativeInternalFeatureFlags'],
  },

  /******* React Debug Tools *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-debug-tools',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [],
  },

  /******* React Cache (experimental, old) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, FB_WWW_DEV, FB_WWW_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-cache',
    hasteFileName: 'ReactCacheOld',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'scheduler'],
  },

  /******* Hook for managing subscriptions safely *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'use-subscription',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },

  /******* useSyncExternalStore *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'use-sync-external-store',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },

  /******* useSyncExternalStore (shim) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'use-sync-external-store/shim',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },

  /******* useSyncExternalStore (shim, native) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'use-sync-external-store/shim/index.native',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },

  /******* useSyncExternalStoreWithSelector *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'use-sync-external-store/with-selector',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },

  /******* useSyncExternalStoreWithSelector (shim) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'use-sync-external-store/shim/with-selector',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    externals: ['react', 'use-sync-external-store/shim'],
  },

  /******* React Scheduler (experimental) *******/
  {
    bundleTypes: [
      NODE_DEV,
      NODE_PROD,
      FB_WWW_DEV,
      FB_WWW_PROD,
      FB_WWW_PROFILING,
      RN_FB_DEV,
      RN_FB_PROD,
      RN_FB_PROFILING,
    ],
    moduleType: ISOMORPHIC,
    entry: 'scheduler',
    hasteFileName: 'Scheduler',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    externals: ['ReactNativeInternalFeatureFlags'],
  },

  /******* React Scheduler Mock (experimental) *******/
  {
    bundleTypes: [
      NODE_DEV,
      NODE_PROD,
      FB_WWW_DEV,
      FB_WWW_PROD,
      RN_FB_DEV,
      RN_FB_PROD,
    ],
    moduleType: ISOMORPHIC,
    entry: 'scheduler/unstable_mock',
    hasteFileName: 'SchedulerMock',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['ReactNativeInternalFeatureFlags'],
  },

  /******* React Scheduler Native *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'scheduler/index.native',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['ReactNativeInternalFeatureFlags'],
  },

  /******* React Scheduler Post Task (experimental) *******/
  {
    bundleTypes: [
      NODE_DEV,
      NODE_PROD,
      FB_WWW_DEV,
      FB_WWW_PROD,
      FB_WWW_PROFILING,
    ],
    moduleType: ISOMORPHIC,
    entry: 'scheduler/unstable_post_task',
    hasteFileName: 'SchedulerPostTask',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: [],
  },

  /******* Jest React (experimental) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'jest-react',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'scheduler', 'scheduler/unstable_mock'],
  },

  /******* ESLint Plugin for Hooks *******/
  {
    // TODO: it's awkward to create a bundle for this but if we don't, the package
    // won't get copied. We also can't create just DEV bundle because it contains a
    // NODE_ENV check inside. We should probably tweak our build process to allow
    // "raw" packages that don't get bundled.
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'eslint-plugin-react-hooks',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [],
  },

  /******* React Fresh *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-refresh/babel',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD, FB_WWW_DEV],
    moduleType: ISOMORPHIC,
    entry: 'react-refresh/runtime',
    hasteFileName: 'ReactFreshRuntime',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [],
  },
];

// Based on deep-freeze by substack (public domain)
function deepFreeze(o) {
  Object.freeze(o);
  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (
      o[prop] !== null &&
      (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
      !Object.isFrozen(o[prop])
    ) {
      deepFreeze(o[prop]);
    }
  });
  return o;
}

// Don't accidentally mutate config as part of the build
deepFreeze(bundles);
deepFreeze(bundleTypes);
deepFreeze(moduleTypes);

function getFilename(bundle, bundleType) {
  let name = bundle.name || bundle.entry;
  // we do this to replace / to -, for react-dom/server
  name = name.replace('/index.', '.').replace('/', '-');
  switch (bundleType) {
    case NODE_ES2015:
      return `${name}.js`;
    case BUN_DEV:
      return `${name}.development.js`;
    case BUN_PROD:
      return `${name}.production.js`;
    case ESM_DEV:
      return `${name}.development.js`;
    case ESM_PROD:
      return `${name}.production.js`;
    case NODE_DEV:
      return `${name}.development.js`;
    case NODE_PROD:
      return `${name}.production.js`;
    case NODE_PROFILING:
      return `${name}.profiling.js`;
    case FB_WWW_DEV:
    case RN_OSS_DEV:
    case RN_FB_DEV:
      return `${bundle.hasteFileName}-dev.js`;
    case FB_WWW_PROD:
    case RN_OSS_PROD:
    case RN_FB_PROD:
      return `${bundle.hasteFileName}-prod.js`;
    case FB_WWW_PROFILING:
    case RN_FB_PROFILING:
    case RN_OSS_PROFILING:
      return `${bundle.hasteFileName}-profiling.js`;
    case BROWSER_SCRIPT:
      return `${name}.js`;
  }
}

module.exports = {
  bundleTypes,
  moduleTypes,
  bundles,
  getFilename,
};
