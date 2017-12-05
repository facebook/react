'use strict';

function normalizeCodeLocInfo(str) {
  return str && str.replace(/at .+?:\d+/g, 'at **');
}

module.exports = function toWarnDev(callback, expectedWarnings) {
  if (!console.error.hasOwnProperty('calls')) {
    spyOnDev(console, 'error');
  }

  callback();

  if (__DEV__) {
    if (typeof expectedWarnings === 'string') {
      expectedWarnings = [expectedWarnings];
    }

    if (Array.isArray(expectedWarnings)) {
      if (console.error.calls.count() !== expectedWarnings.length) {
        return {
          message: () =>
            `Expected number of DEV warnings:\n  ${this.utils.printExpected(
              expectedWarnings.length
            )}\n` +
            `Actual number of DEV warnings:\n  ${this.utils.printReceived(
              console.error.calls.count()
            )}`,
          pass: false,
        };
      }

      const actualWarnings = [];
      for (let i = 0; i < console.error.calls.count(); i++) {
        actualWarnings.push(
          normalizeCodeLocInfo(console.error.calls.argsFor(i)[0])
        );
      }

      const failure = expectedWarnings.find(expectedWarning => {
        return !actualWarnings.includes(expectedWarning)
          ? expectedWarning
          : null;
      });

      if (failure) {
        return {
          message: () =>
            `Expected DEV warning:\n${this.utils.printExpected(failure)}\n` +
            `Actual DEV warnings:\n${this.utils.printReceived(
              actualWarnings.join('\n')
            )}`,
          pass: false,
        };
      } else {
        return {pass: true};
      }
    } else {
      throw Error(
        `toWarnDev() requires a parameter of type string or an array of strings ` +
          `but was given ${typeof expectedWarnings}.`
      );
    }
  }
};
