'use strict';

const chalk = require('chalk');
const util = require('util');
const shouldIgnoreConsoleError = require('./shouldIgnoreConsoleError');
const shouldIgnoreConsoleWarn = require('./shouldIgnoreConsoleWarn');
const {getTestFlags} = require('./TestFlags');

if (process.env.REACT_CLASS_EQUIVALENCE_TEST) {
  // Inside the class equivalence tester, we have a custom environment, let's
  // require that instead.
  require('./spec-equivalence-reporter/setupTests.js');
} else {
  const errorMap = require('../error-codes/codes.json');

  // By default, jest.spyOn also calls the spied method.
  const spyOn = jest.spyOn;
  const noop = jest.fn;

  // Spying on console methods in production builds can mask errors.
  // This is why we added an explicit spyOnDev() helper.
  // It's too easy to accidentally use the more familiar spyOn() helper though,
  // So we disable it entirely.
  // Spying on both dev and prod will require using both spyOnDev() and spyOnProd().
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
    ...require('./matchers/toWarnDev'),
  });

  // We have a Babel transform that inserts guards against infinite loops.
  // If a loop runs for too many iterations, we throw an error and set this
  // global variable. The global lets us detect an infinite loop even if
  // the actual error object ends up being caught and ignored. An infinite
  // loop must always fail the test!
  beforeEach(() => {
    global.infiniteLoopError = null;
  });
  afterEach(() => {
    const error = global.infiniteLoopError;
    global.infiniteLoopError = null;
    if (error) {
      throw error;
    }
  });

  // TODO: Consider consolidating this with `yieldValue`. In both cases, tests
  // should not be allowed to exit without asserting on the entire log.
  const patchConsoleMethod = (methodName, unexpectedConsoleCallStacks) => {
    const newMethod = function (format, ...args) {
      // Ignore uncaught errors reported by jsdom
      // and React addendums because they're too noisy.
      if (shouldIgnoreConsoleError(format, args)) {
        return;
      }

      // Ignore certain React warnings causing test failures
      if (methodName === 'warn' && shouldIgnoreConsoleWarn(format)) {
        return;
      }

      // Capture the call stack now so we can warn about it later.
      // The call stack has helpful information for the test author.
      // Don't throw yet though b'c it might be accidentally caught and suppressed.
      const stack = new Error().stack;
      unexpectedConsoleCallStacks.push([
        stack.slice(stack.indexOf('\n') + 1),
        util.format(format, ...args),
      ]);
    };

    console[methodName] = newMethod;

    return newMethod;
  };

  const flushUnexpectedConsoleCalls = (
    mockMethod,
    methodName,
    expectedMatcher,
    unexpectedConsoleCallStacks
  ) => {
    if (
      console[methodName] !== mockMethod &&
      !jest.isMockFunction(console[methodName])
    ) {
      // throw new Error(
      //  `Test did not tear down console.${methodName} mock properly.`
      // );
    }
    if (unexpectedConsoleCallStacks.length > 0) {
      const messages = unexpectedConsoleCallStacks.map(
        ([stack, message]) =>
          `${chalk.red(message)}\n` +
          `${stack
            .split('\n')
            .map(line => chalk.gray(line))
            .join('\n')}`
      );

      const type = methodName === 'log' ? 'log' : 'warning';
      const message =
        `Expected test not to call ${chalk.bold(
          `console.${methodName}()`
        )}.\n\n` +
        `If the ${type} is expected, test for it explicitly by:\n` +
        `1. Using the ${chalk.bold('.' + expectedMatcher + '()')} ` +
        `matcher, or...\n` +
        `2. Mock it out using ${chalk.bold(
          'spyOnDev'
        )}(console, '${methodName}') or ${chalk.bold(
          'spyOnProd'
        )}(console, '${methodName}'), and test that the ${type} occurs.`;

      throw new Error(`${message}\n\n${messages.join('\n\n')}`);
    }
  };

  const unexpectedErrorCallStacks = [];
  const unexpectedWarnCallStacks = [];
  const unexpectedLogCallStacks = [];

  const errorMethod = patchConsoleMethod('error', unexpectedErrorCallStacks);
  const warnMethod = patchConsoleMethod('warn', unexpectedWarnCallStacks);
  let logMethod;

  // Only assert console.log isn't called in CI so you can debug tests in DEV.
  // The matchers will still work in DEV, so you can assert locally.
  if (process.env.CI) {
    logMethod = patchConsoleMethod('log', unexpectedLogCallStacks);
  }

  const flushAllUnexpectedConsoleCalls = () => {
    flushUnexpectedConsoleCalls(
      errorMethod,
      'error',
      'toErrorDev',
      unexpectedErrorCallStacks
    );
    flushUnexpectedConsoleCalls(
      warnMethod,
      'warn',
      'toWarnDev',
      unexpectedWarnCallStacks
    );
    if (logMethod) {
      flushUnexpectedConsoleCalls(
        logMethod,
        'log',
        'toLogDev',
        unexpectedLogCallStacks
      );
      unexpectedLogCallStacks.length = 0;
    }
    unexpectedErrorCallStacks.length = 0;
    unexpectedWarnCallStacks.length = 0;
  };

  const resetAllUnexpectedConsoleCalls = () => {
    unexpectedErrorCallStacks.length = 0;
    unexpectedWarnCallStacks.length = 0;
    if (logMethod) {
      unexpectedLogCallStacks.length = 0;
    }
  };

  beforeEach(resetAllUnexpectedConsoleCalls);
  afterEach(flushAllUnexpectedConsoleCalls);

  if (process.env.NODE_ENV === 'production') {
    // In production, we strip error messages and turn them into codes.
    // This decodes them back so that the test assertions on them work.
    // 1. `ErrorProxy` decodes error messages at Error construction time and
    //    also proxies error instances with `proxyErrorInstance`.
    // 2. `proxyErrorInstance` decodes error messages when the `message`
    //    property is changed.
    const decodeErrorMessage = function (message) {
      if (!message) {
        return message;
      }
      const re = /react.dev\/errors\/(\d+)?\??([^\s]*)/;
      let matches = message.match(re);
      if (!matches || matches.length !== 3) {
        // Some tests use React 17, when the URL was different.
        const re17 = /error-decoder.html\?invariant=(\d+)([^\s]*)/;
        matches = message.match(re17);
        if (!matches || matches.length !== 3) {
          return message;
        }
      }
      const code = parseInt(matches[1], 10);
      const args = matches[2]
        .split('&')
        .filter(s => s.startsWith('args[]='))
        .map(s => s.slice('args[]='.length))
        .map(decodeURIComponent);
      const format = errorMap[code];
      let argIndex = 0;
      return format.replace(/%s/g, () => args[argIndex++]);
    };
    const OriginalError = global.Error;
    // V8's Error.captureStackTrace (used in Jest) fails if the error object is
    // a Proxy, so we need to pass it the unproxied instance.
    const originalErrorInstances = new WeakMap();
    const captureStackTrace = function (error, ...args) {
      return OriginalError.captureStackTrace.call(
        this,
        originalErrorInstances.get(error) ||
          // Sometimes this wrapper receives an already-unproxied instance.
          error,
        ...args
      );
    };
    const proxyErrorInstance = error => {
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
        if (key === 'captureStackTrace') {
          return captureStackTrace;
        }
        return Reflect.get(target, key, receiver);
      },
    });
    ErrorProxy.OriginalError = OriginalError;
    global.Error = ErrorProxy;
  }

  const expectTestToFail = async (callback, errorToThrowIfTestSucceeds) => {
    if (callback.length > 0) {
      throw Error(
        'Gated test helpers do not support the `done` callback. Return a ' +
          'promise instead.'
      );
    }

    // Install a global error event handler. We treat global error events as
    // test failures, same as Jest's default behavior.
    //
    // Becaused we installed our own error event handler, Jest will not report a
    // test failure. Conceptually it's as if we wrapped the entire test event in
    // a try-catch.
    let didError = false;
    const errorEventHandler = () => {
      didError = true;
    };
    // eslint-disable-next-line no-restricted-globals
    if (typeof addEventListener === 'function') {
      // eslint-disable-next-line no-restricted-globals
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
      // Flush unexpected console calls inside the test itself, instead of in
      // `afterEach` like we normally do. `afterEach` is too late because if it
      // throws, we won't have captured it.
      flushAllUnexpectedConsoleCalls();
    } catch (testError) {
      didError = true;
    }
    resetAllUnexpectedConsoleCalls();
    // eslint-disable-next-line no-restricted-globals
    if (typeof removeEventListener === 'function') {
      // eslint-disable-next-line no-restricted-globals
      removeEventListener('error', errorEventHandler);
    }

    if (!didError) {
      // The test did not error like we expected it to. Report this to Jest as
      // a failure.
      throw errorToThrowIfTestSucceeds;
    }
  };

  const gatedErrorMessage = 'Gated test was expected to fail, but it passed.';
  global._test_gate = (gateFn, testName, callback) => {
    let shouldPass;
    try {
      const flags = getTestFlags();
      shouldPass = gateFn(flags);
    } catch (e) {
      test(testName, () => {
        throw e;
      });
      return;
    }
    if (shouldPass) {
      test(testName, callback);
    } else {
      const error = new Error(gatedErrorMessage);
      Error.captureStackTrace(error, global._test_gate);
      test(`[GATED, SHOULD FAIL] ${testName}`, () =>
        expectTestToFail(callback, error));
    }
  };
  global._test_gate_focus = (gateFn, testName, callback) => {
    let shouldPass;
    try {
      const flags = getTestFlags();
      shouldPass = gateFn(flags);
    } catch (e) {
      test.only(testName, () => {
        throw e;
      });
      return;
    }
    if (shouldPass) {
      test.only(testName, callback);
    } else {
      const error = new Error(gatedErrorMessage);
      Error.captureStackTrace(error, global._test_gate_focus);
      test.only(`[GATED, SHOULD FAIL] ${testName}`, () =>
        expectTestToFail(callback, error));
    }
  };

  // Dynamic version of @gate pragma
  global.gate = fn => {
    const flags = getTestFlags();
    return fn(flags);
  };
}

