/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable react-internal/no-production-logging */
const chalk = require('chalk');
const util = require('util');
const shouldIgnoreConsoleError = require('./shouldIgnoreConsoleError');
const shouldIgnoreConsoleWarn = require('./shouldIgnoreConsoleWarn');
import {diff} from 'jest-diff';
import {printReceived} from 'jest-matcher-utils';

// Annoying: need to store the log array on the global or it would
// change reference whenever you call jest.resetModules after patch.
const loggedErrors = (global.__loggedErrors = global.__loggedErrors || []);
const loggedWarns = (global.__loggedWarns = global.__loggedWarns || []);
const loggedLogs = (global.__loggedLogs = global.__loggedLogs || []);

// TODO: delete these after code modding away from toWarnDev.
const unexpectedErrorCallStacks = (global.__unexpectedErrorCallStacks =
  global.__unexpectedErrorCallStacks || []);
const unexpectedWarnCallStacks = (global.__unexpectedWarnCallStacks =
  global.__unexpectedWarnCallStacks || []);
const unexpectedLogCallStacks = (global.__unexpectedLogCallStacks =
  global.__unexpectedLogCallStacks || []);

const patchConsoleMethod = (
  methodName,
  unexpectedConsoleCallStacks,
  logged,
) => {
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
    logged.push([format, ...args]);
  };

  console[methodName] = newMethod;

  return newMethod;
};

