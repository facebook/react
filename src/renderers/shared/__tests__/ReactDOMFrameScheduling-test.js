/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

const ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
const describeFiber = ReactDOMFeatureFlags.useFiber ? describe : xdescribe;

describeFiber('ReactDOMFrameScheduling', () => {
  it('throws when requestAnimationFrame is not polyfilled in the browser', () => {
    const previousRAF = global.requestAnimationFrame;
    try {
      global.requestAnimationFrame = undefined;
      jest.resetModules();
      expect(() => {
        require('react-dom');
      }).toThrow(
        'React depends on requestAnimationFrame. Make sure that you load a ' +
          'polyfill in older browsers.',
      );
    } finally {
      global.requestAnimationFrame = previousRAF;
    }
  });

  // We're just testing importing, not using it.
  // It is important because even isomorphic components may import it.
  it('can import findDOMNode in Node environment', () => {
    const previousRAF = global.requestAnimationFrame;
    const previousRIC = global.requestIdleCallback;
    const prevWindow = global.window;
    try {
      global.requestAnimationFrame = undefined;
      global.requestIdleCallback = undefined;
      // Simulate the Node environment:
      delete global.window;
      jest.resetModules();
      expect(() => {
        require('react-dom');
      }).not.toThrow();
    } finally {
      global.requestAnimationFrame = previousRAF;
      global.requestIdleCallback = previousRIC;
      global.window = prevWindow;
    }
  });
});
