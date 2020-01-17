/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

let React;
let ReactDOM;
let ReactFeatureFlags;

function App() {
  return null;
}

beforeEach(() => {
  jest.resetModules();
  jest.unmock('scheduler');
  React = require('react');
  ReactDOM = require('react-dom');
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.warnAboutUnmockedScheduler = true;
});

afterEach(() => {
  ReactFeatureFlags.warnAboutUnmockedScheduler = false;
});

it('should warn in legacy mode', () => {
  expect(() => {
    ReactDOM.render(<App />, document.createElement('div'));
  }).toErrorDev(
    ['Starting from React v17, the "scheduler" module will need to be mocked'],
    {withoutStack: true},
  );
  // does not warn twice
  expect(() => {
    ReactDOM.render(<App />, document.createElement('div'));
  }).toErrorDev([]);
});

it('does not warn if Scheduler is mocked', () => {
  jest.resetModules();
  jest.mock('scheduler', () => require('scheduler/unstable_mock'));
  React = require('react');
  ReactDOM = require('react-dom');
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.warnAboutUnmockedScheduler = true;

  // This should not warn
  expect(() => {
    ReactDOM.render(<App />, document.createElement('div'));
  }).toErrorDev([]);
});
