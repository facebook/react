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
      'react-transport-dom-webpack/server.node',
      'react-transport-dom-webpack',
    ],
    paths: [
      'react-dom',
      'react-dom/unstable-fizz',
      'react-dom/unstable-fizz.node',
      'react-dom/src/server/ReactDOMFizzServerNode.js', // react-dom/unstable-fizz.node
      'react-transport-dom-webpack',
      'react-transport-dom-webpack/server',
      'react-transport-dom-webpack/server.node',
      'react-transport-dom-webpack/src/ReactFlightDOMServerNode.js', // react-transport-dom-webpack/server.browser
      'react-client/src/ReactFlightClientStream.js', // We can only type check this in streaming configurations.
      'react-interactions',
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
      'react-transport-dom-webpack/server.browser',
      'react-transport-dom-webpack',
    ],
    paths: [
      'react-dom',
      'react-dom/testing',
      'react-dom/unstable-fizz.browser',
      'react-dom/src/server/ReactDOMFizzServerBrowser.js', // react-dom/unstable-fizz.browser
      'react-transport-dom-webpack',
      'react-transport-dom-webpack/server.browser',
      'react-transport-dom-webpack/src/ReactFlightDOMServerBrowser.js', // react-transport-dom-webpack/server.browser
      'react-client/src/ReactFlightClientStream.js', // We can only type check this in streaming configurations.
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
    entryPoints: [
      'react-transport-dom-relay',
      'react-transport-dom-relay/server',
    ],
    paths: ['react-dom', 'react-transport-dom-relay'],
    isFlowTyped: true,
    isServerSupported: true,
  },
  {
    shortName: 'native-relay',
    entryPoints: [
      'react-transport-native-relay',
      'react-transport-native-relay/server',
    ],
    paths: ['react-native-renderer', 'react-transport-native-relay'],
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
    paths: [
      'react-client/flight',
      'react-server/flight',
      'react-client/src/ReactFlightClientStream.js', // We can only type check this in streaming configurations.
    ],
    isFlowTyped: true,
    isServerSupported: true,
  },
];
