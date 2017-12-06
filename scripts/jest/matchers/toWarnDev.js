'use strict';

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

    if (consoleSpy.calls.count() !== expectedWarnings.length) {
      return {
        message: () =>
          `Expected number of DEV warnings:\n  ${this.utils.printExpected(
            expectedWarnings.length
          )}\n` +
          `Actual number of DEV warnings:\n  ${this.utils.printReceived(
            consoleSpy.calls.count()
          )}`,
        pass: false,
      };
    }

    // Normalize warnings for easier comparison
    const actualWarnings = [];
    for (let i = 0; i < consoleSpy.calls.count(); i++) {
      actualWarnings.push(normalizeCodeLocInfo(consoleSpy.calls.argsFor(i)[0]));
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
      if (!console[consoleMethod].hasOwnProperty('calls')) {
        spyOnDev(console, consoleMethod);
      } else {
        console[consoleMethod].calls.reset();
      }
    }

    callback();

    const response = validator.call(
      this,
      console[consoleMethod],
      expectedWarnings
    );

    return response;
  };

module.exports = {
  toLowPriorityWarnDev: createMatcherFor('warn'),
  toWarnDev: createMatcherFor('error'),
};
