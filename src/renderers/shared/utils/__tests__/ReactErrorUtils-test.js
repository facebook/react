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

var noop = () => {};

describe('ReactErrorUtils', () => {
  beforeEach(() => {
    ReactErrorUtils = require('ReactErrorUtils');
  });

  // Run tests in both DEV and production
  describe(
    'invokeGuardedCallback (development)',
    invokeGuardedCallbackTests.bind(null, 'development'),
  );
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
      ReactErrorUtils.invokeGuardedCallbackAndCatchFirstError(
        'foo',
        callback,
        null,
      );
      expect(() => ReactErrorUtils.rethrowCaughtError()).toThrow(err);
    });

    it(`should call the callback the passed arguments (${environment})`, () => {
      var callback = jest.fn();
      ReactErrorUtils.invokeGuardedCallback(
        'foo',
        callback,
        null,
        noop,
        'arg1',
        'arg2',
      );
      expect(callback).toBeCalledWith('arg1', 'arg2');
    });

    it(`should call the callback with the provided context (${environment})`, () => {
      var context = {didCall: false};
      ReactErrorUtils.invokeGuardedCallback(
        'foo',
        function() {
          this.didCall = true;
        },
        context,
        noop,
      );
      expect(context.didCall).toBe(true);
    });

    it(`should call onError if error is thrown (${environment})`, () => {
      const error = new Error();
      const ops = [];
      function onError(e) {
        ops.push(e);
      }
      ReactErrorUtils.invokeGuardedCallback(
        'foo',
        function() {
          throw error;
        },
        null,
        onError,
        'arg1',
        'arg2',
      );
      expect(ops.length).toEqual(1);
      expect(ops[0]).toBe(error);
    });

    it(`should not call onError if no error is thrown (${environment})`, () => {
      let called = false;
      function onError() {
        called = true;
      }
      ReactErrorUtils.invokeGuardedCallback('foo', noop, null, onError);
      expect(called).toBe(false);
    });

    it(`can nest with same debug name (${environment})`, () => {
      const err1 = new Error();
      let err2;
      const err3 = new Error();
      let err4;
      ReactErrorUtils.invokeGuardedCallback(
        'foo',
        function() {
          ReactErrorUtils.invokeGuardedCallback(
            'foo',
            function() {
              throw err1;
            },
            null,
            e => err2 = e,
          );
          throw err3;
        },
        null,
        e => err4 = e,
      );

      expect(err2).toBe(err1);
      expect(err4).toBe(err3);
    });

    it(`skips nested errors (${environment})`, () => {
      const err1 = new Error();
      let err2;
      let err3;
      ReactErrorUtils.invokeGuardedCallback(
        'foo',
        function() {
          ReactErrorUtils.invokeGuardedCallback(
            'foo',
            function() {
              throw err1;
            },
            null,
            e => err2 = e,
          );
        },
        null,
        e => err3 = e,
      );

      expect(err3).toBe(undefined); // No error because inner error was already captured
      expect(err2).toBe(err1);
    });

    it(`can be shimmed (${environment})`, () => {
      const ops = [];
      // Override the original invokeGuardedCallback
      ReactErrorUtils.invokeGuardedCallback = function(
        name,
        func,
        context,
        onError,
        a,
      ) {
        ops.push(a);
        try {
          func.call(context, a);
        } catch (error) {
          onError(error);
        }
      };

      var err = new Error('foo');
      var callback = function() {
        throw err;
      };
      ReactErrorUtils.invokeGuardedCallbackAndCatchFirstError(
        'foo',
        callback,
        null,
        'somearg',
      );
      expect(() => ReactErrorUtils.rethrowCaughtError()).toThrow(err);
      // invokeGuardedCallbackAndCatchFirstError and rethrowCaughtError close
      // over ReactErrorUtils.invokeGuardedCallback so should use the
      // shimmed version.
      expect(ops).toEqual(['somearg']);
    });
  }
});
