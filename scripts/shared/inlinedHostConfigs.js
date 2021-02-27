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
      'react-server-dom-webpack/writer.node.server',
      'react-server-dom-webpack',
    ],
    paths: [
      'react-dom',
      'react-dom/unstable-fizz',
      'react-dom/unstable-fizz.node',
      'react-dom/src/server/ReactDOMFizzServerNode.js', // react-dom/unstable-fizz.node
      'react-server-dom-webpack',
      'react-server-dom-webpack/writer',
      'react-server-dom-webpack/writer.node.server',
      'react-server-dom-webpack/src/ReactFlightDOMServerNode.js', // react-server-dom-webpack/writer.node.server
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
      'react-server-dom-webpack/writer.browser.server',
      'react-server-dom-webpack',
    ],
    paths: [
      'react-dom',
      'react-dom/testing',
      'react-dom/unstable-fizz.browser',
      'react-dom/src/server/ReactDOMFizzServerBrowser.js', // react-dom/unstable-fizz.browser
      'react-server-dom-webpack',
      'react-server-dom-webpack/writer.browser.server',
      'react-server-dom-webpack/src/ReactFlightDOMServerBrowser.js', // react-server-dom-webpack/writer.browser.server
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
    entryPoints: ['react-server-dom-relay', 'react-server-dom-relay/server'],
    paths: ['react-dom', 'react-server-dom-relay'],
    isFlowTyped: true,
    isServerSupported: true,
  },
  {
    shortName: 'native-relay',
    entryPoints: [
      'react-server-native-relay',
      'react-server-native-relay/server',
    ],
    paths: ['react-native-renderer', 'react-server-native-relay'],
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
