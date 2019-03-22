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

function expectHelper(spy, prefix, ...expectedArgs) {
  const expectedStack = expectedArgs.pop();

  expect(spy).toHaveBeenCalledTimes(1);

  const actualArgs = spy.calls.mostRecent().args;

  let actualStack = undefined;
  if (expectedStack !== undefined) {
    actualStack = actualArgs.pop();
    expect(normalizeCodeLocInfo(actualStack)).toBe(expectedStack);
  }

  expect(actualArgs).toHaveLength(expectedArgs.length);
  actualArgs.forEach((actualArg, index) => {
    const expectedArg = expectedArgs[index];
    expect(actualArg).toBe(
      index === 0 ? `${prefix}: ${expectedArg}` : expectedArg,
    );
  });
}

function expectMessageAndStack(...expectedArgs) {
  expectHelper(console.error, 'error', ...expectedArgs);
  expectHelper(console.warn, 'warn', ...expectedArgs);
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
      expectMessageAndStack('logged outside of render', undefined);
    });

    it('should support multiple args', () => {
      function Component() {
        error('error: number:', 123, 'boolean:', true);
        warn('warn: number:', 123, 'boolean:', true);
        return null;
      }

      ReactTestRenderer.create(<Component />);

      expectMessageAndStack(
        'number:',
        123,
        'boolean:',
        true,
        '\n    in Component (at **)',
      );
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

      expectMessageAndStack(
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

      expectMessageAndStack(
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

      expectMessageAndStack(
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

      expectMessageAndStack(
        'logged in child render method',
        '\n    in Child (at **)' + '\n    in Parent (at **)',
      );
    });
  }
});
