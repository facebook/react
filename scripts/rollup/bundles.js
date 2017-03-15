'use strict';

const devExpressionWithCodes = require('../error-codes/dev-expression-with-codes');

const bundleTypes = {
  DEV: 'DEV',
  PROD: 'PROD',
  NODE: 'NODE',
  FB: 'FB',
  RN: 'RN',
};

const { DEV, PROD, NODE, FB, RN } = bundleTypes;

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
    bundleTypes: [DEV, PROD, NODE, FB],
    config: {
      destDir: 'build/rollup/',
      moduleName: 'React',
      sourceMap: false,
    },
    entry: 'src/umd/ReactUMDEntry.js',
    fbEntry: 'src/fb/ReactFBEntry.js',
    hasteName: 'React-fb',
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
    bundleTypes: [DEV, PROD, NODE, FB],
    config: {
      destDir: 'build/rollup/',
      globals: {
        'react': 'React',
      },
      moduleName: 'ReactDOM',
      sourceMap: false,
    },
    entry: 'src/umd/ReactDOMUMDEntry.js',
    fbEntry: 'src/fb/ReactDOMFBEntry.js',
    hasteName: 'ReactDOMStack-fb',
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
  {
    babelOpts: babelOptsReact,
    bundleTypes: [DEV, PROD, NODE, FB],
    config: {
      destDir: 'build/rollup/',
      globals: {
        'react': 'React',
      },
      moduleName: 'ReactDOMFiber',
      sourceMap: false,
    },
    entry: 'src/renderers/dom/fiber/ReactDOMFiber.js',
    fbEntry: 'src/fb/ReactDOMFiberFBEntry.js',
    hasteName: 'ReactDOMFiber-fb',
    name: 'react-dom-fiber',
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
    bundleTypes: [DEV, PROD, NODE, FB],
    config: {
      destDir: 'build/rollup/',
      globals: {
        'react': 'React',
      },
      moduleName: 'ReactDOMServer',
      sourceMap: false,
    },
    entry: 'src/umd/ReactDOMServerUMDEntry.js',
    fbEntry: 'src/umd/ReactDOMServerUMDEntry.js',
    hasteName: 'ReactDOMServerStack',
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
    bundleTypes: [DEV, PROD, NODE, FB],
    config: {
      destDir: 'build/rollup/',
      globals: {
        'react': 'React',
      },
      moduleName: 'ReactARTStack',
      sourceMap: false,
    },
    entry: 'src/renderers/art/ReactARTStack.js',
    fbEntry: 'src/renderers/art/ReactARTStack.js',
    hasteName: 'ReactARTStack',
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
    bundleTypes: [DEV, PROD, NODE, FB],
    config: {
      destDir: 'build/rollup/',
      globals: {
        'react': 'React',
      },
      moduleName: 'ReactARTFiber',
      sourceMap: false,
    },
    entry: 'src/renderers/art/ReactARTFiber.js',
    fbEntry: 'src/renderers/art/ReactARTFiber.js',
    hasteName: 'ReactARTFiber',
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
      destDir: 'build/rollup/',
      moduleName: 'ReactNative',
      sourceMap: false,
    },
    entry: 'src/renderers/native/ReactNative.js',
    hasteName: 'ReactNative',
    name: 'react-native-renderer',
    paths: [
      'src/renderers/native/**/*.js',
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
