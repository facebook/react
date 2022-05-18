'use strict';

const semver = require('semver');

jest.mock('scheduler/tracing', () => {
  return jest.requireActual('scheduler/tracing-profiling');
});

// react-dom/client is only in v18.0.0 and up, so we
// need to mock it with react-dom. We don't actually need
// to use
if (
  process.env.REACT_VERSION &&
  semver.satisfies(process.env.REACT_VERSION, '<18.0')
) {
  jest.mock('react-dom/client', () => {
    return jest.requireActual('react-dom');
  });
}

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
