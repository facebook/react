'use strict';

const jestDiff = require('jest-diff');

function diffString(a, b) {
  // jest-diff does not currently handle single line strings correctly
  // The easiest work around is to ensure that both strings are multiline
  // https://github.com/facebook/jest/issues/5657
  return jestDiff(a + '\n', b + '\n');
}

function normalizeCodeLocInfo(str) {
  return str && str.replace(/at .+?:\d+/g, 'at **');
}

const createMatcherFor = consoleMethod =>
  function matcher(callback, expectedMessages) {
    if (__DEV__) {
      // Warn about incorrect usage of matcher.
      if (typeof expectedMessages === 'string') {
        expectedMessages = [expectedMessages];
      } else if (!Array.isArray(expectedMessages)) {
        throw Error(
          `toWarnDev() requires a parameter of type string or an array of strings ` +
            `but was given ${typeof expectedMessages}.`
        );
      }

      const unexpectedWarnings = [];

      // Catch errors thrown by the callback,
      // But only rethrow them if all test expectations have been satisfied.
      // Otherwise an Error in the callback can mask a failed expectation,
      // and result in a test that passes when it shouldn't.
      let caughtError;

      const consoleSpy = message => {
        const normalizedMessage = normalizeCodeLocInfo(message);

        for (let index = 0; index < expectedMessages.length; index++) {
          const expectedMessage = expectedMessages[index];
          if (
            normalizedMessage === expectedMessage ||
            normalizedMessage.includes(expectedMessage)
          ) {
            expectedMessages.splice(index, 1);
            return;
          }
        }

        let errorMessage;
        if (expectedMessages.length === 0) {
          errorMessage =
            'Unexpected warning recorded: ' +
            this.utils.printReceived(normalizedMessage);
        } else if (expectedMessages.length === 1) {
          errorMessage =
            'Unexpected warning recorded: ' +
            diffString(normalizedMessage, expectedMessages[0]);
        } else {
          errorMessage =
            'Unexpected warning recorded: ' +
            diffString([normalizedMessage], expectedMessages);
        }

        // Record the call stack for unexpected warnings.
        // We don't throw an Error here though,
        // Because it might be suppressed by ReactFiberScheduler.
        unexpectedWarnings.push(new Error(errorMessage));
      };

      // TODO Decide whether we need to support nested toWarn* expectations.
      // If we don't need id, add a check here to see if this is already our spy,
      // And throw an error.
      const originalMethod = console[consoleMethod];

      // Avoid using Jest's built-in spy since it can't be removed.
      console[consoleMethod] = consoleSpy;

      try {
        callback();
      } catch (error) {
        caughtError = error;
      } finally {
        // Restore the unspied method so that unexpected errors fail tests.
        console[consoleMethod] = originalMethod;

        // Any unexpected Errors thrown by the callback should fail the test.
        // This should take precedence since unexpected errors could block warnings.
        if (caughtError) {
          throw caughtError;
        }

        // Any unexpected warnings should be treated as a failure.
        if (unexpectedWarnings.length > 0) {
          return {
            message: () => unexpectedWarnings[0].stack,
            pass: false,
          };
        }

        // Any remaining messages indicate a failed expectations.
        if (expectedMessages.length > 0) {
          return {
            message: () =>
              `Expected warning was not recorded:\n  ${this.utils.printReceived(
                expectedMessages[0]
              )}`,
            pass: false,
          };
        }

        return {pass: true};
      }
    } else {
      // Any uncaught errors or warnings should fail tests in production mode.
      callback();

      return {pass: true};
    }
  };

module.exports = {
  toLowPriorityWarnDev: createMatcherFor('warn'),
  toWarnDev: createMatcherFor('error'),
};