// Most of our tests call jest.resetModules in a beforeEach and the
// re-require all the React modules. However, the JSX runtime is injected by
// the compiler, so those bindings don't get updated. This causes warnings
// logged by the JSX runtime to not have a component stack, because component
// stack relies on the the secret internals object that lives on the React
// module, which because of the resetModules call is longer the same one.
//
// To workaround this issue, we use a proxy that re-requires the latest
// JSX Runtime from the require cache on every function invocation.
//
// Longer term we should migrate all our tests away from using require() and
// resetModules, and use import syntax instead so this kind of thing doesn't
// happen.
lazyRequireFunctionExports('react/jsx-dev-runtime');

// TODO: We shouldn't need to do this in the production runtime, but until
// we remove string refs they also depend on the shared state object. Remove
// once we remove string refs.
lazyRequireFunctionExports('react/jsx-runtime');

function lazyRequireFunctionExports(moduleName) {
  jest.mock(moduleName, () => {
    return new Proxy(jest.requireActual(moduleName), {
      get(originalModule, prop) {
        // If this export is a function, return a wrapper function that lazily
        // requires the implementation from the current module cache.
        if (typeof originalModule[prop] === 'function') {
          return function () {
            return jest.requireActual(moduleName)[prop].apply(this, arguments);
          };
        } else {
          return originalModule[prop];
        }
      },
    });
  });
}
