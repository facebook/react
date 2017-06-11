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
    entry: 'src/isomorphic/React.js',
    externals: [
      'create-react-class/factory',
      'prop-types',
      'prop-types/checkPropTypes',
    ],
    fbEntry: 'src/fb/ReactFBEntry.js',
    hasteName: 'React',
    isRenderer: false,
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
    entry: 'src/renderers/dom/fiber/ReactDOMFiber.js',
    externals: ['prop-types', 'prop-types/checkPropTypes'],
    fbEntry: 'src/fb/ReactDOMFiberFBEntry.js',
    hasteName: 'ReactDOMFiber',
    isRenderer: true,
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
    bundleTypes: [FB_DEV, NODE_DEV],
    config: {
      destDir: 'build/',
      globals: {
        react: 'React',
      },
      moduleName: 'ReactTestUtils',
      sourceMap: false,
    },
    entry: 'src/renderers/dom/test/ReactTestUtils',
    externals: [
      'prop-types',
      'prop-types/checkPropTypes',
      'react',
      'react-dom',
      'react-test-renderer', // TODO (bvaughn) Remove this dependency before 16.0.0
    ],
    fbEntry: 'src/renderers/dom/test/ReactTestUtils',
    hasteName: 'ReactTestUtils',
    isRenderer: true,
    label: 'test-utils',
    manglePropertiesOnProd: false,
    name: 'react-dom/test-utils',
    paths: [
      'src/renderers/dom/test/**/*.js',
      'src/renderers/shared/**/*.js',
      'src/renderers/testing/**/*.js', // TODO (bvaughn) Remove this dependency before 16.0.0

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
    entry: 'src/renderers/dom/ReactDOMServerStream.js',
    externals: ['prop-types', 'prop-types/checkPropTypes'],
    fbEntry: 'src/renderers/dom/ReactDOMServerStream.js',
    hasteName: 'ReactDOMServerStream',
    isRenderer: true,
    label: 'dom-server-stream',
    manglePropertiesOnProd: false,
    name: 'react-dom/server',
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
    entry: 'src/renderers/art/ReactARTFiber.js',
    externals: [
      'art/modes/current',
      'art/modes/fast-noSideEffects',
      'art/core/transform',
      'prop-types/checkPropTypes',
      'react-dom',
    ],
    fbEntry: 'src/renderers/art/ReactARTFiber.js',
    hasteName: 'ReactARTFiber',
    isRenderer: true,
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
      'prop-types/checkPropTypes',
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
    useFiber: false,
    modulesToStub: [
      "'createReactNativeComponentClassFiber'",
      "'ReactNativeFiberRenderer'",
      "'findNumericNodeHandleFiber'",
      "'ReactNativeFiber'",
    ],
  },
  {
    babelOpts: babelOptsReact,
    bundleTypes: [RN_DEV, RN_PROD],
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
      'prop-types/checkPropTypes',
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
    useFiber: true,
    modulesToStub: [
      "'createReactNativeComponentClassStack'",
      "'findNumericNodeHandleStack'",
      "'ReactNativeStack'",
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
    externals: ['prop-types/checkPropTypes'],
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
    bundleTypes: [FB_DEV, NODE_DEV],
    config: {
      destDir: 'build/',
      moduleName: 'ReactShallowRenderer',
      sourceMap: false,
    },
    entry: 'src/renderers/testing/ReactShallowRenderer',
    externals: [
      'react-dom',
      'prop-types/checkPropTypes',
      'react-test-renderer',
    ],
    fbEntry: 'src/renderers/testing/ReactShallowRenderer',
    hasteName: 'ReactShallowRenderer',
    isRenderer: true,
    label: 'shallow-renderer',
    manglePropertiesOnProd: false,
    name: 'react-test-renderer/shallow',
    paths: ['src/renderers/shared/**/*.js', 'src/renderers/testing/**/*.js'],
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
    externals: ['prop-types/checkPropTypes'],
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
