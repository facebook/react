/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

module.exports = [
  {
    shortName: 'dom-node',
    entryPoints: [
      'react-dom',
      'react-dom/unstable_testing',
      'react-dom/src/server/ReactDOMFizzServerNode.js',
      'react-dom/static.node',
      'react-dom/server-rendering-stub',
      'react-dom/unstable_server-external-runtime',
      'react-server-dom-webpack/server.node.unbundled',
      'react-server-dom-webpack/client.node.unbundled',
    ],
    paths: [
      'react-dom',
      'react-dom-bindings',
      'react-dom/client',
      'react-dom/server',
      'react-dom/server.node',
      'react-dom/static',
      'react-dom/static.node',
      'react-dom/src/server/ReactDOMFizzServerNode.js', // react-dom/server.node
      'react-dom/src/server/ReactDOMFizzStaticNode.js',
      'react-server-dom-webpack',
      'react-server-dom-webpack/client.node.unbundled',
      'react-server-dom-webpack/server',
      'react-server-dom-webpack/server.node.unbundled',
      'react-server-dom-webpack/src/ReactFlightDOMServerNode.js', // react-server-dom-webpack/server.node
      'react-client/src/ReactFlightClientStream.js', // We can only type check this in streaming configurations.
      'react-devtools',
      'react-devtools-core',
      'react-devtools-shell',
      'react-devtools-shared',
      'react-interactions',
      'shared/ReactDOMSharedInternals',
    ],
    isFlowTyped: true,
    isServerSupported: true,
  },
  {
    shortName: 'dom-bun',
    entryPoints: ['react-dom', 'react-dom/src/server/ReactDOMFizzServerBun.js'],
    paths: [
      'react-dom',
      'react-dom/server.bun',
      'react-dom/src/server/ReactDOMFizzServerBun.js',
      'react-dom-bindings',
      'shared/ReactDOMSharedInternals',
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
      'react-dom/static.browser',
      'react-dom/server-rendering-stub',
      'react-dom/unstable_server-external-runtime',
      'react-server-dom-webpack/server.browser',
      'react-server-dom-webpack/client.browser',
    ],
    paths: [
      'react-dom',
      'react-dom-bindings',
      'react-dom/client',
      'react-dom/server.browser',
      'react-dom/static.browser',
      'react-dom/unstable_testing',
      'react-dom/src/server/ReactDOMFizzServerBrowser.js', // react-dom/server.browser
      'react-dom/src/server/ReactDOMFizzStaticBrowser.js',
      'react-server-dom-webpack',
      'react-server-dom-webpack/client',
      'react-server-dom-webpack/client.browser',
      'react-server-dom-webpack/server.browser',
      'react-server-dom-webpack/src/ReactFlightDOMClientBrowser.js', // react-server-dom-webpack/client.browser
      'react-server-dom-webpack/src/ReactFlightDOMServerBrowser.js', // react-server-dom-webpack/server.browser
      'react-client/src/ReactFlightClientStream.js', // We can only type check this in streaming configurations.
      'react-devtools',
      'react-devtools-core',
      'react-devtools-shell',
      'react-devtools-shared',
      'shared/ReactDOMSharedInternals',
    ],
    isFlowTyped: true,
    isServerSupported: true,
  },
  {
    shortName: 'dom-edge-webpack',
    entryPoints: [
      'react-dom/src/server/ReactDOMFizzServerEdge.js',
      'react-dom/static.edge',
      'react-server-dom-webpack/server.edge',
      'react-server-dom-webpack/client.edge',
    ],
    paths: [
      'react-dom',
      'react-dom-bindings',
      'react-dom/client',
      'react-dom/server.edge',
      'react-dom/static.edge',
      'react-dom/unstable_testing',
      'react-dom/src/server/ReactDOMFizzServerEdge.js', // react-dom/server.edge
      'react-dom/src/server/ReactDOMFizzStaticEdge.js',
      'react-server-dom-webpack',
      'react-server-dom-webpack/client.edge',
      'react-server-dom-webpack/server.edge',
      'react-server-dom-webpack/src/ReactFlightDOMClientEdge.js', // react-server-dom-webpack/client.edge
      'react-server-dom-webpack/src/ReactFlightDOMServerEdge.js', // react-server-dom-webpack/server.edge
      'react-client/src/ReactFlightClientStream.js', // We can only type check this in streaming configurations.
      'react-devtools',
      'react-devtools-core',
      'react-devtools-shell',
      'react-devtools-shared',
      'shared/ReactDOMSharedInternals',
    ],
    isFlowTyped: true,
    isServerSupported: true,
  },
  {
    shortName: 'dom-node-webpack',
    entryPoints: [
      'react-server-dom-webpack/server.node',
      'react-server-dom-webpack/client.node',
    ],
    paths: [
      'react-dom',
      'react-dom-bindings',
      'react-dom/client',
      'react-dom/server',
      'react-dom/server.node',
      'react-dom/static',
      'react-dom/static.node',
      'react-dom/src/server/ReactDOMFizzServerNode.js', // react-dom/server.node
      'react-dom/src/server/ReactDOMFizzStaticNode.js',
      'react-server-dom-webpack',
      'react-server-dom-webpack/client.node',
      'react-server-dom-webpack/server',
      'react-server-dom-webpack/server.node',
      'react-server-dom-webpack/src/ReactFlightDOMServerNode.js', // react-server-dom-webpack/server.node
      'react-client/src/ReactFlightClientStream.js', // We can only type check this in streaming configurations.
      'react-devtools',
      'react-devtools-core',
      'react-devtools-shell',
      'react-devtools-shared',
      'react-interactions',
      'shared/ReactDOMSharedInternals',
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
      'react-dom-bindings',
      'react-server-dom-webpack',
      'react-dom/src/server/ReactDOMLegacyServerImpl.js', // not an entrypoint, but only usable in *Brower and *Node files
      'react-dom/src/server/ReactDOMLegacyServerBrowser.js', // react-dom/server.browser
      'react-dom/src/server/ReactDOMLegacyServerNode.js', // react-dom/server.node
      'react-dom/src/server/ReactDOMLegacyServerNode.classic.fb.js',
      'react-dom/src/server/ReactDOMLegacyServerNodeStream.js', // file indirection to support partial forking of some methods in *Node
      'react-client/src/ReactFlightClientStream.js', // We can only type check this in streaming configurations.
      'shared/ReactDOMSharedInternals',
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
    paths: [
      'react-dom',
      'react-dom-bindings',
      'react-server-dom-relay',
      'shared/ReactDOMSharedInternals',
    ],
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
