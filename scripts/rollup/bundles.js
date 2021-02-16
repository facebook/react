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
  // Non-Fiber implementations like SSR and Shallow renderers.
  NON_FIBER_RENDERER: 'NON_FIBER_RENDERER',
};

const {
  ISOMORPHIC,
  RENDERER,
  RENDERER_UTILS,
  RECONCILER,
  NON_FIBER_RENDERER,
} = moduleTypes;

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
    externals: [],
  },

  /******* Isomorphic Shared Subset *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react/unstable-shared-subset',
    global: 'React',
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
    externals: ['react'],
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
    externals: ['react'],
  },

  /******* React Fetch Browser (experimental, new) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-fetch/index.browser',
    global: 'ReactFetch',
    externals: ['react'],
  },

  /******* React Fetch Node (experimental, new) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-fetch/index.node',
    global: 'ReactFetch',
    externals: ['react', 'http', 'https'],
  },

  /******* React FS Browser (experimental, new) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-fs/index.browser.server',
    global: 'ReactFilesystem',
    externals: [],
  },

  /******* React FS Node (experimental, new) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-fs/index.node.server',
    global: 'ReactFilesystem',
    externals: ['react', 'fs/promises', 'path'],
  },

  /******* React PG Browser (experimental, new) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-pg/index.browser.server',
    global: 'ReactPostgres',
    externals: [],
  },

  /******* React PG Node (experimental, new) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-pg/index.node.server',
    global: 'ReactPostgres',
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
    externals: ['react'],
  },

  /******* React DOM - www - Uses forked reconciler *******/
  {
    moduleType: RENDERER,
    bundleTypes: [FB_WWW_DEV, FB_WWW_PROD, FB_WWW_PROFILING],
    entry: 'react-dom',
    global: 'ReactDOMForked',
    enableNewReconciler: true,
    externals: ['react'],
  },

  /******* Test Utils *******/
  {
    moduleType: RENDERER_UTILS,
    bundleTypes: [FB_WWW_DEV, NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    entry: 'react-dom/test-utils',
    global: 'ReactTestUtils',
    externals: ['react', 'react-dom'],
  },

  /******* React DOM - www - Testing *******/
  {
    moduleType: RENDERER,
    bundleTypes: [FB_WWW_DEV, FB_WWW_PROD],
    entry: 'react-dom/testing',
    global: 'ReactDOMTesting',
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
    moduleType: NON_FIBER_RENDERER,
    entry: 'react-dom/server.browser',
    global: 'ReactDOMServer',
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
    moduleType: NON_FIBER_RENDERER,
    entry: 'react-dom/server.node',
    externals: ['react', 'stream'],
    babel: opts =>
      Object.assign({}, opts, {
        plugins: opts.plugins.concat([
          [require.resolve('@babel/plugin-transform-classes'), {loose: true}],
        ]),
      }),
  },

  /******* React DOM Fizz Server *******/
  {
    bundleTypes: __EXPERIMENTAL__
      ? [NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD]
      : [],
    moduleType: RENDERER,
    entry: 'react-dom/unstable-fizz.browser',
    global: 'ReactDOMFizzServer',
    externals: ['react', 'react-dom/server'],
  },
  {
    bundleTypes: __EXPERIMENTAL__ ? [NODE_DEV, NODE_PROD] : [],
    moduleType: RENDERER,
    entry: 'react-dom/unstable-fizz.node',
    global: 'ReactDOMFizzServer',
    externals: ['react', 'react-dom/server'],
  },

  /******* React Server DOM Webpack Writer *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack/writer.browser.server',
    global: 'ReactServerDOMWriter',
    externals: ['react', 'react-dom/server'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack/writer.node.server',
    global: 'ReactServerDOMWriter',
    externals: ['react', 'react-dom/server'],
  },

  /******* React Server DOM Webpack Reader *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-webpack',
    global: 'ReactServerDOMReader',
    externals: ['react'],
  },

  /******* React Server DOM Webpack Plugin *******/
  {
    bundleTypes: [NODE_ES2015],
    moduleType: RENDERER_UTILS,
    entry: 'react-server-dom-webpack/plugin',
    global: 'ReactServerWebpackPlugin',
    externals: ['fs', 'path', 'url', 'neo-async'],
  },

  /******* React Server DOM Webpack Node.js Loader *******/
  {
    bundleTypes: [NODE_ESM],
    moduleType: RENDERER_UTILS,
    entry: 'react-server-dom-webpack/node-loader',
    global: 'ReactServerWebpackNodeLoader',
    externals: ['acorn'],
  },

  /******* React Server DOM Webpack Node.js CommonJS Loader *******/
  {
    bundleTypes: [NODE_ES2015],
    moduleType: RENDERER_UTILS,
    entry: 'react-server-dom-webpack/node-register',
    global: 'ReactFlightWebpackNodeRegister',
    externals: ['url', 'module'],
  },

  /******* React Server DOM Relay Writer *******/
  {
    bundleTypes: [FB_WWW_DEV, FB_WWW_PROD],
    moduleType: RENDERER,
    entry: 'react-server-dom-relay/server',
    global: 'ReactFlightDOMRelayServer', // TODO: Rename to Writer
    externals: [
      'react',
      'react-dom/server',
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
    externals: [
      'react',
      'ReactFlightNativeRelayServerIntegration',
      'JSResourceReferenceImpl',
    ],
  },

  /******* React Server Native Relay Reader *******/
  {
    bundleTypes: [RN_FB_DEV, RN_FB_PROD],
    moduleType: RENDERER,
    entry: 'react-server-native-relay',
    global: 'ReactFlightNativeRelayClient', // TODO: Rename to Reader
    externals: [
      'react',
      'ReactFlightNativeRelayClientIntegration',
      'JSResourceReferenceImpl',
    ],
  },

  /******* React Suspense Test Utils *******/
  {
    bundleTypes: [NODE_ES2015],
    moduleType: RENDERER_UTILS,
    entry: 'react-suspense-test-utils',
    global: 'ReactSuspenseTestUtils',
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
    externals: ['react-native'],
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
    externals: ['react-native'],
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
    externals: ['react', 'scheduler', 'scheduler/unstable_mock'],
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
    externals: ['react', 'scheduler', 'scheduler/unstable_mock', 'expect'],
  },

  /******* React Noop Persistent Renderer (used for tests) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-noop-renderer/persistent',
    global: 'ReactNoopRendererPersistent',
    externals: ['react', 'scheduler', 'expect'],
  },

  /******* React Noop Server Renderer (used for tests) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-noop-renderer/server',
    global: 'ReactNoopRendererServer',
    externals: ['react', 'scheduler', 'expect'],
  },

  /******* React Noop Flight Server (used for tests) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-noop-renderer/flight-server',
    global: 'ReactNoopFlightServer',
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
    externals: ['react'],
  },

  /******* React Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-server',
    global: 'ReactServer',
    externals: ['react'],
  },

  /******* React Flight Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-server/flight',
    global: 'ReactFlightServer',
    externals: ['react'],
  },

  /******* React Flight Client *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-client/flight',
    global: 'ReactFlightClient',
    externals: ['react'],
  },

  /******* Reflection *******/
  {
    moduleType: RENDERER_UTILS,
    bundleTypes: [NODE_DEV, NODE_PROD],
    entry: 'react-reconciler/reflection',
    global: 'ReactFiberTreeReflection',
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
    ],
    moduleType: ISOMORPHIC,
    entry: 'react-is',
    global: 'ReactIs',
    externals: [],
  },

  /******* React Debug Tools *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-debug-tools',
    global: 'ReactDebugTools',
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
    externals: ['react', 'scheduler'],
  },

  /******* createComponentWithSubscriptions *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'create-subscription',
    global: 'createSubscription',
    externals: ['react'],
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
    externals: ['react'],
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
    externals: [],
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
    externals: [],
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
    externals: [],
  },

  /******* React Scheduler Post Task Only (experimental) *******/
  {
    bundleTypes: [
      NODE_DEV,
      NODE_PROD,
      FB_WWW_DEV,
      FB_WWW_PROD,
      FB_WWW_PROFILING,
    ],
    moduleType: ISOMORPHIC,
    entry: 'scheduler/unstable_post_task_only',
    global: 'SchedulerPostTaskOnly',
    externals: [],
  },

  /******* React Scheduler No DOM (experimental) *******/
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
    entry: 'scheduler/unstable_no_dom',
    global: 'SchedulerNoDOM',
    externals: [],
  },

  /******* Jest React (experimental) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'jest-react',
    global: 'JestReact',
    externals: [],
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
    externals: [],
  },

  /******* React Fresh *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-refresh/babel',
    global: 'ReactFreshBabelPlugin',
    externals: [],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD, FB_WWW_DEV],
    moduleType: ISOMORPHIC,
    entry: 'react-refresh/runtime',
    global: 'ReactFreshRuntime',
    externals: [],
  },

  {
    bundleTypes: [
      FB_WWW_DEV,
      FB_WWW_PROD,
      FB_WWW_PROFILING,
      NODE_DEV,
      NODE_PROD,
      NODE_PROFILING,
      RN_FB_DEV,
      RN_FB_PROD,
      RN_FB_PROFILING,
    ],
    moduleType: ISOMORPHIC,
    entry: 'scheduler/tracing',
    global: 'SchedulerTracing',
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
  let name = bundle.entry;
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
