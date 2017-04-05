'use strict';

const devExpressionWithCodes = require('../error-codes/dev-expression-with-codes');

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
// const RN_DEV = bundleTypes.RN_DEV;
// const RN_PROD = bundleTypes.RN_PROD;

const babelOptsReact = {
  exclude: 'node_modules/**',
  plugins: [
    devExpressionWithCodes, // this pass has to run before `rewrite-modules`
  ],
};

const babelOptsReactART = Object.assign({}, babelOptsReact, {
  // Include JSX
  presets: [require.resolve('babel-preset-react')],
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
    entry: 'src/umd/ReactUMDEntry.js',
    externals: [],
    fbEntry: 'src/fb/ReactFBEntry.js',
    hasteName: 'React',
    isRenderer: false,
    label: 'core',
    manglePropertiesOnProd: false,
    name: 'react',
    paths: [
      'src/umd/ReactUMDEntry.js',
      'src/umd/ReactWithAddonsUMDEntry.js',
      'src/umd/shims/**/*.js',

      'src/isomorphic/**/*.js',
      'src/addons/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },

  /******* React DOM *******/
  {
    babelOpts: babelOptsReact,
    bundleTypes: [FB_DEV, FB_PROD],
    config: {
      destDir: 'build/',
      globals: {
        react: 'React',
      },
      moduleName: 'ReactDOM',
      sourceMap: false,
    },
    entry: 'src/umd/ReactDOMUMDEntry.js',
    externals: [],
    fbEntry: 'src/fb/ReactDOMFBEntry.js',
    hasteName: 'ReactDOMStack',
    isRenderer: true,
    label: 'dom-stack',
    manglePropertiesOnProd: false,
    name: 'react-dom-stack',
    paths: [
      'src/umd/ReactDOMUMDEntry.js',

      'src/renderers/dom/**/*.js',
      'src/renderers/shared/**/*.js',
      'src/test/**/*.js', // ReactTestUtils is currently very coupled to DOM.

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },
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
    entry: 'src/umd/ReactDOMUMDEntry.js',
    externals: [],
    fbEntry: 'src/fb/ReactDOMFiberFBEntry.js',
    hasteName: 'ReactDOMFiber',
    isRenderer: true,
    label: 'dom-fiber',
    manglePropertiesOnProd: false,
    name: 'react-dom',
    paths: [
      'src/umd/ReactDOMUMDEntry.js',

      'src/renderers/dom/**/*.js',
      'src/renderers/shared/**/*.js',
      'src/test/**/*.js', // ReactTestUtils is currently very coupled to DOM.

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },

  /******* React DOM Server *******/
  {
    babelOpts: babelOptsReact,
    // TODO: deal with the Node version of react-dom-server package
    bundleTypes: [UMD_DEV, UMD_PROD, NODE_DEV, NODE_PROD, FB_DEV, FB_PROD],
    config: {
      destDir: 'build/',
      globals: {
        react: 'React',
      },
      moduleName: 'ReactDOMServer',
      sourceMap: false,
    },
    entry: 'src/umd/ReactDOMServerUMDEntry.js',
    externals: [],
    fbEntry: 'src/umd/ReactDOMServerUMDEntry.js',
    hasteName: 'ReactDOMServerStack',
    isRenderer: true,
    label: 'dom-server',
    manglePropertiesOnProd: false,
    name: 'react-dom/server',
    paths: [
      'src/umd/ReactDOMServerUMDEntry.js',

      'src/renderers/dom/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },
  // TODO: there is no Fiber version of ReactDOMServer.

  /******* React ART *******/
  {
    babelOpts: babelOptsReactART,
    // TODO: we merge react-art repo into this repo so the NODE_DEV and NODE_PROD
    // builds sync up to the building of the package directories
    bundleTypes: [FB_DEV, FB_PROD],
    config: {
      destDir: 'build/',
      globals: {
        react: 'React',
      },
      moduleName: 'ReactART',
      sourceMap: false,
    },
    entry: 'src/renderers/art/ReactARTStack.js',
    externals: [
      'art/modes/current',
      'art/modes/fast-noSideEffects',
      'art/core/transform',
    ],
    fbEntry: 'src/renderers/art/ReactARTStack.js',
    hasteName: 'ReactARTStack',
    isRenderer: true,
    label: 'art-stack',
    manglePropertiesOnProd: false,
    name: 'react-art',
    paths: [
      // TODO: it relies on ReactDOMFrameScheduling. Need to move to shared/?
      'src/renderers/dom/**/*.js',
      'src/renderers/art/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },
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
    entry: 'src/renderers/art/ReactARTFiber.js',
    externals: [
      'art/modes/current',
      'art/modes/fast-noSideEffects',
      'art/core/transform',
    ],
    fbEntry: 'src/renderers/art/ReactARTFiber.js',
    hasteName: 'ReactARTFiber',
    isRenderer: true,
    label: 'art-fiber',
    manglePropertiesOnProd: false,
    name: 'react-art',
    paths: [
      // TODO: it relies on ReactDOMFrameScheduling. Need to move to shared/?
      'src/renderers/dom/**/*.js',
      'src/renderers/art/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },

  /******* React Native *******/
  {
    babelOpts: babelOptsReact,
    bundleTypes: [
      /* RN_DEV, RN_PROD */
    ],
    config: {
      destDir: 'build/',
      moduleName: 'ReactNativeStack',
      sourceMap: false,
    },
    entry: 'src/renderers/native/ReactNativeStack.js',
    externals: [
      'ExceptionsManager',
      'InitializeCore',
      'ReactNativeFeatureFlags',
      'RCTEventEmitter',
      'TextInputState',
      'UIManager',
      'View',
      'deepDiffer',
      'deepFreezeAndThrowOnMutationInDev',
      'flattenStyle',
    ],
    hasteName: 'ReactNativeStack',
    isRenderer: true,
    label: 'native-stack',
    manglePropertiesOnProd: false,
    name: 'react-native-renderer',
    paths: [
      'src/renderers/native/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },
  {
    babelOpts: babelOptsReact,
    bundleTypes: [
      /* RN_DEV, RN_PROD */
    ],
    config: {
      destDir: 'build/',
      moduleName: 'ReactNativeFiber',
      sourceMap: false,
    },
    entry: 'src/renderers/native/ReactNativeFiber.js',
    externals: [
      'ExceptionsManager',
      'InitializeCore',
      'ReactNativeFeatureFlags',
      'RCTEventEmitter',
      'TextInputState',
      'UIManager',
      'View',
      'deepDiffer',
      'deepFreezeAndThrowOnMutationInDev',
      'flattenStyle',
    ],
    hasteName: 'ReactNativeFiber',
    isRenderer: true,
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

  /******* React Test Renderer *******/
  {
    babelOpts: babelOptsReact,
    bundleTypes: [FB_DEV, NODE_DEV],
    config: {
      destDir: 'build/',
      moduleName: 'ReactTestRenderer',
      sourceMap: false,
    },
    entry: 'src/renderers/testing/ReactTestRendererFiber',
    externals: [],
    fbEntry: 'src/renderers/testing/ReactTestRendererFiber',
    hasteName: 'ReactTestRendererFiber',
    isRenderer: true,
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
    bundleTypes: [FB_DEV],
    config: {
      destDir: 'build/',
      moduleName: 'ReactTestRenderer',
      sourceMap: false,
    },
    entry: 'src/renderers/testing/stack/ReactTestRendererStack',
    externals: [],
    fbEntry: 'src/renderers/testing/stack/ReactTestRendererStack',
    hasteName: 'ReactTestRendererStack',
    isRenderer: true,
    label: 'test-stack',
    manglePropertiesOnProd: false,
    name: 'react-test-renderer-stack',
    paths: [
      'src/renderers/native/**/*.js',
      'src/renderers/shared/**/*.js',
      'src/renderers/testing/**/*.js',

      'src/ReactVersion.js',
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
    entry: 'src/renderers/noop/ReactNoop.js',
    externals: [],
    isRenderer: true,
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
];

module.exports = {
  bundleTypes,
  bundles,
};
