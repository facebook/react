'use strict';

const bundleTypes = {
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
    ],
    moduleType: ISOMORPHIC,
    entry: 'react',
    global: 'React',
    externals: [],
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

  /******* Test Utils *******/
  {
    moduleType: RENDERER_UTILS,
    bundleTypes: [FB_WWW_DEV, NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    entry: 'react-dom/test-utils',
    global: 'ReactTestUtils',
    externals: ['react', 'react-dom'],
  },

  /* React DOM internals required for react-native-web (e.g., to shim native events from react-dom) */
  {
    bundleTypes: [
      UMD_DEV,
      UMD_PROD,
      NODE_DEV,
      NODE_PROD,
      FB_WWW_DEV,
      FB_WWW_PROD,
    ],
    moduleType: RENDERER_UTILS,
    entry: 'react-dom/unstable-native-dependencies',
    global: 'ReactDOMUnstableNativeDependencies',
    externals: ['react', 'react-dom'],
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
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: NON_FIBER_RENDERER,
    entry: 'react-dom/server.node',
    externals: ['react', 'stream'],
  },

  /******* React DOM Fizz Server *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    moduleType: RENDERER,
    entry: 'react-dom/unstable-fizz.browser',
    global: 'ReactDOMFizzServer',
    externals: ['react'],
  },
  {
    bundleTypes: [NODE_DEV, NODE_PROD, FB_WWW_DEV, FB_WWW_PROD],
    moduleType: RENDERER,
    entry: 'react-dom/unstable-fizz.node',
    global: 'ReactDOMFizzServer',
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
        presets: opts.presets.concat([require.resolve('babel-preset-react')]),
      }),
  },

  /******* React Native *******/
  {
    bundleTypes: [RN_FB_DEV, RN_FB_PROD, RN_FB_PROFILING],
    moduleType: RENDERER,
    entry: 'react-native-renderer',
    global: 'ReactNativeRenderer',
    externals: ['react-native'],
  },
  {
    bundleTypes: [RN_OSS_DEV, RN_OSS_PROD, RN_OSS_PROFILING],
    moduleType: RENDERER,
    entry: 'react-native-renderer',
    global: 'ReactNativeRenderer',
    externals: ['react-native'],
  },

  /******* React Native Fabric *******/
  {
    bundleTypes: [RN_FB_DEV, RN_FB_PROD, RN_FB_PROFILING],
    moduleType: RENDERER,
    entry: 'react-native-renderer/fabric',
    global: 'ReactFabric',
    externals: ['react-native'],
  },
  {
    bundleTypes: [RN_OSS_DEV, RN_OSS_PROD, RN_OSS_PROFILING],
    moduleType: RENDERER,
    entry: 'react-native-renderer/fabric',
    global: 'ReactFabric',
    externals: ['react-native'],
  },

  /******* React Test Renderer *******/
  {
    bundleTypes: [FB_WWW_DEV, NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    moduleType: RENDERER,
    entry: 'react-test-renderer',
    global: 'ReactTestRenderer',
    externals: ['react', 'scheduler', 'scheduler/unstable_mock'],
  },
  {
    bundleTypes: [FB_WWW_DEV, NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    moduleType: NON_FIBER_RENDERER,
    entry: 'react-test-renderer/shallow',
    global: 'ReactShallowRenderer',
    externals: ['react', 'scheduler', 'scheduler/unstable_mock'],
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

  /******* React Reconciler *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-reconciler',
    global: 'ReactReconciler',
    externals: ['react'],
  },

  /******* React Persistent Reconciler *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-reconciler/persistent',
    global: 'ReactPersistentReconciler',
    externals: ['react'],
  },

  /******* React Stream *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-stream',
    global: 'ReactStream',
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

  /******* React Cache (experimental) *******/
  {
    bundleTypes: [
      FB_WWW_DEV,
      FB_WWW_PROD,
      NODE_DEV,
      NODE_PROD,
      UMD_DEV,
      UMD_PROD,
    ],
    moduleType: ISOMORPHIC,
    entry: 'react-cache',
    global: 'ReactCache',
    externals: ['react', 'scheduler'],
  },

  /******* createComponentWithSubscriptions (experimental) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'create-subscription',
    global: 'createSubscription',
    externals: ['react'],
  },

  /******* React Scheduler (experimental) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, FB_WWW_DEV, FB_WWW_PROD],
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
    ],
    moduleType: ISOMORPHIC,
    entry: 'scheduler/unstable_mock',
    global: 'SchedulerMock',
    externals: [],
  },

  /******* Jest React (experimental) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, FB_WWW_DEV, FB_WWW_PROD],
    moduleType: ISOMORPHIC,
    entry: 'jest-react',
    global: 'JestReact',
    externals: [],
  },

  /******* ESLint Plugin for Hooks (proposal) *******/
  {
    // TODO: it's awkward to create a bundle for this but if we don't, the package
    // won't get copied. We also can't create just DEV bundle because it contains a
    // NODE_ENV check inside. We should probably tweak our build process to allow
    // "raw" packages that don't get bundled.
    bundleTypes: [NODE_DEV, NODE_PROD, FB_WWW_DEV],
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
    bundleTypes: [NODE_DEV, NODE_PROD],
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
    ],
    moduleType: ISOMORPHIC,
    entry: 'scheduler/tracing',
    global: 'SchedulerTracing',
    externals: [],
  },

  /******* React Events (experimental) *******/
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
    entry: 'react-events/press',
    global: 'ReactEventsPress',
    externals: ['react'],
  },

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
    entry: 'react-events/hover',
    global: 'ReactEventsHover',
    externals: ['react'],
  },

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
    entry: 'react-events/focus',
    global: 'ReactEventsFocus',
    externals: ['react'],
  },

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
    entry: 'react-events/focus-scope',
    global: 'ReactEventsFocusScope',
    externals: ['react'],
  },

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
    entry: 'react-events/swipe',
    global: 'ReactEventsSwipe',
    externals: ['react'],
  },

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
    entry: 'react-events/drag',
    global: 'ReactEventsDrag',
    externals: ['react'],
  },

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
    entry: 'react-events/input',
    global: 'ReactEventsInput',
    externals: ['react'],
  },

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
    entry: 'react-events/scroll',
    global: 'ReactEventsScroll',
    externals: ['react'],
  },

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
    entry: 'react-events/keyboard',
    global: 'ReactEventsKeyboard',
    externals: ['react'],
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

module.exports = {
  bundleTypes,
  moduleTypes,
  bundles,
};
