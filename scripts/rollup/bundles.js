'use strict';

const bundleTypes = {
  UMD_DEV: 'UMD_DEV',
  UMD_PROD: 'UMD_PROD',
  NODE_DEV: 'NODE_DEV',
  NODE_PROD: 'NODE_PROD',
  FB_WWW_DEV: 'FB_WWW_DEV',
  FB_WWW_PROD: 'FB_WWW_PROD',
  RN_OSS_DEV: 'RN_OSS_DEV',
  RN_OSS_PROD: 'RN_OSS_PROD',
  RN_FB_DEV: 'RN_FB_DEV',
  RN_FB_PROD: 'RN_FB_PROD',
};

const UMD_DEV = bundleTypes.UMD_DEV;
const UMD_PROD = bundleTypes.UMD_PROD;
const NODE_DEV = bundleTypes.NODE_DEV;
const NODE_PROD = bundleTypes.NODE_PROD;
const FB_WWW_DEV = bundleTypes.FB_WWW_DEV;
const FB_WWW_PROD = bundleTypes.FB_WWW_PROD;
const RN_OSS_DEV = bundleTypes.RN_OSS_DEV;
const RN_OSS_PROD = bundleTypes.RN_OSS_PROD;
const RN_FB_DEV = bundleTypes.RN_FB_DEV;
const RN_FB_PROD = bundleTypes.RN_FB_PROD;

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
    label: 'core',
    bundleTypes: [
      UMD_DEV,
      UMD_PROD,
      NODE_DEV,
      NODE_PROD,
      FB_WWW_DEV,
      FB_WWW_PROD,
    ],
    moduleType: ISOMORPHIC,
    entry: 'react',
    global: 'React',
    externals: [],
  },

  /******* React DOM *******/
  {
    label: 'dom-client',
    bundleTypes: [
      UMD_DEV,
      UMD_PROD,
      NODE_DEV,
      NODE_PROD,
      FB_WWW_DEV,
      FB_WWW_PROD,
    ],
    moduleType: RENDERER,
    entry: 'react-dom',
    global: 'ReactDOM',
    externals: ['react'],
  },

  //******* Test Utils *******/
  {
    label: 'dom-test-utils',
    moduleType: RENDERER_UTILS,
    bundleTypes: [FB_WWW_DEV, NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    entry: 'react-dom/test-utils',
    global: 'ReactTestUtils',
    externals: ['react', 'react-dom'],
  },

  /* React DOM internals required for react-native-web (e.g., to shim native events from react-dom) */
  {
    label: 'dom-unstable-native-dependencies',
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
    label: 'dom-server-browser',
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
    label: 'dom-server-node',
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: NON_FIBER_RENDERER,
    entry: 'react-dom/server.node',
    externals: ['react', 'stream'],
  },

  /******* React ART *******/
  {
    label: 'art',
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
    label: 'native-fb',
    bundleTypes: [RN_FB_DEV, RN_FB_PROD],
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
    label: 'native',
    bundleTypes: [RN_OSS_DEV, RN_OSS_PROD],
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
    label: 'native-fabric-fb',
    bundleTypes: [RN_FB_DEV, RN_FB_PROD],
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
    label: 'native-fabric',
    bundleTypes: [RN_OSS_DEV, RN_OSS_PROD],
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
    label: 'test',
    bundleTypes: [FB_WWW_DEV, NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    moduleType: RENDERER,
    entry: 'react-test-renderer',
    global: 'ReactTestRenderer',
    externals: ['react'],
  },

  {
    label: 'test-shallow',
    bundleTypes: [FB_WWW_DEV, NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    moduleType: NON_FIBER_RENDERER,
    entry: 'react-test-renderer/shallow',
    global: 'ReactShallowRenderer',
    externals: ['react'],
  },

  /******* React Noop Renderer (used for tests) *******/
  {
    label: 'noop',
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-noop-renderer',
    global: 'ReactNoopRenderer',
    externals: ['react', 'expect'],
    // React Noop uses generators. However GCC currently
    // breaks when we attempt to use them in the output.
    // So we precompile them with regenerator, and include
    // it as a runtime dependency of React Noop. In practice
    // this isn't an issue because React Noop is only used
    // in our tests. We wouldn't want to do this for any
    // public package though.
    babel: opts =>
      Object.assign({}, opts, {
        plugins: opts.plugins.concat([
          require.resolve('babel-plugin-transform-regenerator'),
        ]),
      }),
  },

  /******* React Noop Persistent Renderer (used for tests) *******/
  {
    label: 'noop-persistent',
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-noop-renderer/persistent',
    global: 'ReactNoopRendererPersistent',
    externals: ['react', 'expect'],
    // React Noop uses generators. However GCC currently
    // breaks when we attempt to use them in the output.
    // So we precompile them with regenerator, and include
    // it as a runtime dependency of React Noop. In practice
    // this isn't an issue because React Noop is only used
    // in our tests. We wouldn't want to do this for any
    // public package though.
    babel: opts =>
      Object.assign({}, opts, {
        plugins: opts.plugins.concat([
          require.resolve('babel-plugin-transform-regenerator'),
        ]),
      }),
  },

  /******* React Reconciler *******/
  {
    label: 'react-reconciler',
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-reconciler',
    global: 'ReactReconciler',
    externals: ['react'],
  },

  /******* React Persistent Reconciler *******/
  {
    label: 'react-reconciler-persistent',
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: RECONCILER,
    entry: 'react-reconciler/persistent',
    global: 'ReactPersistentReconciler',
    externals: ['react'],
  },

  /******* Reflection *******/
  {
    label: 'reconciler-reflection',
    moduleType: RENDERER_UTILS,
    bundleTypes: [NODE_DEV, NODE_PROD],
    entry: 'react-reconciler/reflection',
    global: 'ReactFiberTreeReflection',
    externals: [],
  },

  /******* React Is *******/
  {
    label: 'react-is',
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

  /******* Simple Cache Provider (experimental) *******/
  {
    label: 'simple-cache-provider',
    bundleTypes: [FB_WWW_DEV, FB_WWW_PROD, NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'simple-cache-provider',
    global: 'SimpleCacheProvider',
    externals: ['react'],
  },

  /******* createComponentWithSubscriptions (experimental) *******/
  {
    label: 'create-subscription',
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'create-subscription',
    global: 'createSubscription',
    externals: ['react'],
  },

  /******* React Scheduler (experimental) *******/
  {
    label: 'react-scheduler',
    bundleTypes: [
      UMD_DEV,
      UMD_PROD,
      NODE_DEV,
      NODE_PROD,
      FB_WWW_DEV,
      FB_WWW_PROD,
    ],
    moduleType: ISOMORPHIC,
    entry: 'react-scheduler',
    global: 'ReactScheduler',
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
