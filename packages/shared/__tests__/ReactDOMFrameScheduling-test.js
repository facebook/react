/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMFrameScheduling', () => {
  it('warns when requestAnimationFrame is not polyfilled in the browser', () => {
    const previousRAF = global.requestAnimationFrame;
    try {
      global.requestAnimationFrame = undefined;
      jest.resetModules();
      spyOnDev(console, 'error');
      require('react-dom');
      if (__DEV__) {
        expect(console.error.calls.count()).toBe(1);
        expect(console.error.calls.argsFor(0)[0]).toContain(
          'React depends on requestAnimationFrame.',
        );
      }
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
