/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
    const previousMessageChannel = global.MessageChannel;
    try {
      delete global.requestAnimationFrame;
      global.MessageChannel = function MessageChannel() {
        return {
          port1: {},
          port2: {},
        };
      };
      jest.resetModules();

      const JestMockScheduler = require('jest-mock-scheduler');
      JestMockScheduler.mockRestore();

      spyOnDevAndProd(console, 'error');
      require('react-dom');
      expect(console.error.calls.count()).toEqual(1);
      expect(console.error.calls.argsFor(0)[0]).toMatch(
        "This browser doesn't support requestAnimationFrame.",
      );
    } finally {
      global.MessageChannel = previousMessageChannel;
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
