'use strict';

const RELEASE_CHANNEL = process.env.RELEASE_CHANNEL;

const __EXPERIMENTAL__ =
  typeof RELEASE_CHANNEL === 'string'
    ? RELEASE_CHANNEL === 'experimental'
    : true;

const bundleTypes = {
  NODE_ES2015: 'NODE_ES2015',
  NODE_ESM: 'NODE_ESM',
  UMD_DEV: 'UMD_DEV',
  UMD_PROD: 'UMD_PROD',
  UMD_PROFILING: 'UMD_PROFILING',
  NODE_DEV: 'NODE_DEV',
  NODE_PROD: 'NODE_PROD',
  NODE_PROFILING: 'NODE_PROFILING',
  FB_WWW_DEV: 'FB_WWW_DEV',
  FB_WWW_PROD: 'FB_WWW_PROD',
  FB_WWW_PROFILING: 'FB_WWW_PROFILING',
  RN_OSS_DEV: 'RN_OSS_DEV',
  RN_OSS_PROD: 'RN_OSS_PROD',
  RN_OSS_PROFILING: 'RN_OSS_PROFILING',
  RN_FB_DEV: 'RN_FB_DEV',
  RN_FB_PROD: 'RN_FB_PROD',
  RN_FB_PROFILING: 'RN_FB_PROFILING',
};

