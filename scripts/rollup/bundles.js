'use strict';

const bundleTypes = {
  UMD_DEV: 'UMD_DEV',
  UMD_PROD: 'UMD_PROD',
  NODE_DEV: 'NODE_DEV',
  NODE_PROD: 'NODE_PROD',
  FB_DEV: 'FB_DEV',
  FB_PROD: 'FB_PROD',
  RN_DEV: 'RN_DEV',
  RN_PROD: 'RN_PROD',
};

const UMD_DEV = bundleTypes.UMD_DEV;
const UMD_PROD = bundleTypes.UMD_PROD;
const NODE_DEV = bundleTypes.NODE_DEV;
const NODE_PROD = bundleTypes.NODE_PROD;
const FB_DEV = bundleTypes.FB_DEV;
const FB_PROD = bundleTypes.FB_PROD;
const RN_DEV = bundleTypes.RN_DEV;
const RN_PROD = bundleTypes.RN_PROD;

const moduleTypes = {
  ISOMORPHIC: 'ISOMORPHIC',
  RENDERER: 'RENDERER',
  RECONCILER: 'RECONCILER',
};

const ISOMORPHIC = moduleTypes.ISOMORPHIC;
const RENDERER = moduleTypes.RENDERER;
const RECONCILER = moduleTypes.RECONCILER;

const babelOptsReact = {
  exclude: 'node_modules/**',
  presets: [],
  plugins: [],
};

const babelOptsReactART = Object.assign({}, babelOptsReact, {
  // Include JSX
  presets: babelOptsReact.presets.concat([
    require.resolve('babel-preset-react'),
  ]),
});

