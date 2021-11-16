'use strict';

// V8 uses a different message format when reading properties of null or undefined.
// Older versions use e.g. "Cannot read property 'world' of undefined"
// Newer versions use e.g. "Cannot read properties of undefined (reading 'world')"
// This file overrides the built-in toThrow() matches to handle both cases,
// enabling the React project to support Node 12-16 without forking tests.

const toThrowMatchers = require('expect/build/toThrowMatchers').default;
const builtInToThrow = toThrowMatchers.toThrow;

// Detect the newer stack format:
let newErrorFormat = false;
try {
  null.test();
} catch (error) {
  if (error.message.includes('Cannot read properties of null')) {
    newErrorFormat = true;
  }
}

// Detect the message pattern we need to rename:
const regex = /Cannot read property '([^']+)' of (.+)/;

// Massage strings (written in the older format) to match the newer format
// if tests are currently running on Node 16+
function normalizeErrorMessage(message) {
  if (newErrorFormat) {
    const match = message.match(regex);
    if (match) {
      return `Cannot read properties of ${match[2]} (reading '${match[1]}')`;
    }
  }

  return message;
}

function toThrow(value, expectedValue) {
  if (typeof expectedValue === 'string') {
    expectedValue = normalizeErrorMessage(expectedValue);
  } else if (expectedValue instanceof Error) {
    expectedValue.message = normalizeErrorMessage(expectedValue.message);
  }

  return builtInToThrow.call(this, value, expectedValue);
}

module.exports = {
  toThrow,
};
