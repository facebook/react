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

  // Run tests in both DEV and production
  describe('invokeGuardedCallback (development)', invokeGuardedCallbackTests.bind(null, 'development'));
  describe('invokeGuardedCallback (production)', () => {
    let oldProcess;
    beforeEach(() => {
      __DEV__ = false;
      oldProcess = process;
      global.process = {
        env: Object.assign({}, process.env, {NODE_ENV: 'production'}),
      };
      jest.resetModules();
      ReactErrorUtils = require('ReactErrorUtils');
    });

    afterEach(() => {
      __DEV__ = true;
      global.process = oldProcess;
    });

    invokeGuardedCallbackTests('production');
  });

  function invokeGuardedCallbackTests(environment) {
    it(`it should rethrow errors caught by invokeGuardedCallbackAndCatchFirstError (${environment})`, () => {
      var err = new Error('foo');
      var callback = function() {
        throw err;
      };
      ReactErrorUtils.invokeGuardedCallbackAndCatchFirstError('foo', callback, null);
      expect(() => ReactErrorUtils.rethrowCaughtError()).toThrow(err);
    });

    it(`should call the callback the passed arguments (${environment})`, () => {
      var callback = jest.fn();
      ReactErrorUtils.invokeGuardedCallback('foo', callback, null, 'arg1', 'arg2');
      expect(callback).toBeCalledWith('arg1', 'arg2');
    });

    it(`should call the callback with the provided context (${environment})`, () => {
      var context = { didCall: false };
      ReactErrorUtils.invokeGuardedCallback('foo', function() {
        this.didCall = true;
      }, context);
      expect(context.didCall).toBe(true);
    });

    it(`should return a caught error (${environment})`, () => {
      const error = new Error();
      const returnValue = ReactErrorUtils.invokeGuardedCallback('foo', function() {
        throw error;
      }, null, 'arg1', 'arg2');
      expect(returnValue).toBe(error);
    });

    it(`should return null if no error is thrown (${environment})`, () => {
      var callback = jest.fn();
      const returnValue = ReactErrorUtils.invokeGuardedCallback('foo', callback, null);
      expect(returnValue).toBe(null);
    });

    it(`can nest with same debug name (${environment})`, () => {
      const err1 = new Error();
      let err2;
      const err3 = new Error();
      const err4 = ReactErrorUtils.invokeGuardedCallback('foo', function() {
        err2 = ReactErrorUtils.invokeGuardedCallback('foo', function() {
          throw err1;
        }, null);
        throw err3;
      }, null);

      expect(err2).toBe(err1);
      expect(err4).toBe(err3);
    });

    it(`does not return nested errors (${environment})`, () => {
      const err1 = new Error();
      let err2;
      const err3 = ReactErrorUtils.invokeGuardedCallback('foo', function() {
        err2 = ReactErrorUtils.invokeGuardedCallback('foo', function() {
          throw err1;
        }, null);
      }, null);

      expect(err3).toBe(null); // Returns null because inner error was already captured
      expect(err2).toBe(err1);
    });
  }
});
