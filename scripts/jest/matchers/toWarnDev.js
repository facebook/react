'use strict';

function createSpy() {
  let calls = [];

  function spy(...args) {
    calls.push(args);
  }

  spy.calls = calls;

  return spy;
}

function normalizeCodeLocInfo(str) {
  return str && str.replace(/at .+?:\d+/g, 'at **');
}

function validator(consoleSpy, expectedWarnings) {
  if (__DEV__) {
    if (typeof expectedWarnings === 'string') {
      expectedWarnings = [expectedWarnings];
    } else if (!Array.isArray(expectedWarnings)) {
      throw Error(
        `toWarnDev() requires a parameter of type string or an array of strings ` +
          `but was given ${typeof expectedWarnings}.`
      );
    }

    if (consoleSpy.calls.length !== expectedWarnings.length) {
      return {
        message: () =>
          `Expected number of DEV warnings:\n  ${this.utils.printExpected(
            expectedWarnings.length
          )}\n` +
          `Actual number of DEV warnings:\n  ${this.utils.printReceived(
            consoleSpy.calls.length
          )}`,
        pass: false,
      };
    }

    // Normalize warnings for easier comparison
    const actualWarnings = [];
    for (let i = 0; i < consoleSpy.calls.length; i++) {
      actualWarnings.push(normalizeCodeLocInfo(consoleSpy.calls[i][0]));
    }

    let failedExpectation;
    for (let i = 0; i < expectedWarnings.length; i++) {
      const expectedWarning = expectedWarnings[i];
      let found = false;

      for (let x = 0; x < expectedWarnings.length; x++) {
        const actualWarning = actualWarnings[x];

        // Allow partial matching.
        if (
          actualWarning === expectedWarning ||
          actualWarning.includes(expectedWarning)
        ) {
          found = true;
          break;
        }
      }

      if (!found) {
        failedExpectation = expectedWarning;
        break;
      }
    }

    if (failedExpectation) {
      return {
        message: () =>
          `Expected DEV warning:\n${this.utils.printExpected(
            failedExpectation
          )}\n` +
          `Actual DEV warnings:\n${this.utils.printReceived(
            actualWarnings.join('\n')
          )}`,
        pass: false,
      };
    }
  }

  return {pass: true};
}

const createMatcherFor = consoleMethod =>
  function(callback, expectedWarnings) {
    if (__DEV__) {
      let originalMethod = console[consoleMethod];

      // Avoid using Jest's built-in spy since it can't be removed.
      console[consoleMethod] = createSpy();

      try {
        callback();

        return validator.call(this, console[consoleMethod], expectedWarnings);
      } finally {
        // Restore the unspied method so that unexpected errors fail tests.
        console[consoleMethod] = originalMethod;
      }
    } else {
      callback();

      return {pass: true};
    }
  };

module.exports = {
  toLowPriorityWarnDev: createMatcherFor('warn'),
  toWarnDev: createMatcherFor('error'),
};
