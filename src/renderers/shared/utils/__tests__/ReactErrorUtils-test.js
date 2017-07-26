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
    // TODO: can we express this test with only public API?
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
    it(`it should rethrow caught errors (${environment})`, () => {
      var err = new Error('foo');
      var callback = function() {
        throw err;
      };
      ReactErrorUtils.invokeGuardedCallbackAndCatchFirstError(
        'foo',
        callback,
        null,
      );
      expect(ReactErrorUtils.hasCaughtError()).toBe(false);
      expect(() => ReactErrorUtils.rethrowCaughtError()).toThrow(err);
    });

    it(`should call the callback the passed arguments (${environment})`, () => {
      var callback = jest.fn();
      ReactErrorUtils.invokeGuardedCallback(
        'foo',
        callback,
        null,
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
      );
      expect(context.didCall).toBe(true);
    });

    it(`should catch errors (${environment})`, () => {
      const error = new Error();
      const returnValue = ReactErrorUtils.invokeGuardedCallback(
        'foo',
        function() {
          throw error;
        },
        null,
        'arg1',
        'arg2',
      );
      expect(returnValue).toBe(undefined);
      expect(ReactErrorUtils.hasCaughtError()).toBe(true);
      expect(ReactErrorUtils.clearCaughtError()).toBe(error);
    });

    it(`should return false from clearCaughtError if no error was thrown (${environment})`, () => {
      var callback = jest.fn();
      ReactErrorUtils.invokeGuardedCallback('foo', callback, null);
      expect(ReactErrorUtils.hasCaughtError()).toBe(false);
      expect(ReactErrorUtils.clearCaughtError).toThrow(
        __DEV__ ? 'no error was captured' : 'Minified React error #198',
      );
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
          );
          err2 = ReactErrorUtils.clearCaughtError();
          throw err3;
        },
        null,
      );
      err4 = ReactErrorUtils.clearCaughtError();

      expect(err2).toBe(err1);
      expect(err4).toBe(err3);
    });

    it(`handles nested errors (${environment})`, () => {
      const err1 = new Error();
      let err2;
      ReactErrorUtils.invokeGuardedCallback(
        'foo',
        function() {
          ReactErrorUtils.invokeGuardedCallback(
            'foo',
            function() {
              throw err1;
            },
            null,
          );
          err2 = ReactErrorUtils.clearCaughtError();
        },
        null,
      );
      // Returns null because inner error was already captured
      expect(ReactErrorUtils.hasCaughtError()).toBe(false);

      expect(err2).toBe(err1);
    });

    it('handles nested errors in separate renderers', () => {
      const ReactErrorUtils1 = require('ReactErrorUtils');
      jest.resetModules();
      const ReactErrorUtils2 = require('ReactErrorUtils');
      expect(ReactErrorUtils1).not.toEqual(ReactErrorUtils2);

      let ops = [];

      ReactErrorUtils1.invokeGuardedCallback(
        null,
        () => {
          ReactErrorUtils2.invokeGuardedCallback(
            null,
            () => {
              throw new Error('nested error');
            },
            null,
          );
          // ReactErrorUtils2 should catch the error
          ops.push(ReactErrorUtils2.hasCaughtError());
          ops.push(ReactErrorUtils2.clearCaughtError().message);
        },
        null,
      );

      // ReactErrorUtils1 should not catch the error
      ops.push(ReactErrorUtils1.hasCaughtError());

      expect(ops).toEqual([true, 'nested error', false]);
    });

    if (environment === 'production') {
      // jsdom doesn't handle this properly, but Chrome and Firefox should. Test
      // this with a fixture.
      it('catches null values', () => {
        ReactErrorUtils.invokeGuardedCallback(
          null,
          function() {
            throw null;
          },
          null,
        );
        expect(ReactErrorUtils.hasCaughtError()).toBe(true);
        expect(ReactErrorUtils.clearCaughtError()).toBe(null);
      });
    }

    it(`can be shimmed (${environment})`, () => {
      const ops = [];
      // Override the original invokeGuardedCallback
      ReactErrorUtils.injection.injectErrorUtils({
        invokeGuardedCallback(name, func, context, a) {
          ops.push(a);
          try {
            func.call(context, a);
          } catch (error) {
            this._hasCaughtError = true;
            this._caughtError = error;
          }
        },
      });

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
      expect(ops).toEqual(['somearg']);
    });
  }
});
