/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var ReactErrorUtils;

describe('ReactErrorUtils', () => {
  beforeEach(() => {
    ReactErrorUtils = require('ReactErrorUtils');
  });

  describe('invokeGuardedCallbackWithCatch', () => {
    it('should call the callback with only the passed argument', () => {
      var callback = jest.fn();
      ReactErrorUtils.invokeGuardedCallbackWithCatch('foo', callback, 'arg');
      expect(callback).toBeCalledWith('arg');
    });

    it('should catch errors', () => {
      var callback = function() {
        throw new Error('foo');
      };
      expect(() =>
        ReactErrorUtils.invokeGuardedCallbackWithCatch('foo', callback),
      ).not.toThrow();
    });
  });

  describe('rethrowCaughtError', () => {
    it('should rethrow caught errors', () => {
      var err = new Error('foo');
      var callback = function() {
        throw err;
      };
      ReactErrorUtils.invokeGuardedCallbackWithCatch('foo', callback);
      expect(() => ReactErrorUtils.rethrowCaughtError()).toThrow(err);
    });
  });

  describe('invokeGuardedCallback', () => {
    it('should call the callback with only the passed argument', () => {
      var callback = jest.fn();
      ReactErrorUtils.invokeGuardedCallback('foo', callback, 'arg');
      expect(callback).toBeCalledWith('arg');
    });

    it('should use invokeGuardedCallbackWithCatch in production', () => {
      expect(ReactErrorUtils.invokeGuardedCallback).not.toEqual(
        ReactErrorUtils.invokeGuardedCallbackWithCatch,
      );
      __DEV__ = false;
      var oldProcess = process;
      global.process = {env: {NODE_ENV: 'production'}};
      jest.resetModuleRegistry();
      ReactErrorUtils = require('ReactErrorUtils');
      expect(ReactErrorUtils.invokeGuardedCallback).toEqual(
        ReactErrorUtils.invokeGuardedCallbackWithCatch,
      );
      __DEV__ = true;
      global.process = oldProcess;
    });
  });
});