const {
  NODE_ES2015,
  NODE_ESM,
  UMD_DEV,
  UMD_PROD,
  UMD_PROFILING,
  NODE_DEV,
  NODE_PROD,
  NODE_PROFILING,
  FB_WWW_DEV,
  FB_WWW_PROD,
  FB_WWW_PROFILING,
  RN_OSS_DEV,
  RN_OSS_PROD,
  RN_OSS_PROFILING,
  RN_FB_DEV,
  RN_FB_PROD,
  RN_FB_PROFILING,
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
      UMD_DEV,
      UMD_PROD,
      UMD_PROFILING,
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
    global: 'React',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    externals: ['ReactNativeInternalFeatureFlags'],
  },

  /******* Isomorphic Shared Subset *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react/unstable-shared-subset',
    global: 'React',
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
    global: 'JSXRuntime',
    minifyWithProdErrorCodes: true,
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
    global: 'JSXDEVRuntime',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'ReactNativeInternalFeatureFlags'],
  },

  /******* React Fetch Browser (experimental, new) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-fetch/index.browser',
    global: 'ReactFetch',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React Fetch Node (experimental, new) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-fetch/index.node',
    global: 'ReactFetch',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'http', 'https'],
  },

  /******* React FS Browser (experimental, new) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-fs/index.browser.server',
    global: 'ReactFilesystem',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [],
  },

  /******* React FS Node (experimental, new) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-fs/index.node.server',
    global: 'ReactFilesystem',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'fs/promises', 'path'],
  },

  /******* React PG Browser (experimental, new) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-pg/index.browser.server',
    global: 'ReactPostgres',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [],
  },

  /******* React PG Node (experimental, new) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-pg/index.node.server',
    global: 'ReactPostgres',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'pg'],
  },

  /******* React DOM *******/
  {
    bundleTypes: [
      UMD_DEV,
      UMD_PROD,
      UMD_PROFILING,
      NODE_DEV,
      NODE_PROD,
      NODE_PROFILING,
      FB_WWW_DEV,
      FB_WWW_PROD,
      FB_WWW_PROFILING,
    ],
    moduleType: RENDERER,
    entry: 'react-dom',
    global: 'ReactDOM',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },

  /******* React DOM - www - Uses forked reconciler *******/
  {
    moduleType: RENDERER,
    bundleTypes: [FB_WWW_DEV, FB_WWW_PROD, FB_WWW_PROFILING],
    entry: 'react-dom',
    global: 'ReactDOMForked',
    enableNewReconciler: true,
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },

  /******* Test Utils *******/
  {
    moduleType: RENDERER_UTILS,
    bundleTypes: [FB_WWW_DEV, NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    entry: 'react-dom/test-utils',
    global: 'ReactTestUtils',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'react-dom'],
  },

  /******* React DOM - www - Testing *******/
  {
    moduleType: RENDERER,
    bundleTypes: __EXPERIMENTAL__
      ? [FB_WWW_DEV, FB_WWW_PROD, NODE_DEV, NODE_PROD]
      : [FB_WWW_DEV, FB_WWW_PROD],
    entry: 'react-dom/unstable_testing',
    global: 'ReactDOMTesting',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React DOM Server *******/
  {
    bundleTypes: [
      UMD_DEV,
      UMD_PROD,
      NODE_DEV,
      NODE_PROD,
      FB_WWW_DEV,
      FB_WWW_PROD,
    ],
    moduleType: RENDERER,
    entry: 'react-dom/src/server/ReactDOMLegacyServerBrowser.js',
    name: 'react-dom-server-legacy.browser',
    global: 'ReactDOMServer',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
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
    externals: ['react', 'stream'],
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
    bundleTypes: [NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    moduleType: RENDERER,
    entry: 'react-dom/src/server/ReactDOMFizzServerBrowser.js',
    name: 'react-dom-server.browser',
    global: 'ReactDOMServer',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-dom/src/server/ReactDOMFizzServerNode.js',
    name: 'react-dom-server.node',
    global: 'ReactDOMServer',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },
  {
    bundleTypes: __EXPERIMENTAL__ ? [FB_WWW_DEV, FB_WWW_PROD] : [],
    moduleType: RENDERER,
    entry: 'react-server-dom-relay/src/ReactDOMServerFB.js',
    global: 'ReactDOMServerStreaming',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React Server DOM Webpack Writer *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack/writer.browser.server',
    global: 'ReactServerDOMWriter',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack/writer.node.server',
    global: 'ReactServerDOMWriter',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React Server DOM Webpack Reader *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack',
    global: 'ReactServerDOMReader',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React Server DOM Webpack Plugin *******/
  {
    bundleTypes: [NODE_ES2015],
    moduleType: RENDERER_UTILS,
    entry: 'react-server-dom-webpack/plugin',
    global: 'ReactServerWebpackPlugin',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['fs', 'path', 'url', 'neo-async'],
  },

  /******* React Server DOM Webpack Node.js Loader *******/
  {
    bundleTypes: [NODE_ESM],
    moduleType: RENDERER_UTILS,
    entry: 'react-server-dom-webpack/node-loader',
    global: 'ReactServerWebpackNodeLoader',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['acorn'],
  },

  /******* React Server DOM Webpack Node.js CommonJS Loader *******/
  {
    bundleTypes: [NODE_ES2015],
    moduleType: RENDERER_UTILS,
    entry: 'react-server-dom-webpack/node-register',
    global: 'ReactFlightWebpackNodeRegister',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['url', 'module'],
  },

  /******* React Server DOM Relay Writer *******/
  {
    bundleTypes: [FB_WWW_DEV, FB_WWW_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-relay/server',
    global: 'ReactFlightDOMRelayServer', // TODO: Rename to Writer
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [
      'react',
      'ReactFlightDOMRelayServerIntegration',
      'JSResourceReference',
    ],
  },

  /******* React Server DOM Relay Reader *******/
  {
    bundleTypes: [FB_WWW_DEV, FB_WWW_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-relay',
    global: 'ReactFlightDOMRelayClient', // TODO: Rename to Reader
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: [
      'react',
      'ReactFlightDOMRelayClientIntegration',
      'JSResourceReference',
    ],
  },

  /******* React Server Native Relay Writer *******/
  {
    bundleTypes: [RN_FB_DEV, RN_FB_PROD],
    moduleType: RENDERER,
    entry: 'react-server-native-relay/server',
    global: 'ReactFlightNativeRelayServer', // TODO: Rename to Writer
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [
      'react',
      'ReactFlightNativeRelayServerIntegration',
      'JSResourceReferenceImpl',
      'ReactNativeInternalFeatureFlags',
    ],
  },

  /******* React Server Native Relay Reader *******/
  {
    bundleTypes: [RN_FB_DEV, RN_FB_PROD],
    moduleType: RENDERER,
    entry: 'react-server-native-relay',
    global: 'ReactFlightNativeRelayClient', // TODO: Rename to Reader
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: [
      'react',
      'ReactFlightNativeRelayClientIntegration',
      'JSResourceReferenceImpl',
      'ReactNativeInternalFeatureFlags',
    ],
  },

  /******* React Suspense Test Utils *******/
  {
    bundleTypes: [NODE_ES2015],
    moduleType: RENDERER_UTILS,
    entry: 'react-suspense-test-utils',
    global: 'ReactSuspenseTestUtils',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React ART *******/
  {
    bundleTypes: [
      UMD_DEV,
      UMD_PROD,
      NODE_DEV,
      NODE_PROD,
      FB_WWW_DEV,
      FB_WWW_PROD,
    ],
    moduleType: RENDERER,
    entry: 'react-art',
    global: 'ReactART',
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
    global: 'ReactNativeRenderer',
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
    global: 'ReactNativeRenderer',
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
    global: 'ReactFabric',
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
    entry: 'react-native-renderer/fabric',
    global: 'ReactFabric',
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
      UMD_DEV,
      UMD_PROD,
      RN_FB_DEV,
      RN_FB_PROD,
      RN_FB_PROFILING,
    ],
    moduleType: RENDERER,
    entry: 'react-test-renderer',
    global: 'ReactTestRenderer',
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
    global: 'ReactNoopRenderer',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'scheduler', 'scheduler/unstable_mock', 'expect'],
  },

  /******* React Noop Persistent Renderer (used for tests) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-noop-renderer/persistent',
    global: 'ReactNoopRendererPersistent',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'scheduler', 'expect'],
  },

  /******* React Noop Server Renderer (used for tests) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-noop-renderer/server',
    global: 'ReactNoopRendererServer',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'scheduler', 'expect'],
  },

  /******* React Noop Flight Server (used for tests) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-noop-renderer/flight-server',
    global: 'ReactNoopFlightServer',
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
    global: 'ReactNoopFlightClient',
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
    bundleTypes: [NODE_DEV, NODE_PROD, NODE_PROFILING],
    moduleType: RECONCILER,
    entry: 'react-reconciler',
    global: 'ReactReconciler',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-server',
    global: 'ReactServer',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React Flight Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-server/flight',
    global: 'ReactFlightServer',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* React Flight Client *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-client/flight',
    global: 'ReactFlightClient',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['react'],
  },

  /******* Reconciler Reflection *******/
  {
    moduleType: RENDERER_UTILS,
    bundleTypes: [NODE_DEV, NODE_PROD],
    entry: 'react-reconciler/reflection',
    global: 'ReactFiberTreeReflection',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: [],
  },

  /******* Reconciler Constants *******/
  {
    moduleType: RENDERER_UTILS,
    bundleTypes: [NODE_DEV, NODE_PROD],
    entry: 'react-reconciler/constants',
    global: 'ReactReconcilerConstants',
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
      UMD_DEV,
      UMD_PROD,
      RN_FB_DEV,
      RN_FB_PROD,
      RN_FB_PROFILING,
    ],
    moduleType: ISOMORPHIC,
    entry: 'react-is',
    global: 'ReactIs',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: ['ReactNativeInternalFeatureFlags'],
  },

  /******* React Debug Tools *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-debug-tools',
    global: 'ReactDebugTools',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [],
  },

  /******* React Cache (experimental, old) *******/
  {
    // This is only used by our own tests.
    // We can delete it later.
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-cache',
    global: 'ReactCacheOld',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: ['react', 'scheduler'],
  },

  /******* createComponentWithSubscriptions *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'create-subscription',
    global: 'createSubscription',
    externals: ['react'],
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    babel: opts =>
      Object.assign({}, opts, {
        plugins: opts.plugins.concat([
          [require.resolve('@babel/plugin-transform-classes'), {loose: true}],
        ]),
      }),
  },

  /******* Hook for managing subscriptions safely *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'use-subscription',
    global: 'useSubscription',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },

  /******* useSyncExternalStore *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'use-sync-external-store',
    global: 'useSyncExternalStore',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },

  /******* useSyncExternalStore (shim) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'use-sync-external-store/shim',
    global: 'useSyncExternalStore',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },

  /******* useSyncExternalStore (shim, native) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'use-sync-external-store/shim/index.native',
    global: 'useSyncExternalStore',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },

  /******* useSyncExternalStoreWithSelector *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'use-sync-external-store/with-selector',
    global: 'useSyncExternalStoreWithSelector',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    externals: ['react'],
  },

  /******* useSyncExternalStoreWithSelector (shim) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'use-sync-external-store/shim/with-selector',
    global: 'useSyncExternalStoreWithSelector',
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
    global: 'Scheduler',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    externals: ['ReactNativeInternalFeatureFlags'],
  },

  /******* React Scheduler Mock (experimental) *******/
  {
    bundleTypes: [
      UMD_DEV,
      UMD_PROD,
      NODE_DEV,
      NODE_PROD,
      FB_WWW_DEV,
      FB_WWW_PROD,
      RN_FB_DEV,
      RN_FB_PROD,
    ],
    moduleType: ISOMORPHIC,
    entry: 'scheduler/unstable_mock',
    global: 'SchedulerMock',
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
    global: 'SchedulerPostTask',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
    externals: [],
  },

  /******* Jest React (experimental) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'jest-react',
    global: 'JestReact',
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
    global: 'ESLintPluginReactHooks',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [],
  },

  /******* React Fresh *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-refresh/babel',
    global: 'ReactFreshBabelPlugin',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD, FB_WWW_DEV],
    moduleType: ISOMORPHIC,
    entry: 'react-refresh/runtime',
    global: 'ReactFreshRuntime',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
    externals: [],
  },
];

// Based on deep-freeze by substack (public domain)
function deepFreeze(o) {
  Object.freeze(o);
  Object.getOwnPropertyNames(o).forEach(function(prop) {
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

function getOriginalFilename(bundle, bundleType) {
  let name = bundle.name || bundle.entry;
  const globalName = bundle.global;
  // we do this to replace / to -, for react-dom/server
  name = name.replace('/index.', '.').replace('/', '-');
  switch (bundleType) {
    case NODE_ES2015:
      return `${name}.js`;
    case NODE_ESM:
      return `${name}.js`;
    case UMD_DEV:
      return `${name}.development.js`;
    case UMD_PROD:
      return `${name}.production.min.js`;
    case UMD_PROFILING:
      return `${name}.profiling.min.js`;
    case NODE_DEV:
      return `${name}.development.js`;
    case NODE_PROD:
      return `${name}.production.min.js`;
    case NODE_PROFILING:
      return `${name}.profiling.min.js`;
    case FB_WWW_DEV:
    case RN_OSS_DEV:
    case RN_FB_DEV:
      return `${globalName}-dev.js`;
    case FB_WWW_PROD:
    case RN_OSS_PROD:
    case RN_FB_PROD:
      return `${globalName}-prod.js`;
    case FB_WWW_PROFILING:
    case RN_FB_PROFILING:
    case RN_OSS_PROFILING:
      return `${globalName}-profiling.js`;
  }
}

function getFilename(bundle, bundleType) {
  const originalFilename = getOriginalFilename(bundle, bundleType);
  // Ensure .server.js or .client.js is the final suffix.
  // This is important for the Server tooling convention.
  if (originalFilename.indexOf('.server.') !== -1) {
    return originalFilename
      .replace('.server.', '.')
      .replace('.js', '.server.js');
  }
  if (originalFilename.indexOf('.client.') !== -1) {
    return originalFilename
      .replace('.client.', '.')
      .replace('.js', '.client.js');
  }
  return originalFilename;
}

module.exports = {
  bundleTypes,
  moduleTypes,
  bundles,
  getFilename,
};
