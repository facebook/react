/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var ReactErrorUtils;

describe('ReactErrorUtils', () => {

  beforeEach(() => {
    ReactErrorUtils = require('ReactErrorUtils');
  });

  describe('invokeGuardedCallbackProd', () => {
    it('should call the callback the passed arguments', () => {
      var callback = jest.fn();
      ReactErrorUtils.invokeGuardedCallbackProd('foo', callback, null, 'arg1', 'arg2');
      expect(callback).toBeCalledWith('arg1', 'arg2');
    });

    it('should call the callback with the provided context', () => {
      var context = { didCall: false };
      ReactErrorUtils.invokeGuardedCallbackProd('foo', function() {
        this.didCall = true;
      }, context);
      expect(context.didCall).toBe(true);
    });

    it('should return a caught error', () => {
      const error = new Error();
      const returnValue = ReactErrorUtils.invokeGuardedCallbackProd('foo', function() {
        throw error;
      }, null, 'arg1', 'arg2');
      expect(returnValue).toBe(error);
    });

    it('should return null if no error is thrown', () => {
      var callback = jest.fn();
      const returnValue = ReactErrorUtils.invokeGuardedCallbackProd('foo', callback, null);
      expect(returnValue).toBe(null);
    });
  });

  describe('invokeGuardedCallbackAndCatchFirstError', () => {
    it('should rethrow caught errors', () => {
      var err = new Error('foo');
      var callback = function() {
        throw err;
      };
      ReactErrorUtils.invokeGuardedCallbackAndCatchFirstError('foo', callback, null);
      expect(() => ReactErrorUtils.rethrowCaughtError()).toThrow(err);
    });
  });

  describe('invokeGuardedCallback', () => {
    it('should call the callback the passed arguments', () => {
      var callback = jest.fn();
      ReactErrorUtils.invokeGuardedCallback('foo', callback, null, 'arg1', 'arg2');
      expect(callback).toBeCalledWith('arg1', 'arg2');
    });

    it('should call the callback with the provided context', () => {
      var context = { didCall: false };
      ReactErrorUtils.invokeGuardedCallback('foo', function() {
        this.didCall = true;
      }, context);
      expect(context.didCall).toBe(true);
    });

    it('should return a caught error', () => {
      const error = new Error();
      const returnValue = ReactErrorUtils.invokeGuardedCallback('foo', function() {
        throw error;
      }, null, 'arg1', 'arg2');
      expect(returnValue).toBe(error);
    });

    it('should return null if no error is thrown', () => {
      var callback = jest.fn();
      const returnValue = ReactErrorUtils.invokeGuardedCallback('foo', callback, null);
      expect(returnValue).toBe(null);
    });

    it('should use invokeGuardedCallbackProd in production', () => {
      expect(ReactErrorUtils.invokeGuardedCallback).not.toEqual(
        ReactErrorUtils.invokeGuardedCallbackProd
      );
      __DEV__ = false;
      var oldProcess = process;
      global.process = {
        env: Object.assign({}, process.env, {NODE_ENV: 'production'}),
      };
      jest.resetModules();
      ReactErrorUtils = require('ReactErrorUtils');
      expect(ReactErrorUtils.invokeGuardedCallback).toEqual(
        ReactErrorUtils.invokeGuardedCallbackProd
      );
      __DEV__ = true;
      global.process = oldProcess;
    });
  });
});
