/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
let Scheduler;
let waitForAll;
let waitForThrow;

describe('ReactIncrementalErrorLogging', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');

    const InternalTestUtils = require('internal-test-utils');
    waitForAll = InternalTestUtils.waitForAll;
    waitForThrow = InternalTestUtils.waitForThrow;
  });

  // Note: in this test file we won't be using toErrorDev() matchers
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

  it('should log errors that occur during the begin phase', async () => {
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
    await waitForThrow('constructor error');
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      __DEV__
        ? expect.stringMatching(
            new RegExp(
              'The above error occurred in the <ErrorThrowingComponent> component:\n' +
                '\\s+(in|at) ErrorThrowingComponent (.*)\n' +
                '\\s+(in|at) span(.*)\n' +
                '\\s+(in|at) div(.*)\n\n' +
                'Consider adding an error boundary to your tree ' +
                'to customize error handling behavior\\.',
            ),
          )
        : expect.objectContaining({
            message: 'constructor error',
          }),
    );
  });

  it('should log errors that occur during the commit phase', async () => {
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
    await waitForThrow('componentDidMount error');
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      __DEV__
        ? expect.stringMatching(
            new RegExp(
              'The above error occurred in the <ErrorThrowingComponent> component:\n' +
                '\\s+(in|at) ErrorThrowingComponent (.*)\n' +
                '\\s+(in|at) span(.*)\n' +
                '\\s+(in|at) div(.*)\n\n' +
                'Consider adding an error boundary to your tree ' +
                'to customize error handling behavior\\.',
            ),
          )
        : expect.objectContaining({
            message: 'componentDidMount error',
          }),
    );
  });

  it('should ignore errors thrown in log method to prevent cycle', async () => {
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
    await waitForThrow('render error');
    expect(logCapturedErrorCalls.length).toBe(1);
    expect(logCapturedErrorCalls[0]).toEqual(
      __DEV__
        ? expect.stringMatching(
            new RegExp(
              'The above error occurred in the <ErrorThrowingComponent> component:\n' +
                '\\s+(in|at) ErrorThrowingComponent (.*)\n' +
                '\\s+(in|at) span(.*)\n' +
                '\\s+(in|at) div(.*)\n\n' +
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

  it('resets instance variables before unmounting failed node', async () => {
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
        Scheduler.log('componentWillUnmount: ' + this.state.step);
      }
      render() {
        Scheduler.log('render: ' + this.state.step);
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
    await waitForAll(
      [
        'render: 0',

        'render: 1',
        __DEV__ && 'render: 1', // replay due to invokeGuardedCallback

        // Retry one more time before handling error
        'render: 1',
        __DEV__ && 'render: 1', // replay due to invokeGuardedCallback

        'componentWillUnmount: 0',
      ].filter(Boolean),
    );

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      __DEV__
        ? expect.stringMatching(
            new RegExp(
              'The above error occurred in the <Foo> component:\n' +
                '\\s+(in|at) Foo (.*)\n' +
                '\\s+(in|at) ErrorBoundary (.*)\n\n' +
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
