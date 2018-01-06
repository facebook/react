'use strict';
const diff = require('jest-diff');

function normalizeCodeLocInfo(str) {
  return str && str.replace(/at .+?:\d+/g, 'at **');
}

const toErrorWithStack = (received, expected) => {
  const normalizedMessage = normalizeCodeLocInfo(received[0].prop);
  received[0].prop = normalizedMessage;

  const pass = this.equals(received, expected);
  const diffString = diff(expected, received, {
    expand: this.expand,
  });
  const message = 
    this.utils.matcherHint('.toErrorWithStack') +
    '\n\n' +
    `Expected value to equal:\n` +
    `  ${this.utils.printExpected(expected)}\n` +
    `Received:\n` +
    `  ${this.utils.printReceived(received)}` +
    (diffString ? `\n\nDifference:\n\n${diffString}` : '');

  return {actual: received, message, pass };
};

module.exports = {
  toErrorWithStack,
};
