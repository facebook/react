'use strict';

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

        // Fail early for unexpected warnings to preserve the call stack.
        throw Error(
          `Unexpected warning recorded:\n  ${this.utils.printReceived(
            message
          )}\n\nThe following expected warnings were not yet seen:\n  ${this.utils.printExpected(
            expectedMessages.join('\n')
          )}`
        );
      };

      // TODO Decide whether we need to support nested toWarn* expectations.
      // If we don't need id, add a check here to see if this is already our spy,
      // And throw an error.
      const originalMethod = console[consoleMethod];

      // Avoid using Jest's built-in spy since it can't be removed.
      console[consoleMethod] = consoleSpy;

      try {
        callback();

        // Any remaining messages indicate a failed expectations.
        if (expectedMessages.length > 0) {
          return {
            message: () =>
              `Expected warning was not recorded:\n  ${this.utils.printReceived(
                expectedMessages.join('\n')
              )}`,
            pass: false,
          };
        }

        return {pass: true};
      } catch (error) {
        // TODO Flag this error so Jest doesn't override its stack
        // See https://tinyurl.com/y9unakwb
        throw error;
      } finally {
        // Restore the unspied method so that unexpected errors fail tests.
        console[consoleMethod] = originalMethod;
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
