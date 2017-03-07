'use strict';

const {
  babelOptsReact,
} = require('./babel');

const bundles = [
  {
    babelOpts: babelOptsReact,
    config: {
      destDir: 'build/rollup/',
      moduleName: 'React',
      sourceMap: false,
    },
    entry: 'src/umd/ReactUMDEntry.js',
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
    umd: true,
  },
  {
    babelOpts: babelOptsReact,
    config: {
      destDir: 'build/rollup/',
      globals: {
        'react': 'React',
      },
      moduleName: 'ReactDOM',
      sourceMap: false,
    },
    entry: 'src/umd/ReactDOMUMDEntry.js',
    name: 'react-dom',
    paths: [
      'src/umd/ReactDOMUMDEntry.js',
      'src/umd/ReactDOMServerUMDEntry.js',

      'src/renderers/dom/**/*.js',
      'src/renderers/shared/**/*.js',
      'src/test/**/*.js', // ReactTestUtils is currently very coupled to DOM.

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
    umd: true,
  },
  {
    babelOpts: babelOptsReact,
    config: {
      destDir: 'build/rollup/',
      globals: {
        'react': 'React',
      },
      moduleName: 'ReactDOMFiber',
      sourceMap: false,
    },
    entry: 'src/renderers/dom/fiber/ReactDOMFiber.js',
    name: 'react-dom-fiber',
    paths: [
      'src/renderers/dom/**/*.js',
      'src/renderers/shared/**/*.js',
      'src/test/**/*.js', // ReactTestUtils is currently very coupled to DOM.

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
    umd: true,
  },  
  // {
  //   babelOpts: babelOptsReact,
  //   config: {
  //     destDir: 'build/rollup/',
  //     moduleName: 'ReactNative',
  //     sourceMap: false,
  //   },
  //   entry: 'src/umd/ReactDOMUMDEntry.js',
  //   name: 'react-native-renderer',
  //   paths: [
  //     'src/umd/ReactDOMUMDEntry.js',
  //     'src/umd/ReactDOMServerUMDEntry.js',

  //     'src/renderers/dom/**/*.js',
  //     'src/renderers/shared/**/*.js',
  //     'src/test/**/*.js', // ReactTestUtils is currently very coupled to DOM.

  //     'src/ReactVersion.js',
  //     'src/shared/**/*.js',
  //   ],
  //   umd: false,
  // },
];

module.exports = bundles;
