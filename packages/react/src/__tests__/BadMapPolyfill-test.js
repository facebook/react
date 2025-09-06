/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

describe('BadMapPolyfill', () => {
  let consoleWarnSpy;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  // @gate __DEV__
  it('should warn when a bad Map/Set polyfill is detected', () => {
    // Mock a Map/Set that fails with frozen objects
    const originalMap = global.Map;
    const originalSet = global.Set;

    global.Map = function BadMap() {
      if (arguments.length > 0 && arguments[0]) {
        const entries = arguments[0];
        for (let i = 0; i < entries.length; i++) {
          if (Object.isFrozen(entries[i][0])) {
            throw new Error('Cannot handle frozen object');
          }
        }
      }
    };

    global.Set = function BadSet() {
      if (arguments.length > 0 && arguments[0]) {
        const values = arguments[0];
        for (let i = 0; i < values.length; i++) {
          if (Object.isFrozen(values[i])) {
            throw new Error('Cannot handle frozen object');
          }
        }
      }
    };

    // Re-require the module to trigger the polyfill detection
    jest.resetModules();
    require('../BadMapPolyfill');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'React detected a Map/Set polyfill that cannot handle frozen objects. ' +
        'This might cause issues with React\'s internals.'
    );

    // Restore original Map/Set
    global.Map = originalMap;
    global.Set = originalSet;
  });

  // @gate __DEV__
  it('should not warn when Map/Set polyfill works correctly', () => {
    // Re-require the module to trigger the polyfill detection with good polyfill
    jest.resetModules();
    require('../BadMapPolyfill');

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
