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

const UMD_DEV = bundleTypes.UMD_DEV;
const UMD_PROD = bundleTypes.UMD_PROD;
const UMD_PROFILING = bundleTypes.UMD_PROFILING;
const NODE_DEV = bundleTypes.NODE_DEV;
const NODE_PROD = bundleTypes.NODE_PROD;
const NODE_PROFILING = bundleTypes.NODE_PROFILING;
const FB_WWW_DEV = bundleTypes.FB_WWW_DEV;
const FB_WWW_PROD = bundleTypes.FB_WWW_PROD;
const FB_WWW_PROFILING = bundleTypes.FB_WWW_PROFILING;
const RN_OSS_DEV = bundleTypes.RN_OSS_DEV;
const RN_OSS_PROD = bundleTypes.RN_OSS_PROD;
const RN_OSS_PROFILING = bundleTypes.RN_OSS_PROFILING;
const RN_FB_DEV = bundleTypes.RN_FB_DEV;
const RN_FB_PROD = bundleTypes.RN_FB_PROD;
const RN_FB_PROFILING = bundleTypes.RN_FB_PROFILING;

const moduleTypes = {
  ISOMORPHIC: 'ISOMORPHIC',
  RENDERER: 'RENDERER',
  RENDERER_UTILS: 'RENDERER_UTILS',
  RECONCILER: 'RECONCILER',
  NON_FIBER_RENDERER: 'NON_FIBER_RENDERER',
};

// React
const ISOMORPHIC = moduleTypes.ISOMORPHIC;
// Individual renderers. They bundle the reconciler. (e.g. ReactDOM)
const RENDERER = moduleTypes.RENDERER;
// Helper packages that access specific renderer's internals. (e.g. TestUtils)
const RENDERER_UTILS = moduleTypes.RENDERER_UTILS;
// Standalone reconciler for third-party renderers.
const RECONCILER = moduleTypes.RECONCILER;
// Non-Fiber implementations like SSR and Shallow renderers.
const NON_FIBER_RENDERER = moduleTypes.NON_FIBER_RENDERER;

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

  /******* React Fire *******/
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
    entry: 'react-dom/unstable-fire',
    global: 'ReactFire',
    externals: ['react'],
  },

  /******* React DOM (new scheduler) *******/
  {
    bundleTypes: [
      FB_WWW_DEV,
      FB_WWW_PROD,
      FB_WWW_PROFILING,
      NODE_DEV,
      NODE_PROD,
    ],
    moduleType: RENDERER,
    entry: 'react-dom/unstable-new-scheduler',
    global: 'ReactDOMNewScheduler',
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
    externals: [
      'ExceptionsManager',
      'InitializeCore',
      'Platform',
      'RCTEventEmitter',
      'TextInputState',
      'UIManager',
      'deepDiffer',
      'deepFreezeAndThrowOnMutationInDev',
      'flattenStyle',
      'ReactNativeViewConfigRegistry',
    ],
  },

  {
    bundleTypes: [RN_OSS_DEV, RN_OSS_PROD, RN_OSS_PROFILING],
    moduleType: RENDERER,
    entry: 'react-native-renderer',
    global: 'ReactNativeRenderer',
    externals: [
      'ExceptionsManager',
      'InitializeCore',
      'Platform',
      'RCTEventEmitter',
      'TextInputState',
      'UIManager',
      'deepDiffer',
      'deepFreezeAndThrowOnMutationInDev',
      'flattenStyle',
      'ReactNativeViewConfigRegistry',
    ],
  },

  /******* React Native Fabric *******/
  {
    bundleTypes: [RN_FB_DEV, RN_FB_PROD, RN_FB_PROFILING],
    moduleType: RENDERER,
    entry: 'react-native-renderer/fabric',
    global: 'ReactFabric',
    externals: [
      'ExceptionsManager',
      'InitializeCore',
      'Platform',
      'RCTEventEmitter',
      'TextInputState',
      'UIManager',
      'FabricUIManager',
      'deepDiffer',
      'deepFreezeAndThrowOnMutationInDev',
      'flattenStyle',
      'ReactNativeViewConfigRegistry',
    ],
  },

  {
    bundleTypes: [RN_OSS_DEV, RN_OSS_PROD, RN_OSS_PROFILING],
    moduleType: RENDERER,
    entry: 'react-native-renderer/fabric',
    global: 'ReactFabric',
    externals: [
      'ExceptionsManager',
      'InitializeCore',
      'Platform',
      'RCTEventEmitter',
      'TextInputState',
      'UIManager',
      'FabricUIManager',
      'deepDiffer',
      'deepFreezeAndThrowOnMutationInDev',
      'flattenStyle',
      'ReactNativeViewConfigRegistry',
    ],
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
    bundleTypes: [NODE_DEV, NODE_PROD, FB_WWW_DEV, FB_WWW_PROD],
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
    // TODO: it's awkward to create a bundle for this
    // but if we don't, the package won't get copied.
    // We also can't create just DEV bundle because
    // it contains a NODE_ENV check inside.
    // We should probably tweak our build process
    // to allow "raw" packages that don't get bundled.
    bundleTypes: [NODE_DEV, NODE_PROD, FB_WWW_DEV],
    moduleType: ISOMORPHIC,
    entry: 'eslint-plugin-react-hooks',
    global: 'ESLintPluginReactHooks',
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
    moduleType: ISOMORPHIC,
    entry: 'react-events',
    global: 'ReactEvents',
    externals: [],
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
    entry: 'react-events/press',
    global: 'ReactEventsPress',
    externals: [],
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
    externals: [],
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
    externals: [],
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
    externals: [],
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

module.exports = {
  bundleTypes,
  moduleTypes,
  bundles,
};
