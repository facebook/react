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
  expect(console.warn).toHaveBeenCalledTimes(1);

  let [actualMessage, actualStack] = console.error.calls.mostRecent().args;

  expect(actualMessage).toBe(`error: ${expectedMessage}`);
  expect(normalizeCodeLocInfo(actualStack)).toBe(expectedStack);

  [actualMessage, actualStack] = console.warn.calls.mostRecent().args;

  expect(actualMessage).toBe(`warn: ${expectedMessage}`);
  expect(normalizeCodeLocInfo(actualStack)).toBe(expectedStack);
}

describe('withComponentStack', () => {
  let React = null;
  let ReactTestRenderer = null;
  let error = null;
  let scheduler = null;
  let warn = null;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('scheduler', () => require('scheduler/unstable_mock'));

    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    scheduler = require('scheduler');

    error = React.error;
    warn = React.warn;

    spyOnDevAndProd(console, 'error');
    spyOnDevAndProd(console, 'warn');
  });

  if (!__DEV__) {
    it('does nothing in production mode', () => {
      error('error');
      warn('warning');

      expect(console.error).toHaveBeenCalledTimes(0);
      expect(console.warn).toHaveBeenCalledTimes(0);
    });
  }

  if (__DEV__) {
    it('does not include component stack when called outside of render', () => {
      error('error: logged outside of render');
      warn('warn: logged outside of render');
      expectWarningToMatch('logged outside of render', undefined);
    });

    it('includes component stack when called from a render method', () => {
      class Parent extends React.Component {
        render() {
          return <Child />;
        }
      }

      function Child() {
        error('error: logged in child render method');
        warn('warn: logged in child render method');
        return null;
      }

      ReactTestRenderer.create(<Parent />);

      expectWarningToMatch(
        'logged in child render method',
        '\n    in Child (at **)' + '\n    in Parent (at **)',
      );
    });

    it('includes component stack when called from a render phase lifecycle method', () => {
      function Parent() {
        return <Child />;
      }

      class Child extends React.Component {
        UNSAFE_componentWillMount() {
          error('error: logged in child cWM lifecycle');
          warn('warn: logged in child cWM lifecycle');
        }
        render() {
          return null;
        }
      }

      ReactTestRenderer.create(<Parent />);

      expectWarningToMatch(
        'logged in child cWM lifecycle',
        '\n    in Child (at **)' + '\n    in Parent (at **)',
      );
    });

    it('includes component stack when called from a commit phase lifecycle method', () => {
      function Parent() {
        return <Child />;
      }

      class Child extends React.Component {
        componentDidMount() {
          error('error: logged in child cDM lifecycle');
          warn('warn: logged in child cDM lifecycle');
        }
        render() {
          return null;
        }
      }

      ReactTestRenderer.create(<Parent />);

      expectWarningToMatch(
        'logged in child cDM lifecycle',
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
          error('error: logged in child render method');
          warn('warn: logged in child render method');
        });
        return null;
      }

      ReactTestRenderer.create(<Parent />);

      scheduler.flushAll(); // Flush passive effects

      expectWarningToMatch(
        'logged in child render method',
        '\n    in Child (at **)' + '\n    in Parent (at **)',
      );
    });
  }
});
