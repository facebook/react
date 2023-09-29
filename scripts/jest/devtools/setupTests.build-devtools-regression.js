'use strict';

// Regression tests use a React DOM profiling, so we need
// to replace these tests with scheduler/tracing-profiling
jest.mock('scheduler/tracing', () => {
  return jest.requireActual('scheduler/tracing-profiling');
});

// act doesn't exist in older versions of React, but
// DevTools tests sometimes import and depend on act to run.
// If act doesn't exist for a particular version of React, we will
// mock it with a function. This should work in most tests
// that we want to call with older versions of React.
// TODO (luna) Refactor act in DevTools test utils to not depend
// on act in react-dom or react-test-renderer so we don't need to do this
jest.mock('react-test-renderer', () => {
  const reactTestRenderer = jest.requireActual('react-test-renderer');
  if (!reactTestRenderer.act) {
    reactTestRenderer.act = fn => fn();
  }
  return reactTestRenderer;
});

jest.mock('react-dom/test-utils', () => {
  const testUtils = jest.requireActual('react-dom/test-utils');
  if (!testUtils.act) {
    testUtils.act = fn => fn();
  }
  return testUtils;
});
