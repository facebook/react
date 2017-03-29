'use strict';

const devExpressionWithCodes = require('../error-codes/dev-expression-with-codes');

const bundleTypes = {
  UMD_DEV: 'UMD_DEV',
  UMD_PROD: 'UMD_PROD',
  NODE_DEV: 'NODE_DEV',
  NODE_PROD: 'NODE_PROD',
  FB_DEV: 'FB_DEV',
  FB_PROD: 'FB_PROD',
  RN: 'RN',
};

const { UMD_DEV, UMD_PROD, NODE_DEV, NODE_PROD, FB_DEV, FB_PROD, RN } = bundleTypes;

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
        'react': 'React',
      },
      moduleName: 'ReactDOM',
      sourceMap: false,
    },
    entry: 'src/umd/ReactDOMUMDEntry.js',
    externals: [],
    fbEntry: 'src/fb/ReactDOMFBEntry.js',
    hasteName: 'ReactDOMStack',
    isRenderer: true,
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
        'react': 'React',
      },
      moduleName: 'ReactDOM',
      sourceMap: false,
    },
    entry: 'src/renderers/dom/fiber/ReactDOMFiber.js',
    externals: [],
    fbEntry: 'src/fb/ReactDOMFiberFBEntry.js',
    hasteName: 'ReactDOMFiber',
    isRenderer: true,
    name: 'react-dom',
    paths: [
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
    bundleTypes: [UMD_DEV, UMD_PROD, FB_DEV, FB_PROD],
    config: {
      destDir: 'build/',
      globals: {
        'react': 'React',
      },
      moduleName: 'ReactDOMServer',
      sourceMap: false,
    },
    entry: 'src/umd/ReactDOMServerUMDEntry.js',
    externals: [],
    fbEntry: 'src/umd/ReactDOMServerUMDEntry.js',
    hasteName: 'ReactDOMServerStack',
    isRenderer: true,
    // TODO: this is taken. Do we change the build task
    // to understand react-dom/server?
    name: 'react-dom-server',
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
        'react': 'React',
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
    name: 'react-art',
    nodePackageName: 'react-art',
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
    bundleTypes: [UMD_DEV, UMD_PROD, FB_DEV, FB_PROD],
    config: {
      destDir: 'build/',
      globals: {
        'react': 'React',
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
    bundleTypes: [RN],
    config: {
      destDir: 'build/',
      moduleName: 'ReactNative',
      sourceMap: false,
    },
    entry: 'src/renderers/native/ReactNative.js',
    externals: [
      'InitializeCore',
      'RCTEventEmitter',
      'UIManager',
      'deepDiffer',
      'flattenStyle',
      'TextInputState',
      'deepFreezeAndThrowOnMutationInDev',
    ],
    hasteName: 'ReactNative',
    isRenderer: true,
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
    bundleTypes: [NODE_DEV, FB_DEV, FB_PROD],
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
    name: 'react-test-renderer-stack',
    paths: [
      'src/renderers/native/**/*.js',
      'src/renderers/shared/**/*.js',
      'src/renderers/testing/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },
];

module.exports = {
  bundleTypes,
  bundles,
};
