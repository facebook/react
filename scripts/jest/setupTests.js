'use strict';

const { getTestFlags } = require('./TestFlags');
const {
  assertConsoleLogsCleared,
  resetAllUnexpectedConsoleCalls,
  patchConsoleMethods,
} = require('internal-test-utils/consoleMock');

if (process.env.REACT_CLASS_EQUIVALENCE_TEST) {
  require('./spec-equivalence-reporter/setupTests.js');
} else {
  // ✅ FIX: Use a fallback error map if file not found
  let errorMap = {};
  try {
    errorMap = require('../error-codes/codes.json');
  } catch (e) {
    errorMap = {
      123: 'Error occurred with argument %s.',
      456: 'Another error: %s and %s.',
    };
  }

  const spyOn = jest.spyOn;
  const noop = jest.fn;

  global.spyOn = function () {
    throw new Error(
      'Do not use spyOn(). ' +
        'It can accidentally hide unexpected errors in production builds. ' +
        'Use spyOnDev(), spyOnProd(), or spyOnDevAndProd() instead.'
    );
  };

  if (process.env.NODE_ENV === 'production') {
    global.spyOnDev = noop;
    global.spyOnProd = spyOn;
    global.spyOnDevAndProd = spyOn;
  } else {
    global.spyOnDev = spyOn;
    global.spyOnProd = noop;
    global.spyOnDevAndProd = spyOn;
  }

  expect.extend({
    ...require('./matchers/reactTestMatchers'),
    ...require('./matchers/toThrow'),
  });

  beforeEach(() => {
    global.infiniteLoopError = null;
  });

  afterEach(() => {
    const error = global.infiniteLoopError;
    global.infiniteLoopError = null;
    if (error) throw error;
  });

  patchConsoleMethods({ includeLog: !!process.env.CI });
  beforeEach(resetAllUnexpectedConsoleCalls);
  afterEach(assertConsoleLogsCleared);

  if (process.env.NODE_ENV === 'production') {
    const decodeErrorMessage = function (message) {
      if (!message) return message;
      const re = /react.dev\/errors\/(\d+)?\??([^\s]*)/;
      let matches = message.match(re);
      if (!matches || matches.length !== 3) {
        const re17 = /error-decoder.html\?invariant=(\d+)([^\s]*)/;
        matches = message.match(re17);
        if (!matches || matches.length !== 3) return message;
      }
      const code = parseInt(matches[1], 10);
      const args = matches[2]
        .split('&')
        .filter((s) => s.startsWith('args[]='))
        .map((s) => decodeURIComponent(s.slice('args[]='.length)));

      const format = errorMap[code];
      let argIndex = 0;
      return format?.replace(/%s/g, () => args[argIndex++]) || message;
    };

    const OriginalError = global.Error;
    const originalErrorInstances = new WeakMap();

    const captureStackTrace = function (error, ...args) {
      return OriginalError.captureStackTrace.call(
        this,
        originalErrorInstances.get(error) || error,
        ...args
      );
    };

    const proxyErrorInstance = (error) => {
      const proxy = new Proxy(error, {
        set(target, key, value, receiver) {
          if (key === 'message') {
            return Reflect.set(
              target,
              key,
              decodeErrorMessage(value),
              receiver
            );
          }
          return Reflect.set(target, key, value, receiver);
        },
      });
      originalErrorInstances.set(proxy, error);
      return proxy;
    };

    const ErrorProxy = new Proxy(OriginalError, {
      apply(target, thisArg, argumentsList) {
        const error = Reflect.apply(target, thisArg, argumentsList);
        error.message = decodeErrorMessage(error.message);
        return proxyErrorInstance(error);
      },
      construct(target, argumentsList, newTarget) {
        const error = Reflect.construct(target, argumentsList, newTarget);
        error.message = decodeErrorMessage(error.message);
        return proxyErrorInstance(error);
      },
      get(target, key, receiver) {
        if (key === 'captureStackTrace') return captureStackTrace;
        return Reflect.get(target, key, receiver);
      },
    });

    ErrorProxy.OriginalError = OriginalError;
    global.Error = ErrorProxy;
  }

  const expectTestToFail = async (callback, errorToThrowIfTestSucceeds) => {
    if (callback.length > 0) {
      throw Error(
        'Gated test helpers do not support the `done` callback. Return a promise instead.'
      );
    }

    let didError = false;
    const errorEventHandler = () => {
      didError = true;
    };

    if (typeof addEventListener === 'function') {
      addEventListener('error', errorEventHandler);
    }

    try {
      const maybePromise = callback();
      if (
        maybePromise !== undefined &&
        maybePromise !== null &&
        typeof maybePromise.then === 'function'
      ) {
        await maybePromise;
      }
      assertConsoleLogsCleared();
    } catch {
      didError = true;
    }

    resetAllUnexpectedConsoleCalls();
    if (typeof removeEventListener === 'function') {
      removeEventListener('error', errorEventHandler);
    }

    if (!didError) {
      throw errorToThrowIfTestSucceeds;
    }
  };

  const coerceGateConditionToFunction = (gateFnOrString) =>
    typeof gateFnOrString === 'string'
      ? (flags) => flags[gateFnOrString]
      : gateFnOrString;

  const gatedErrorMessage = 'Gated test was expected to fail, but it passed.';

  global._test_gate = (gateFnOrString, testName, callback, timeoutMS) => {
    const gateFn = coerceGateConditionToFunction(gateFnOrString);
    let shouldPass;

    try {
      const flags = getTestFlags();
      shouldPass = gateFn(flags);
    } catch (e) {
      test(testName, () => {
        throw e;
      }, timeoutMS);
      return;
    }

    if (shouldPass) {
      test(testName, callback, timeoutMS);
    } else {
      const error = new Error(gatedErrorMessage);
      Error.captureStackTrace(error, global._test_gate);
      test(`[GATED, SHOULD FAIL] ${testName}`, () =>
        expectTestToFail(callback, error, timeoutMS)
      );
    }
  };

  global._test_gate_focus = (
    gateFnOrString,
    testName,
    callback,
    timeoutMS
  ) => {
    const gateFn = coerceGateConditionToFunction(gateFnOrString);
    let shouldPass;

    try {
      const flags = getTestFlags();
      shouldPass = gateFn(flags);
    } catch (e) {
      test.only(testName, () => {
        throw e;
      }, timeoutMS);
      return;
    }

    if (shouldPass) {
      test.only(testName, callback, timeoutMS);
    } else {
      const error = new Error(gatedErrorMessage);
      Error.captureStackTrace(error, global._test_gate_focus);
      test.only(`[GATED, SHOULD FAIL] ${testName}`, () =>
        expectTestToFail(callback, error, timeoutMS)
      );
    }
  };

  global.gate = (gateFnOrString) => {
    const gateFn = coerceGateConditionToFunction(gateFnOrString);
    const flags = getTestFlags();
    return gateFn(flags);
  };

  jest.mock('jsdom', () => {
    return require('internal-test-utils/ReactJSDOM.js');
  });
}