const bundles = [
  /******* Isomorphic *******/
  {
    babelOpts: babelOptsReact,
    bundleTypes: [UMD_DEV, UMD_PROD, NODE_DEV, NODE_PROD, FB_DEV, FB_PROD],
    config: {
      destDir: 'build/',
      moduleName: 'React',
      sourceMap: false,
    },
    entry: 'src/isomorphic/ReactEntry',
    externals: [
      'create-react-class/factory',
      'prop-types',
      'prop-types/checkPropTypes',
    ],
    fbEntry: 'src/isomorphic/ReactEntry',
    hasteName: 'React',
    moduleType: ISOMORPHIC,
    label: 'core',
    manglePropertiesOnProd: false,
    name: 'react',
    paths: [
      'src/isomorphic/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },

  /******* React DOM *******/
  {
    babelOpts: babelOptsReact,
    bundleTypes: [UMD_DEV, UMD_PROD, NODE_DEV, NODE_PROD, FB_DEV, FB_PROD],
    config: {
      destDir: 'build/',
      globals: {
        react: 'React',
      },
      moduleName: 'ReactDOM',
      sourceMap: false,
    },
    entry: 'src/renderers/dom/fiber/ReactDOMFiberEntry',
    externals: ['prop-types', 'prop-types/checkPropTypes'],
    fbEntry: 'src/fb/ReactDOMFiberFBEntry',
    hasteName: 'ReactDOMFiber',
    moduleType: RENDERER,
    label: 'dom-fiber',
    manglePropertiesOnProd: false,
    name: 'react-dom',
    paths: [
      'src/renderers/dom/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },
  {
    babelOpts: babelOptsReact,
    bundleTypes: [FB_DEV, NODE_DEV, NODE_PROD],
    config: {
      destDir: 'build/',
      globals: {
        react: 'React',
      },
      moduleName: 'ReactTestUtils',
      sourceMap: false,
    },
    entry: 'src/renderers/dom/test/ReactTestUtilsEntry',
    externals: [
      'prop-types',
      'prop-types/checkPropTypes',
      'react',
      'react-dom',
    ],
    fbEntry: 'src/renderers/dom/test/ReactTestUtilsEntry',
    hasteName: 'ReactTestUtils',
    moduleType: RENDERER,
    label: 'test-utils',
    manglePropertiesOnProd: false,
    name: 'react-dom/test-utils',
    paths: [
      'src/renderers/dom/test/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },
  /* React DOM internals required for react-native-web (e.g., to shim native events from react-dom) */
  {
    babelOpts: babelOptsReact,
    bundleTypes: [UMD_DEV, UMD_PROD, NODE_DEV, NODE_PROD, FB_DEV, FB_PROD],
    config: {
      destDir: 'build/',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
      moduleName: 'ReactDOMUnstableNativeDependencies',
      sourceMap: false,
    },
    entry: 'src/renderers/dom/shared/ReactDOMUnstableNativeDependenciesEntry',
    externals: [
      'react-dom',
      'ReactDOM',
      'prop-types',
      'prop-types/checkPropTypes',
    ],
    fbEntry: 'src/renderers/dom/shared/ReactDOMUnstableNativeDependenciesEntry',
    hasteName: 'ReactDOMUnstableNativeDependencies',
    moduleType: RENDERER,
    label: 'dom-unstable-native-dependencies',
    manglePropertiesOnProd: false,
    name: 'react-dom/unstable-native-dependencies',
    paths: [
      'src/renderers/dom/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },

  /******* React DOM Server *******/
  {
    babelOpts: babelOptsReact,
    bundleTypes: [UMD_DEV, UMD_PROD, NODE_DEV, NODE_PROD, FB_DEV, FB_PROD],
    config: {
      destDir: 'build/',
      globals: {
        react: 'React',
      },
      moduleName: 'ReactDOMServer',
      sourceMap: false,
    },
    entry: 'src/renderers/dom/ReactDOMServerBrowserEntry',
    externals: ['prop-types', 'prop-types/checkPropTypes'],
    fbEntry: 'src/renderers/dom/ReactDOMServerBrowserEntry',
    hasteName: 'ReactDOMServer',
    moduleType: RENDERER,
    label: 'dom-server-browser',
    manglePropertiesOnProd: false,
    name: 'react-dom/server.browser',
    paths: [
      'src/renderers/dom/**/*.js',
      'src/renderers/shared/**/*.js',
      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },

  {
    babelOpts: babelOptsReact,
    bundleTypes: [NODE_DEV, NODE_PROD],
    config: {
      destDir: 'build/',
      globals: {
        react: 'React',
      },
      moduleName: 'ReactDOMNodeStream',
      sourceMap: false,
    },
    entry: 'src/renderers/dom/ReactDOMServerNodeEntry',
    externals: ['prop-types', 'prop-types/checkPropTypes', 'stream'],
    moduleType: RENDERER,
    label: 'dom-server-server-node',
    manglePropertiesOnProd: false,
    name: 'react-dom/server.node',
    paths: [
      'src/renderers/dom/**/*.js',
      'src/renderers/shared/**/*.js',
      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },

  /******* React ART *******/
  {
    babelOpts: babelOptsReactART,
    // TODO: we merge react-art repo into this repo so the NODE_DEV and NODE_PROD
    // builds sync up to the building of the package directories
    bundleTypes: [UMD_DEV, UMD_PROD, NODE_DEV, NODE_PROD, FB_DEV, FB_PROD],
    config: {
      destDir: 'build/',
      globals: {
        react: 'React',
      },
      moduleName: 'ReactART',
      sourceMap: false,
    },
    entry: 'src/renderers/art/ReactARTFiberEntry',
    externals: [
      'art/modes/current',
      'art/modes/fast-noSideEffects',
      'art/core/transform',
      'prop-types/checkPropTypes',
      'react-dom',
    ],
    fbEntry: 'src/renderers/art/ReactARTFiberEntry',
    hasteName: 'ReactARTFiber',
    moduleType: RENDERER,
    label: 'art-fiber',
    manglePropertiesOnProd: false,
    name: 'react-art',
    paths: [
      'src/renderers/art/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },

  /******* React Native *******/
  {
    babelOpts: babelOptsReact,
    bundleTypes: [RN_DEV, RN_PROD],
    config: {
      destDir: 'build/',
      moduleName: 'ReactNativeFiber',
      sourceMap: false,
    },
    entry: 'src/renderers/native/ReactNativeFiberEntry',
    externals: [
      'ExceptionsManager',
      'InitializeCore',
      'Platform',
      'RCTEventEmitter',
      'TextInputState',
      'UIManager',
      'View',
      'deepDiffer',
      'deepFreezeAndThrowOnMutationInDev',
      'flattenStyle',
      'prop-types/checkPropTypes',
    ],
    hasteName: 'ReactNativeFiber',
    moduleType: RENDERER,
    label: 'native-fiber',
    manglePropertiesOnProd: false,
    name: 'react-native-renderer',
    paths: [
      'src/renderers/native/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },

  /******* React Native RT *******/
  {
    babelOpts: babelOptsReact,
    bundleTypes: [RN_DEV, RN_PROD],
    config: {
      destDir: 'build/',
      moduleName: 'ReactNativeRTFiber',
      sourceMap: false,
    },
    entry: 'src/renderers/native-rt/ReactNativeRTFiberEntry',
    externals: [
      'ExceptionsManager',
      'InitializeCore',
      'Platform',
      'BatchedBridge',
      'RTManager',
      'prop-types/checkPropTypes',
    ],
    hasteName: 'ReactNativeRTFiber',
    isRenderer: true,
    label: 'native-rt-fiber',
    manglePropertiesOnProd: false,
    name: 'react-native-rt-renderer',
    paths: [
      'src/renderers/native/**/*.js', // This is used since we reuse the error dialog code
      'src/renderers/native-rt/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },

  /******* React Native CS *******/
  {
    babelOpts: babelOptsReact,
    bundleTypes: [RN_DEV, RN_PROD],
    config: {
      destDir: 'build/',
      moduleName: 'ReactNativeCSFiber',
      sourceMap: false,
    },
    entry: 'src/renderers/native-cs/ReactNativeCSFiberEntry',
    externals: ['prop-types/checkPropTypes'],
    hasteName: 'ReactNativeCSFiber',
    isRenderer: true,
    label: 'native-cs-fiber',
    manglePropertiesOnProd: false,
    name: 'react-native-cs-renderer',
    paths: [
      'src/renderers/native-cs/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },

  /******* React Test Renderer *******/
  {
    babelOpts: babelOptsReact,
    bundleTypes: [FB_DEV, NODE_DEV, NODE_PROD],
    config: {
      destDir: 'build/',
      moduleName: 'ReactTestRenderer',
      sourceMap: false,
    },
    entry: 'src/renderers/testing/ReactTestRendererFiberEntry',
    externals: ['prop-types/checkPropTypes'],
    fbEntry: 'src/renderers/testing/ReactTestRendererFiberEntry',
    hasteName: 'ReactTestRendererFiber',
    moduleType: RENDERER,
    label: 'test-fiber',
    manglePropertiesOnProd: false,
    name: 'react-test-renderer',
    paths: [
      'src/renderers/native/**/*.js',
      'src/renderers/shared/**/*.js',
      'src/renderers/testing/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },
  {
    babelOpts: babelOptsReact,
    bundleTypes: [FB_DEV, NODE_DEV, NODE_PROD],
    config: {
      destDir: 'build/',
      moduleName: 'ReactShallowRenderer',
      sourceMap: false,
    },
    entry: 'src/renderers/testing/ReactShallowRendererEntry',
    externals: [
      'react-dom',
      'prop-types/checkPropTypes',
      'react-test-renderer',
    ],
    fbEntry: 'src/renderers/testing/ReactShallowRendererEntry',
    hasteName: 'ReactShallowRenderer',
    moduleType: RENDERER,
    label: 'shallow-renderer',
    manglePropertiesOnProd: false,
    name: 'react-test-renderer/shallow',
    paths: [
      'src/renderers/shared/**/*.js',
      'src/renderers/testing/**/*.js',
      'src/shared/**/*.js',
    ],
  },

  /******* React Noop Renderer (used only for fixtures/fiber-debugger) *******/
  {
    babelOpts: babelOptsReact,
    bundleTypes: [NODE_DEV],
    config: {
      destDir: 'build/',
      globals: {
        react: 'React',
      },
      moduleName: 'ReactNoop',
      sourceMap: false,
    },
    entry: 'src/renderers/noop/ReactNoopEntry',
    externals: ['prop-types/checkPropTypes', 'jest-matchers'],
    moduleType: RENDERER,
    label: 'noop-fiber',
    manglePropertiesOnProd: false,
    name: 'react-noop-renderer',
    paths: [
      'src/renderers/noop/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },

  /******* React Reconciler *******/
  {
    babelOpts: babelOptsReact,
    bundleTypes: [NODE_DEV, NODE_PROD],
    config: {
      destDir: 'build/',
      globals: {
        react: 'React',
      },
      moduleName: 'ReactReconciler',
      sourceMap: false,
    },
    entry: 'src/renderers/shared/fiber/ReactFiberReconciler',
    externals: ['react', 'prop-types/checkPropTypes'],
    moduleType: RECONCILER,
    label: 'react-reconciler',
    manglePropertiesOnProd: false,
    name: 'react-reconciler',
    paths: [
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
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
