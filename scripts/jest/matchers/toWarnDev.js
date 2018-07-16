'use strict';

const jestDiff = require('jest-diff');

function normalizeCodeLocInfo(str) {
  return str && str.replace(/at .+?:\d+/g, 'at **');
}

const createMatcherFor = consoleMethod =>
  function matcher(callback, expectedMessages, options = {}) {
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

      const withoutStack = options.withoutStack;
      const warningsWithoutComponentStack = [];
      const warningsWithComponentStack = [];
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
            if (normalizedMessage.includes('\n    in ')) {
              warningsWithComponentStack.push(normalizedMessage);
            } else {
              warningsWithoutComponentStack.push(normalizedMessage);
            }
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
            jestDiff(expectedMessages[0], normalizedMessage);
        } else {
          errorMessage =
            'Unexpected warning recorded: ' +
            jestDiff(expectedMessages, [normalizedMessage]);
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

        if (typeof withoutStack === 'number') {
          // We're expecting a particular number of warnings without stacks.
          if (withoutStack !== warningsWithoutComponentStack.length) {
            return {
              message: () =>
                `Expected ${withoutStack} warnings without a component stack but received ${
                  warningsWithoutComponentStack.length
                }:\n` +
                warningsWithoutComponentStack.map(warning =>
                  this.utils.printReceived(warning)
                ),
              pass: false,
            };
          }
        } else if (withoutStack === true) {
          // We're expecting that all warnings won't have the stack.
          // If some warnings have it, it's an error.
          if (warningsWithComponentStack.length > 0) {
            return {
              message: () =>
                `Received warning unexpectedly includes a component stack:\n  ${this.utils.printReceived(
                  warningsWithComponentStack[0]
                )}\nIf this warning intentionally includes the component stack, remove ` +
                `{withoutStack: true} from the toWarnDev() call. If you have a mix of ` +
                `warnings with and without stack in one toWarnDev() call, pass ` +
                `{withoutStack: N} where N is the number of warnings without stacks.`,
              pass: false,
            };
          }
        } else if (withoutStack === false || withoutStack === undefined) {
          // We're expecting that all warnings *do* have the stack (default).
          // If some warnings don't have it, it's an error.
          if (warningsWithoutComponentStack.length > 0) {
            return {
              message: () =>
                `Received warning unexpectedly does not include a component stack:\n  ${this.utils.printReceived(
                  warningsWithoutComponentStack[0]
                )}\nIf this warning intentionally omits the component stack, add ` +
                `{withoutStack: true} to the toWarnDev() call.`,
              pass: false,
            };
          }
        } else {
          throw Error(
            `The second argument for toWarnDev(), when specified, must be an object. It may have a ` +
              `property called "withoutStack" whose value may be undefined, boolean, or a number. ` +
              `Instead received ${typeof withoutStack}.`
          );
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
