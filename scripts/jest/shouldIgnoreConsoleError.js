'use strict';

module.exports = function shouldIgnoreConsoleError(format, args) {
  if (__DEV__) {
    if (typeof format === 'string') {
      if (format.indexOf('Error: Uncaught [') === 0) {
        // This looks like an uncaught error from invokeGuardedCallback() wrapper
        // in development that is reported by jsdom. Ignore because it's noisy.
        return true;
      }
      if (format.indexOf('The above error occurred') === 0) {
        // This looks like an error addendum from ReactFiberErrorLogger.
        // Ignore it too.
        return true;
      }
      if (
        format.indexOf('ReactDOM.render is no longer supported in React 18') !==
          -1 ||
        format.indexOf(
          'ReactDOM.hydrate is no longer supported in React 18'
        ) !== -1
      ) {
        // We haven't finished migrating our tests to use createRoot.
        return true;
      }
      if (
        format.indexOf(
          'uses the legacy contextTypes API which is no longer supported and will be removed'
        ) !== -1 ||
        format.indexOf(
          'uses the legacy childContextTypes API which is no longer supported and will be removed'
        ) !== -1 ||
        format.indexOf('ReactDOMTestUtils is deprecated') !== -1 ||
        format.indexOf('`ReactDOMTestUtils.act` is deprecated') !== -1 ||
        format.indexOf('findDOMNode is deprecated and will be removed') !==
          -1 ||
        format.indexOf('unmountComponentAtNode is deprecated') !== -1
      ) {
        // This is a backported warning. In `main`, there's a different warning
        // (and it's fully tested). Not going to bother upgrading all the tests
        // on this old release branch, so let's just silence it instead.
        return true;
      }
    }
  } else {
    if (
      format != null &&
      typeof format.message === 'string' &&
      typeof format.stack === 'string' &&
      args.length === 0
    ) {
      // In production, ReactFiberErrorLogger logs error objects directly.
      // They are noisy too so we'll try to ignore them.
      return true;
    }
  }
  // Looks legit
  return false;
};
