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
      'react-dom/unstable-fizz.node',
      'react-flight-dom-webpack/server.node',
      'react-flight-dom-webpack',
    ],
    isFlowTyped: true,
    isServerSupported: true,
  },
  {
    shortName: 'dom-browser',
    entryPoints: [
      'react-dom/unstable-fizz.browser',
      'react-flight-dom-webpack/server.browser',
      'react-flight-dom-webpack',
    ],
    isFlowTyped: true,
    isServerSupported: true,
  },
  {
    shortName: 'art',
    entryPoints: ['react-art'],
    isFlowTyped: false, // TODO: type it.
    isServerSupported: false,
  },
  {
    shortName: 'native',
    entryPoints: ['react-native-renderer'],
    isFlowTyped: true,
    isServerSupported: false,
  },
  {
    shortName: 'fabric',
    entryPoints: ['react-native-renderer/fabric'],
    isFlowTyped: true,
    isServerSupported: false,
  },
  {
    shortName: 'test',
    entryPoints: ['react-test-renderer'],
    isFlowTyped: true,
    isServerSupported: false,
  },
  {
    shortName: 'custom',
    entryPoints: [
      'react-reconciler',
      'react-reconciler/persistent',
      'react-flight',
      'react-server',
      'react-server/flight',
    ],
    isFlowTyped: true,
    isServerSupported: true,
  },
];
