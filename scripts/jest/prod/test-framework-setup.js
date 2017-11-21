'use strict';

if (process.env.REACT_CLASS_EQUIVALENCE_TEST) {
  // Inside the class equivalence tester, we have a custom environment, let's
  // require that instead.
  require('./setupSpecEquivalenceReporter.js');
} else {
  var env = jasmine.getEnv();

  // TODO: Stop using spyOn in all the test since that seem deprecated.
  // This is a legacy upgrade path strategy from:
  // https://github.com/facebook/jest/blob/v20.0.4/packages/jest-matchers/src/spyMatchers.js#L160
  const isSpy = spy => spy.calls && typeof spy.calls.count === 'function';

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
        global.__hadDevFailures = e.stack;
      }
    };
  };

  const expectDev = function expectDev(actual) {
    const expectation = expect(actual);
    if (global.__suppressDevFailures) {
      Object.keys(expectation).forEach(name => {
        wrapDevMatcher(expectation, name);
        wrapDevMatcher(expectation.not, name);
      });
    }
    return expectation;
  };
  global.expectDev = expectDev;

  require('jasmine-check').install();
}
