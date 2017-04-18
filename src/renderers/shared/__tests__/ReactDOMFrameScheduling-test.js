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
  it('throws when requestAnimationFrame is not polyfilled in the browser.', () => {
    const previousRAF = global.requestAnimationFrame;
    global.requestAnimationFrame = undefined;
    jest.resetModules();
    expect(() => {
      require('ReactDOM');
    }).toThrow(
      'React depends on requestAnimationFrame. Make sure that you load a ' +
        'polyfill in older browsers.',
    );
    global.requestAnimationFrame = previousRAF;
  });

  it('can import findDOMNode in Node environment.', () => {
    const previousRAF = global.requestAnimationFrame;
    const previousRIC = global.requestIdleCallback;
    global.requestAnimationFrame = undefined;
    global.requestIdleCallback = undefined;
    const prevWindow = global.window;
    delete global.window;
    jest.resetModules();
    require('ReactDOM');
    global.requestAnimationFrame = previousRAF;
    global.requestIdleCallback = previousRIC;
    global.window = prevWindow;
  });
});
