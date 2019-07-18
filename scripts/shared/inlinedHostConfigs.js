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
    entryPoints: ['react-dom', 'react-dom/unstable-fizz.node'],
    isFlowTyped: true,
    isFizzSupported: true,
  },
  {
    shortName: 'dom-browser',
    entryPoints: ['react-dom/unstable-fizz.browser'],
    isFlowTyped: true,
    isFizzSupported: true,
  },
  {
    shortName: 'art',
    entryPoints: ['react-art'],
    isFlowTyped: false, // TODO: type it.
    isFizzSupported: false,
  },
  {
    shortName: 'native',
    entryPoints: ['react-native-renderer'],
    isFlowTyped: true,
    isFizzSupported: false,
  },
  {
    shortName: 'fabric',
    entryPoints: ['react-native-renderer/fabric'],
    isFlowTyped: true,
    isFizzSupported: false,
  },
  {
    shortName: 'test',
    entryPoints: ['react-test-renderer'],
    isFlowTyped: true,
    isFizzSupported: false,
  },
  {
    shortName: 'custom',
    entryPoints: [
      'react-reconciler',
      'react-reconciler/persistent',
      'react-stream',
    ],
    isFlowTyped: true,
    isFizzSupported: true,
  },
];
