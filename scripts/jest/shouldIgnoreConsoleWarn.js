'use strict';

module.exports = function shouldIgnoreConsoleWarn(format) {
  if (typeof format === 'string') {
    if (format.indexOf('Warning: react-test-renderer is deprecated.') === 0) {
      return true;
    }
  }

  return false;
};
