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

const unexpectedErrorCallStacks = [];
const unexpectedWarnCallStacks = [];
const unexpectedLogCallStacks = [];

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
      `1. Using the ${chalk.bold('.' + expectedMatcher + '()')} ` +
      `matcher, or...\n` +
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
  errorMethod = patchConsoleMethod('error', unexpectedErrorCallStacks);
  warnMethod = patchConsoleMethod('warn', unexpectedWarnCallStacks);

  // Only assert console.log isn't called in CI so you can debug tests in DEV.
  // The matchers will still work in DEV, so you can assert locally.
  if (includeLog) {
    logMethod = patchConsoleMethod('log', unexpectedLogCallStacks);
  }
}

export function flushAllUnexpectedConsoleCalls() {
  flushUnexpectedConsoleCalls(
    errorMethod,
    'error',
    'toErrorDev',
    unexpectedErrorCallStacks,
  );
  flushUnexpectedConsoleCalls(
    warnMethod,
    'warn',
    'toWarnDev',
    unexpectedWarnCallStacks,
  );
  if (logMethod) {
    flushUnexpectedConsoleCalls(
      logMethod,
      'log',
      'toLogDev',
      unexpectedLogCallStacks,
    );
    unexpectedLogCallStacks.length = 0;
  }
  unexpectedErrorCallStacks.length = 0;
  unexpectedWarnCallStacks.length = 0;
}

export function resetAllUnexpectedConsoleCalls() {
  unexpectedErrorCallStacks.length = 0;
  unexpectedWarnCallStacks.length = 0;
  if (logMethod) {
    unexpectedLogCallStacks.length = 0;
  }
}
