/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactNoop;

describe('ReactIncrementalErrorLogging', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  it('should log errors that occur during the begin phase', () => {
    // Errors are redundantly logged in production mode by ReactFiberErrorLogger.
    // It's okay to ignore them for the purpose of this test.
    spyOnProd(console, 'error');

    class ErrorThrowingComponent extends React.Component {
      UNSAFE_componentWillMount() {
        const error = new Error('componentWillMount error');
        // Note: it's `true` on the Error prototype our test environment.
        // That lets us avoid asserting on warnings for each expected error.
        // Here we intentionally shadow it to test logging, like in real apps.
        error.suppressReactErrorLogging = undefined;
        throw error;
      }
      render() {
        return <div />;
      }
    }

    ReactNoop.render(
      <div>
        <span>
          <ErrorThrowingComponent />
        </span>
      </div>,
    );

    expect(() => {
      expect(ReactNoop.flushDeferredPri).toWarnDev(
        'The above error occurred in the <ErrorThrowingComponent> component:\n' +
          '    in ErrorThrowingComponent (at **)\n' +
          '    in span (at **)\n' +
          '    in div (at **)\n\n' +
          'Consider adding an error boundary to your tree to customize error handling behavior.',
      );
    }).toThrowError('componentWillMount error');
  });

  it('should log errors that occur during the commit phase', () => {
    // Errors are redundantly logged in production mode by ReactFiberErrorLogger.
    // It's okay to ignore them for the purpose of this test.
    spyOnProd(console, 'error');

    class ErrorThrowingComponent extends React.Component {
      componentDidMount() {
        const error = new Error('componentDidMount error');
        // Note: it's `true` on the Error prototype our test environment.
        // That lets us avoid asserting on warnings for each expected error.
        // Here we intentionally shadow it to test logging, like in real apps.
        error.suppressReactErrorLogging = undefined;
        throw error;
      }
      render() {
        return <div />;
      }
    }

    ReactNoop.render(
      <div>
        <span>
          <ErrorThrowingComponent />
        </span>
      </div>,
    );

    expect(() => {
      expect(ReactNoop.flushDeferredPri).toWarnDev(
        'The above error occurred in the <ErrorThrowingComponent> component:\n' +
          '    in ErrorThrowingComponent (at **)\n' +
          '    in span (at **)\n' +
          '    in div (at **)\n\n' +
          'Consider adding an error boundary to your tree to customize error handling behavior.',
      );
    }).toThrowError('componentDidMount error');
  });

  it('should ignore errors thrown in log method to prevent cycle', () => {
    jest.resetModules();
    jest.mock('../ReactFiberErrorLogger');
    try {
      React = require('react');
      ReactNoop = require('react-noop-renderer');

      // TODO Update this test to use toWarnDev() matcher if possible
      spyOnDevAndProd(console, 'error');

      class ErrorThrowingComponent extends React.Component {
        render() {
          throw new Error('render error');
        }
      }

      const logCapturedErrorCalls = [];

      const ReactFiberErrorLogger = require('../ReactFiberErrorLogger');
      ReactFiberErrorLogger.logCapturedError.mockImplementation(
        capturedError => {
          logCapturedErrorCalls.push(capturedError);
          const error = new Error('logCapturedError error');
          // Note: it's `true` on the Error prototype our test environment.
          // That lets us avoid asserting on warnings for each expected error.
          // Here we intentionally shadow it to test logging, like in real apps.
          error.suppressReactErrorLogging = undefined;
          throw error;
        },
      );

      try {
        ReactNoop.render(
          <div>
            <span>
              <ErrorThrowingComponent />
            </span>
          </div>,
        );
        ReactNoop.flushDeferredPri();
      } catch (error) {}

      expect(logCapturedErrorCalls.length).toBe(1);

      // The error thrown in logCapturedError should also be logged
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error.calls.argsFor(0)[0].message).toContain(
        'logCapturedError error',
      );
    } finally {
      jest.unmock('../ReactFiberErrorLogger');
    }
  });

  it('resets instance variables before unmounting failed node', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        this.setState({error});
      }
      render() {
        return this.state.error ? null : this.props.children;
      }
    }
    class Foo extends React.Component {
      state = {step: 0};
      componentDidMount() {
        this.setState({step: 1});
      }
      componentWillUnmount() {
        ReactNoop.yield('componentWillUnmount: ' + this.state.step);
      }
      render() {
        ReactNoop.yield('render: ' + this.state.step);
        if (this.state.step > 0) {
          throw new Error('oops');
        }
        return null;
      }
    }

    ReactNoop.render(
      <ErrorBoundary>
        <Foo />
      </ErrorBoundary>,
    );
    expect(ReactNoop.flush()).toEqual([
      'render: 0',
      'render: 1',
      'componentWillUnmount: 0',
    ]);
  });
});
