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
      'react-dom/unstable_testing',
      'react-dom/src/server/ReactDOMFizzServerNode.js',
      'react-server-dom-webpack/writer.node.server',
      'react-server-dom-webpack',
    ],
    paths: [
      'react-dom',
      'react-dom/client',
      'react-dom/src/server/ReactDOMFizzServerNode.js', // react-dom/server.node
      'react-server-dom-webpack',
      'react-server-dom-webpack/writer',
      'react-server-dom-webpack/writer.node.server',
      'react-server-dom-webpack/src/ReactFlightDOMServerNode.js', // react-server-dom-webpack/writer.node.server
      'react-client/src/ReactFlightClientStream.js', // We can only type check this in streaming configurations.
      'react-devtools',
      'react-devtools-core',
      'react-devtools-shell',
      'react-devtools-shared',
      'react-interactions',
    ],
    isFlowTyped: true,
    isServerSupported: true,
  },
  {
    shortName: 'dom-browser',
    entryPoints: [
      'react-dom',
      'react-dom/unstable_testing',
      'react-dom/src/server/ReactDOMFizzServerBrowser.js',
      'react-server-dom-webpack/writer.browser.server',
      'react-server-dom-webpack',
    ],
    paths: [
      'react-dom',
      'react-dom/client',
      'react-dom/unstable_testing',
      'react-dom/src/server/ReactDOMFizzServerBrowser.js', // react-dom/server.browser
      'react-server-dom-webpack',
      'react-server-dom-webpack/writer.browser.server',
      'react-server-dom-webpack/src/ReactFlightDOMServerBrowser.js', // react-server-dom-webpack/writer.browser.server
      'react-client/src/ReactFlightClientStream.js', // We can only type check this in streaming configurations.
      'react-devtools',
      'react-devtools-core',
      'react-devtools-shell',
      'react-devtools-shared',
    ],
    isFlowTyped: true,
    isServerSupported: true,
  },
  {
    shortName: 'dom-legacy',
    entryPoints: [
      'react-dom/src/server/ReactDOMLegacyServerBrowser.js', // react-dom/server.browser
      'react-dom/src/server/ReactDOMLegacyServerNode.js', // react-dom/server.node
    ],
    paths: [
      'react-dom',
      'react-server-dom-webpack',
      'react-dom/src/server/ReactDOMLegacyServerImpl.js', // not an entrypoint, but only usable in *Brower and *Node files
      'react-dom/src/server/ReactDOMLegacyServerBrowser.js', // react-dom/server.browser
      'react-dom/src/server/ReactDOMLegacyServerNode.js', // react-dom/server.node
      'react-dom/src/server/ReactDOMLegacyServerNode.classic.fb.js',
      'react-dom/src/server/ReactDOMLegacyServerNodeStream.js', // file indirection to support partial forking of some methods in *Node
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
      'react-server-dom-relay',
      'react-server-dom-relay/server',
      'react-server-dom-relay/src/ReactDOMServerFB.js',
    ],
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
    paths: [
      'react-native-renderer',
      'react-server-native-relay',
      // this is included here so that it's not included in the main native check
      // remove this when it's added to the main native renderer.
      'react-native-renderer/src/server',
    ],
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
