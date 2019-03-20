/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

function normalizeCodeLocInfo(str) {
  return str && str.replace(/at .+?:\d+/g, 'at **');
}

function expectWarningToMatch(expectedMessage, expectedStack) {
  expect(console.error).toHaveBeenCalledTimes(1);

  const [actualMessage, actualStack] = console.error.calls.mostRecent().args;

  expect(actualMessage).toBe(expectedMessage);
  expect(normalizeCodeLocInfo(actualStack)).toBe(expectedStack);
}

describe('warnWithComponentStack', () => {
  let React = null;
  let ReactTestRenderer = null;
  let scheduler = null;
  let warnWithComponentStack = null;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('scheduler', () => require('scheduler/unstable_mock'));

    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    scheduler = require('scheduler');

    warnWithComponentStack = React.unstable_warnWithComponentStack;

    spyOnDevAndProd(console, 'error');
  });

  if (!__DEV__) {
    it('passes warnings through to console.error in production mode', () => {
      warnWithComponentStack('Warning logged in production mode');
      expectWarningToMatch('Warning logged in production mode', undefined);
    });
  }

  if (__DEV__) {
    it('does not include component stack when called outside of render', () => {
      warnWithComponentStack('Warning logged outside of render');
      expectWarningToMatch('Warning logged outside of render', undefined);
    });

    it('includes component stack when called from a render method', () => {
      class Parent extends React.Component {
        render() {
          return <Child />;
        }
      }

      function Child() {
        warnWithComponentStack('Warning logged in child render method');
        return null;
      }

      ReactTestRenderer.create(<Parent />);

      expectWarningToMatch(
        'Warning logged in child render method',
        '\n    in Child (at **)' + '\n    in Parent (at **)',
      );
    });

    it('includes component stack when called from a render phase lifecycle method', () => {
      function Parent() {
        return <Child />;
      }

      class Child extends React.Component {
        UNSAFE_componentWillMount() {
          warnWithComponentStack('Warning logged in child cWM lifecycle');
        }
        render() {
          return null;
        }
      }

      ReactTestRenderer.create(<Parent />);

      expectWarningToMatch(
        'Warning logged in child cWM lifecycle',
        '\n    in Child (at **)' + '\n    in Parent (at **)',
      );
    });

    it('includes component stack when called from a commit phase lifecycle method', () => {
      function Parent() {
        return <Child />;
      }

      class Child extends React.Component {
        componentDidMount() {
          warnWithComponentStack('Warning logged in child cDM lifecycle');
        }
        render() {
          return null;
        }
      }

      ReactTestRenderer.create(<Parent />);

      expectWarningToMatch(
        'Warning logged in child cDM lifecycle',
        '\n    in Child (at **)' + '\n    in Parent (at **)',
      );
    });

    it('includes component stack when called from a passive effect handler', () => {
      class Parent extends React.Component {
        render() {
          return <Child />;
        }
      }

      function Child() {
        React.useEffect(() => {
          warnWithComponentStack('Warning logged in child render method');
        });
        return null;
      }

      ReactTestRenderer.create(<Parent />);

      scheduler.flushAll(); // Flush passive effects

      expectWarningToMatch(
        'Warning logged in child render method',
        '\n    in Child (at **)' + '\n    in Parent (at **)',
      );
    });
  }
});
