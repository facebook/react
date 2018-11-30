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
    entryPoints: ['react-dom'],
    isFlowTyped: true,
  },
  {
    shortName: 'fire',
    entryPoints: ['react-dom/unstable-fire'],
    isFlowTyped: true,
  },
  {
    shortName: 'art',
    entryPoints: ['react-art'],
    isFlowTyped: false, // TODO: type it.
  },
  {
    shortName: 'native',
    entryPoints: ['react-native-renderer'],
    isFlowTyped: true,
  },
  {
    shortName: 'fabric',
    entryPoints: ['react-native-renderer/fabric'],
    isFlowTyped: true,
  },
  {
    shortName: 'test',
    entryPoints: ['react-test-renderer'],
    isFlowTyped: true,
  },
  {
    shortName: 'custom',
    entryPoints: ['react-reconciler', 'react-reconciler/persistent'],
    isFlowTyped: true,
  },
];
