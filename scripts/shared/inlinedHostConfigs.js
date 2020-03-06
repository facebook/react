/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

module.exports = [
  {
    shortName: 'dom',
    entryPoints: [
      'react-dom',
      'react-dom/testing',
      'react-dom/unstable-fizz.node',
      'react-flight-dom-webpack/server.node',
      'react-flight-dom-webpack',
    ],
    paths: [
      'react-dom',
      'react-dom/unstable-fizz',
      'react-dom/unstable-fizz.node',
      'react-dom/src/server/ReactDOMFizzServerNode.js', // react-dom/unstable-fizz.node
      'react-flight-dom-webpack',
      'react-flight-dom-webpack/server',
      'react-flight-dom-webpack/server.node',
      'react-flight-dom-webpack/src/ReactFlightDOMServerNode.js', // react-flight-dom-webpack/server.browser
    ],
    isFlowTyped: true,
    isServerSupported: true,
  },
  {
    shortName: 'dom-browser',
    entryPoints: [
      'react-dom',
      'react-dom/testing',
      'react-dom/unstable-fizz.browser',
      'react-flight-dom-webpack/server.browser',
      'react-flight-dom-webpack',
    ],
    paths: [
      'react-dom',
      'react-dom/testing',
      'react-dom/unstable-fizz.browser',
      'react-dom/src/server/ReactDOMFizzServerBrowser.js', // react-dom/unstable-fizz.browser
      'react-flight-dom-webpack',
      'react-flight-dom-webpack/server.browser',
      'react-flight-dom-webpack/src/ReactFlightDOMServerBrowser.js', // react-flight-dom-webpack/server.browser
    ],
    isFlowTyped: true,
    isServerSupported: true,
  },
  {
    shortName: 'art',
    entryPoints: ['react-art'],
    paths: ['react-art'],
    isFlowTyped: false, // TODO: type it.
    isServerSupported: false,
  },
  {
    shortName: 'native',
    entryPoints: ['react-native-renderer'],
    paths: ['react-native-renderer'],
    isFlowTyped: true,
    isServerSupported: false,
  },
  {
    shortName: 'fabric',
    entryPoints: ['react-native-renderer/fabric'],
    paths: ['react-native-renderer'],
    isFlowTyped: true,
    isServerSupported: false,
  },
  {
    shortName: 'test',
    entryPoints: ['react-test-renderer'],
    paths: ['react-test-renderer'],
    isFlowTyped: true,
    isServerSupported: false,
  },
  {
    shortName: 'dom-relay',
    entryPoints: ['react-flight-dom-relay', 'react-flight-dom-relay/server'],
    paths: ['react-dom', 'react-flight-dom-relay'],
    isFlowTyped: true,
    isServerSupported: true,
  },
  {
    shortName: 'custom',
    entryPoints: [
      'react-reconciler',
      'react-client/flight',
      'react-server',
      'react-server/flight',
    ],
    paths: [],
    isFlowTyped: true,
    isServerSupported: true,
  },
];
