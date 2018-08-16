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
let ReactNoop;

describe('ReactIncrementalErrorLogging', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  // Note: in this test file we won't be using toWarnDev() matchers
  // because they filter out precisely the messages we want to test for.
  let oldConsoleError;
  beforeEach(() => {
    oldConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = oldConsoleError;
    oldConsoleError = null;
  });

  it('should log errors that occur during the begin phase', () => {
    class ErrorThrowingComponent extends React.Component {
      constructor(props) {
        super(props);
        throw new Error('constructor error');
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
    expect(ReactNoop.flushDeferredPri).toThrowError('constructor error');
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      __DEV__
        ? expect.stringMatching(
            new RegExp(
              'The above error occurred in the <ErrorThrowingComponent> component:\n' +
                '\\s+in ErrorThrowingComponent (.*)\n' +
                '\\s+in span (.*)\n' +
                '\\s+in div (.*)\n\n' +
                'Consider adding an error boundary to your tree ' +
                'to customize error handling behavior\\.',
            ),
          )
        : expect.objectContaining({
            message: 'constructor error',
          }),
    );
  });

  it('should log errors that occur during the commit phase', () => {
    class ErrorThrowingComponent extends React.Component {
      componentDidMount() {
        throw new Error('componentDidMount error');
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
    expect(ReactNoop.flushDeferredPri).toThrowError('componentDidMount error');
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      __DEV__
        ? expect.stringMatching(
            new RegExp(
              'The above error occurred in the <ErrorThrowingComponent> component:\n' +
                '\\s+in ErrorThrowingComponent (.*)\n' +
                '\\s+in span (.*)\n' +
                '\\s+in div (.*)\n\n' +
                'Consider adding an error boundary to your tree ' +
                'to customize error handling behavior\\.',
            ),
          )
        : expect.objectContaining({
            message: 'componentDidMount error',
          }),
    );
  });

  it('should ignore errors thrown in log method to prevent cycle', () => {
    const logCapturedErrorCalls = [];
    console.error.mockImplementation(error => {
      // Test what happens when logging itself is buggy.
      logCapturedErrorCalls.push(error);
      throw new Error('logCapturedError error');
    });
    class ErrorThrowingComponent extends React.Component {
      render() {
        throw new Error('render error');
      }
    }
    ReactNoop.render(
      <div>
        <span>
          <ErrorThrowingComponent />
        </span>
      </div>,
    );
    expect(ReactNoop.flushDeferredPri).toThrow('render error');
    expect(logCapturedErrorCalls.length).toBe(1);
    expect(logCapturedErrorCalls[0]).toEqual(
      __DEV__
        ? expect.stringMatching(
            new RegExp(
              'The above error occurred in the <ErrorThrowingComponent> component:\n' +
                '\\s+in ErrorThrowingComponent (.*)\n' +
                '\\s+in span (.*)\n' +
                '\\s+in div (.*)\n\n' +
                'Consider adding an error boundary to your tree ' +
                'to customize error handling behavior\\.',
            ),
          )
        : expect.objectContaining({
            message: 'render error',
          }),
    );
    // The error thrown in logCapturedError should be rethrown with a clean stack
    expect(() => {
      jest.runAllTimers();
    }).toThrow('logCapturedError error');
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
    expect(ReactNoop.flush()).toEqual(
      [
        'render: 0',
        __DEV__ && 'render: 0', // replay
        'render: 1',
        __DEV__ && 'render: 1', // replay
        'componentWillUnmount: 0',
      ].filter(Boolean),
    );

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      __DEV__
        ? expect.stringMatching(
            new RegExp(
              'The above error occurred in the <Foo> component:\n' +
                '\\s+in Foo (.*)\n' +
                '\\s+in ErrorBoundary (.*)\n\n' +
                'React will try to recreate this component tree from scratch ' +
                'using the error boundary you provided, ErrorBoundary.',
            ),
          )
        : expect.objectContaining({
            message: 'oops',
          }),
    );
  });
});
