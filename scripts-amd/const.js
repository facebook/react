'use strict';

const bundleTypes = {
  AMD_DEV: 'AMD_DEV',
  AMD_PROD: 'AMD_PROD',
  AMD_PROFILING: 'AMD_PROFILING'
};

const {
  AMD_DEV,
  AMD_PROD,
  AMD_PROFILING,
} = bundleTypes;

const moduleTypes = {
  // React
  ISOMORPHIC: 'ISOMORPHIC',
  // Individual renderers. They bundle the reconciler. (e.g. ReactDOM)
  RENDERER: 'RENDERER',
  // Helper packages that access specific renderer's internals. (e.g. TestUtils)
  RENDERER_UTILS: 'RENDERER_UTILS',
  // Non-Fiber implementations like SSR and Shallow renderers.
  NON_FIBER_RENDERER: 'NON_FIBER_RENDERER',
};

const {
  ISOMORPHIC,
  RENDERER,
  RENDERER_UTILS,
  NON_FIBER_RENDERER
} = moduleTypes;

const bundles = [
  /******* Isomorphic *******/
  {
    bundleTypes: [
      AMD_DEV,
      AMD_PROD,
      AMD_PROFILING
    ],
    moduleType: ISOMORPHIC,
    entry: 'react',
    global: 'React',
    externals: [],
  },

  /******* React DOM *******/
  {
    bundleTypes: [
      AMD_DEV,
      AMD_PROD,
      AMD_PROFILING
    ],
    moduleType: RENDERER,
    entry: 'react-dom',
    global: 'ReactDOM',
    externals: ['react'],
  },

  /******* React DOM Server *******/
  {
    bundleTypes: [
      AMD_DEV,
      AMD_PROD
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

  /******* React JSX Runtime *******/
  {
    bundleTypes: [
      AMD_DEV,
      AMD_PROD
    ],
    moduleType: ISOMORPHIC,
    entry: 'react/jsx-runtime',
    global: 'JSXRuntime',
    externals: ['react'],
  },

  /******* React JSX DEV Runtime *******/
  {
    bundleTypes: [
      AMD_DEV,
      AMD_PROD
    ],
    moduleType: ISOMORPHIC,
    entry: 'react/jsx-dev-runtime',
    global: 'JSXDEVRuntime',
    externals: ['react'],
  },

  /******* React DOM - www - Testing *******/
  {
    moduleType: RENDERER,
    bundleTypes: [AMD_DEV],
    entry: 'react-dom/testing',
    global: 'ReactDOMTesting',
    externals: ['react'],
  },

  /******* Test Utils *******/
  {
    moduleType: RENDERER_UTILS,
    bundleTypes: [AMD_DEV],
    entry: 'react-dom/test-utils',
    global: 'ReactTestUtils',
    externals: ['react', 'react-dom'],
  },

  {
    bundleTypes: [
      AMD_DEV
    ],
    moduleType: RENDERER,
    entry: 'react-test-renderer',
    global: 'ReactTestRenderer',
    externals: ['react'],
    babel: opts =>
      Object.assign({}, opts, {
        plugins: opts.plugins.concat([
          [require.resolve('@babel/plugin-transform-classes'), {loose: true}],
        ]),
      }),
  },

];

const license = `* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.`;

module.exports = {
  bundleTypes,
  bundles,
  license
};