const flushUnexpectedConsoleCalls = (
  mockMethod,
  methodName,
  expectedMatcher,
  unexpectedConsoleCallStacks,
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
          .join('\n')}`,
    );

    const type = methodName === 'log' ? 'log' : 'warning';
    const message =
      `Expected test not to call ${chalk.bold(
        `console.${methodName}()`,
      )}.\n\n` +
      `If the ${type} is expected, test for it explicitly by:\n` +
      `1. Using ${chalk.bold(expectedMatcher + '()')} or...\n` +
      `2. Mock it out using ${chalk.bold(
        'spyOnDev',
      )}(console, '${methodName}') or ${chalk.bold(
        'spyOnProd',
      )}(console, '${methodName}'), and test that the ${type} occurs.`;

    throw new Error(`${message}\n\n${messages.join('\n\n')}`);
  }
};

let errorMethod;
let warnMethod;
let logMethod;
export function patchConsoleMethods({includeLog} = {includeLog: false}) {
  errorMethod = patchConsoleMethod(
    'error',
    unexpectedErrorCallStacks,
    loggedErrors,
  );
  warnMethod = patchConsoleMethod(
    'warn',
    unexpectedWarnCallStacks,
    loggedWarns,
  );

  // Only assert console.log isn't called in CI so you can debug tests in DEV.
  // The matchers will still work in DEV, so you can assert locally.
  if (includeLog) {
    logMethod = patchConsoleMethod('log', unexpectedLogCallStacks, loggedLogs);
  }
}

export function flushAllUnexpectedConsoleCalls() {
  flushUnexpectedConsoleCalls(
    errorMethod,
    'error',
    'assertConsoleErrorDev',
    unexpectedErrorCallStacks,
  );
  flushUnexpectedConsoleCalls(
    warnMethod,
    'warn',
    'assertConsoleWarnDev',
    unexpectedWarnCallStacks,
  );
  if (logMethod) {
    flushUnexpectedConsoleCalls(
      logMethod,
      'log',
      'assertConsoleLogDev',
      unexpectedLogCallStacks,
    );
    unexpectedLogCallStacks.length = 0;
  }
  unexpectedErrorCallStacks.length = 0;
  unexpectedWarnCallStacks.length = 0;
}

export function resetAllUnexpectedConsoleCalls() {
  loggedErrors.length = 0;
  loggedWarns.length = 0;
  unexpectedErrorCallStacks.length = 0;
  unexpectedWarnCallStacks.length = 0;
  if (logMethod) {
    loggedLogs.length = 0;
    unexpectedLogCallStacks.length = 0;
  }
}

export function clearLogs() {
  const logs = Array.from(loggedLogs);
  unexpectedLogCallStacks.length = 0;
  loggedLogs.length = 0;
  return logs;
}

export function clearWarnings() {
  const warnings = Array.from(loggedWarns);
  unexpectedWarnCallStacks.length = 0;
  loggedWarns.length = 0;
  return warnings;
}

export function clearErrors() {
  const errors = Array.from(loggedErrors);
  unexpectedErrorCallStacks.length = 0;
  loggedErrors.length = 0;
  return errors;
}

export function assertConsoleLogsCleared() {
  const logs = clearLogs();
  const warnings = clearWarnings();
  const errors = clearErrors();

  if (logs.length > 0 || errors.length > 0 || warnings.length > 0) {
    let message = `${chalk.dim('asserConsoleLogsCleared')}(${chalk.red(
      'expected',
    )})\n`;

    if (logs.length > 0) {
      message += `\nconsole.log was called without assertConsoleLogDev:\n${diff(
        '',
        logs.join('\n'),
        {
          omitAnnotationLines: true,
        },
      )}\n`;
    }

    if (warnings.length > 0) {
      message += `\nconsole.warn was called without assertConsoleWarnDev:\n${diff(
        '',
        warnings.join('\n'),
        {
          omitAnnotationLines: true,
        },
      )}\n`;
    }
    if (errors.length > 0) {
      message += `\nconsole.error was called without assertConsoleErrorDev:\n${diff(
        '',
        errors.join('\n'),
        {
          omitAnnotationLines: true,
        },
      )}\n`;
    }

    message += `\nYou must call one of the assertConsoleDev helpers between each act call.`;

    const error = Error(message);
    Error.captureStackTrace(error, assertConsoleLogsCleared);
    throw error;
  }
}

function replaceComponentStack(str) {
  if (typeof str !== 'string') {
    return str;
  }
  // This special case exists only for the special source location in
  // ReactElementValidator. That will go away if we remove source locations.
  str = str.replace(/Check your code at .+?:\d+/g, 'Check your code at **');
  // V8 format:
  //  at Component (/path/filename.js:123:45)
  // React format:
  //    in Component (at filename.js:123)
  return str.replace(/\n +(?:at|in) ([\S]+)[^\n]*.*/, function (m, name) {
    return chalk.dim(' <component stack>');
  });
}

const isLikelyAComponentStack = message =>
  typeof message === 'string' &&
  (message.indexOf('<component stack>') > -1 ||
    message.includes('\n    in ') ||
    message.includes('\n    at '));

export function createLogAssertion(
  consoleMethod,
  matcherName,
  clearObservedErrors,
) {
  function logName() {
    switch (consoleMethod) {
      case 'log':
        return 'log';
      case 'error':
        return 'error';
      case 'warn':
        return 'warning';
    }
  }

  return function assertConsoleLog(expectedMessages, options = {}) {
    if (__DEV__) {
      // eslint-disable-next-line no-inner-declarations
      function throwFormattedError(message) {
        const error = new Error(
          `${chalk.dim(matcherName)}(${chalk.red(
            'expected',
          )})\n\n${message.trim()}`,
        );
        Error.captureStackTrace(error, assertConsoleLog);
        throw error;
      }

      // Warn about incorrect usage first arg.
      if (!Array.isArray(expectedMessages)) {
        throwFormattedError(
          `Expected messages should be an array of strings ` +
            `but was given type "${typeof expectedMessages}".`,
        );
      }

      // Warn about incorrect usage second arg.
      if (options != null) {
        if (typeof options !== 'object' || Array.isArray(options)) {
          throwFormattedError(
            `The second argument should be an object. ` +
              'Did you forget to wrap the messages into an array?',
          );
        }
      }

      const withoutStack = options.withoutStack;

      if (consoleMethod === 'log' && withoutStack !== undefined) {
        // We don't expect any console.log calls to have a stack.
        throwFormattedError(
          `Do not pass withoutStack to assertConsoleLogDev, console.log does not have component stacks.`,
        );
      } else if (
        withoutStack !== undefined &&
        typeof withoutStack !== 'number' &&
        withoutStack !== true
      ) {
        throwFormattedError(
          `The second argument for ${matcherName}(), when specified, must be an object. It may have a ` +
            `property called "withoutStack" whose value may be a boolean or number. ` +
            `Instead received ${typeof withoutStack}.`,
        );
      }

      const observedLogs = clearObservedErrors();
      const unexpectedLogs = [];
      const receivedLogs = [];
      const logsWithoutComponentStack = [];
      const logsWithComponentStack = [];
      const logsMismatchingFormat = [];
      const logsWithExtraComponentStack = [];
      const missingExpectedLogs = Array.from(expectedMessages);

      // Loop over all the observed logs to determine:
      //   - Which expected logs are missing
      //   - Which received logs are unexpected
      //   - Which logs have a component stack
      //   - Which logs have the wrong format
      //   - Which logs have extra stacks
      for (let index = 0; index < observedLogs.length; index++) {
        const log = observedLogs[index];
        const [format, ...args] = log;
        const message = util.format(format, ...args);

        // Ignore uncaught errors reported by jsdom
        // and React addendums because they're too noisy.
        if (shouldIgnoreConsoleError(format, args)) {
          return;
        }

        const expectedMessage = replaceComponentStack(expectedMessages[index]);
        const normalizedMessage = replaceComponentStack(message);
        receivedLogs.push(normalizedMessage);

        // Check the number of %s interpolations.
        // We'll fail the test if they mismatch.
        let argIndex = 0;
        // console.* could have been called with a non-string e.g. `console.error(new Error())`
        // eslint-disable-next-line react-internal/safe-string-coercion
        String(format).replace(/%s/g, () => argIndex++);
        if (argIndex !== args.length) {
          logsMismatchingFormat.push({
            format,
            args,
            expectedArgCount: argIndex,
          });
        }

        // Check for extra component stacks
        if (
          args.length >= 2 &&
          isLikelyAComponentStack(args[args.length - 1]) &&
          isLikelyAComponentStack(args[args.length - 2])
        ) {
          logsWithExtraComponentStack.push({
            format,
          });
        }

        // Check if log is expected, and if it has a component stack.
        if (
          normalizedMessage === expectedMessage ||
          normalizedMessage.includes(expectedMessage)
        ) {
          if (isLikelyAComponentStack(normalizedMessage)) {
            logsWithComponentStack.push(normalizedMessage);
          } else {
            logsWithoutComponentStack.push(normalizedMessage);
          }

          // Found expected log, remove it from missing.
          missingExpectedLogs.splice(0, 1);
        } else {
          unexpectedLogs.push(normalizedMessage);
        }
      }

      // Helper for pretty printing diffs consistently.
      // We inline multi-line logs for better diff printing.
      // eslint-disable-next-line no-inner-declarations
      function printDiff() {
        return `${diff(
          expectedMessages
            .map(message => message.replace('\n', ' '))
            .join('\n'),
          receivedLogs.map(message => message.replace('\n', ' ')).join('\n'),
          {
            aAnnotation: `Expected ${logName()}s`,
            bAnnotation: `Received ${logName()}s`,
          },
        )}`;
      }

      // Any unexpected warnings should be treated as a failure.
      if (unexpectedLogs.length > 0) {
        throwFormattedError(
          `Unexpected ${logName()}(s) recorded.\n\n${printDiff()}`,
        );
      }

      // Any remaining messages indicate a failed expectations.
      if (missingExpectedLogs.length > 0) {
        throwFormattedError(
          `Expected ${logName()} was not recorded.\n\n${printDiff()}`,
        );
      }

      // Any unexpected component stacks are a failure.
      if (consoleMethod !== 'log') {
        if (typeof withoutStack === 'number') {
          // We're expecting a particular number of warnings without stacks.
          if (withoutStack !== logsWithoutComponentStack.length) {
            throwFormattedError(
              `Expected ${withoutStack} ${logName()}s without a component stack but received ${
                logsWithoutComponentStack.length
              }:\n${printDiff()}`,
            );
          }
        } else if (withoutStack === true) {
          // We're expecting that all warnings won't have the stack.
          // If some warnings have it, it's an error.
          if (logsWithComponentStack.length > 0) {
            throwFormattedError(
              `${logsWithComponentStack
                .map(
                  stack =>
                    `Unexpected component stack for:\n  ${printReceived(
                      stack,
                    )}`,
                )
                .join(
                  '\n\n',
                )}\n\nIf this ${logName()} intentionally includes the component stack, remove ` +
                `{withoutStack: true} from the ${matcherName}() call.\nIf you have a mix of ` +
                `${logName()}s with and without stack in one ${matcherName}() call, pass ` +
                `{withoutStack: N} where N is the number of ${logName()}s without stacks.`,
            );
          }
        } else if (withoutStack === undefined) {
          // We're expecting that all warnings *do* have the stack (default).
          // If some warnings don't have it, it's an error.
          if (logsWithoutComponentStack.length > 0) {
            throwFormattedError(
              `${logsWithoutComponentStack
                .map(
                  stack =>
                    `Missing component stack for:\n  ${printReceived(stack)}`,
                )
                .join(
                  '\n\n',
                )}\n\nIf this ${logName()} intentionally omits the component stack, add {withoutStack: true} to the ${matcherName} call.`,
            );
          }
        }
      }

      // Wrong %s formatting is a failure.
      // This is a common mistake when creating new warnings.
      if (logsMismatchingFormat.length > 0) {
        throwFormattedError(
          logsMismatchingFormat
            .map(
              item =>
                `Received ${item.args.length} arguments for a message with ${
                  item.expectedArgCount
                } placeholders:\n  ${printReceived(item.format)}`,
            )
            .join('\n\n'),
        );
      }

      // Duplicate component stacks is a failure.
      // This used to be a common mistake when creating new warnings,
      // but might not be an issue anymore.
      if (logsWithExtraComponentStack.length > 0) {
        throwFormattedError(
          logsWithExtraComponentStack
            .map(
              item =>
                `Received more than one component stack for a warning:\n  ${printReceived(
                  item.format,
                )}`,
            )
            .join('\n\n'),
        );
      }
    }
  };
}
