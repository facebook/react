'use strict';
const diff = require('jest-diff');

function removeStack(str) {
  return str && str.replace(/in .+? \(at .+?:\d+\)/g, '').trim();
}

function toContent(received, expected) {
  const rm = removeStack(received[0].prop);
  received[0].prop = rm;

  const em = removeStack(expected[0].prop);
  expected[0].prop = em;

  const pass = this.equals(received, expected);

  const diffString = diff(expected, received, {
    expand: this.expand,
  });

  const message = () =>
    this.utils.matcherHint('.toContent') +
    '\n\n' +
    `Expected value to equal:\n` +
    `  ${this.utils.printExpected(expected)}\n` +
    `Received:\n` +
    `  ${this.utils.printReceived(received)}` +
    (diffString ? `\n\nDifference:\n\n${diffString}` : '');

  return {actual: received, message, pass};
}

module.exports = {
  toContent,
};
