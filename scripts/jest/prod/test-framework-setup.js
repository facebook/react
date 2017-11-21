'use strict';

if (process.env.REACT_CLASS_EQUIVALENCE_TEST) {
  // Inside the class equivalence tester, we have a custom environment, let's
  // require that instead.
  require('../setupSpecEquivalenceReporter.js');
} else {
  var env = jasmine.getEnv();
  var errorMap = require('../../error-codes/codes.json');

  // TODO: Stop using spyOn in all the test since that seem deprecated.
  // This is a legacy upgrade path strategy from:
  // https://github.com/facebook/jest/blob/v20.0.4/packages/jest-matchers/src/spyMatchers.js#L160
  const isSpy = spy => spy.calls && typeof spy.calls.count === 'function';

  // Dev-only spyOn should be ignored in production runs.
  global.spyOnDev = () => {};

  ['error', 'warn'].forEach(methodName => {
    var oldMethod = console[methodName];
    var newMethod = function() {
      newMethod.__callCount++;
      oldMethod.apply(this, arguments);
    };
    newMethod.__callCount = 0;
    console[methodName] = newMethod;

    env.beforeEach(() => {
      newMethod.__callCount = 0;
    });

    env.afterEach(() => {
      if (console[methodName] !== newMethod && !isSpy(console[methodName])) {
        throw new Error(
          'Test did not tear down console.' + methodName + ' mock properly.'
        );
      }
      if (console[methodName].__callCount !== 0) {
        throw new Error(
          'Expected test not to call console.' +
            methodName +
            '(). ' +
            'If the warning is expected, mock it out using ' +
            "spyOn(console, '" +
            methodName +
            "') and test that the " +
            'warning occurs.'
        );
      }
    });
  });

  var wrapDevMatcher = function(obj, name) {
    const original = obj[name];
    obj[name] = function devMatcher() {
      try {
        original.apply(this, arguments);
      } catch (e) {
        // Ignore DEV-only assertions in prod environment.
      }
    };
  };

  const expectDev = function expectDev(actual) {
    const expectation = expect(actual);
    Object.keys(expectation).forEach(name => {
      wrapDevMatcher(expectation, name);
      wrapDevMatcher(expectation.not, name);
    });
    return expectation;
  };
  global.expectDev = expectDev;

  // In production, we strip error messages and turn them into codes.
  // This decodes them back so that the test assertions on them work.
  var decodeErrorMessage = function(message) {
    if (!message) {
      return message;
    }
    const re = /error-decoder.html\?invariant=(\d+)([^\s]*)/;
    const matches = message.match(re);
    if (!matches || matches.length !== 3) {
      return message;
    }
    const code = parseInt(matches[1], 10);
    const args = matches[2]
      .split('&')
      .filter(s => s.startsWith('args[]='))
      .map(s => s.substr('args[]='.length))
      .map(decodeURIComponent);
    const format = errorMap[code];
    let argIndex = 0;
    return format.replace(/%s/g, () => args[argIndex++]);
  };
  global.Error = new Proxy(global.Error, {
    construct(target, argumentsList, newTarget) {
      const error = Reflect.construct(target, argumentsList, newTarget);
      error.message = decodeErrorMessage(error.message);
      return error;
    },
  });

  require('jasmine-check').install();
}
