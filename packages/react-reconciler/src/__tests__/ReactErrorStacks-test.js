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
let Suspense;
let Activity;
let ViewTransition;
let ReactNoop;
let waitForAll;

describe('ReactFragment', () => {
  beforeEach(function () {
    jest.resetModules();

    React = require('react');
    Suspense = React.Suspense;
    Activity = React.unstable_Activity;
    ViewTransition = React.unstable_ViewTransition;
    ReactNoop = require('react-noop-renderer');
    const InternalTestUtils = require('internal-test-utils');
    waitForAll = InternalTestUtils.waitForAll;
  });

  function componentStack(components) {
    return components
      .map(component => `\n    in ${component} (at **)`)
      .join('');
  }

  function normalizeCodeLocInfo(str) {
    return (
      str &&
      str.replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function (m, name) {
        return '\n    in ' + name + ' (at **)';
      })
    );
  }

  it('retains component stacks when rethrowing an error', async () => {
    function Foo() {
      return (
        <RethrowingBoundary>
          <Bar />
        </RethrowingBoundary>
      );
    }
    function Bar() {
      return <SomethingThatErrors />;
    }
    function SomethingThatErrors() {
      throw new Error('uh oh');
    }

    class RethrowingBoundary extends React.Component {
      static getDerivedStateFromError(error) {
        throw error;
      }

      render() {
        return this.props.children;
      }
    }

    const errors = [];
    class CatchingBoundary extends React.Component {
      constructor() {
        super();
        this.state = {};
      }
      static getDerivedStateFromError(error) {
        return {errored: true};
      }
      componentDidCatch(err, errInfo) {
        errors.push(err.message, normalizeCodeLocInfo(errInfo.componentStack));
      }
      render() {
        if (this.state.errored) {
          return null;
        }
        return this.props.children;
      }
    }

    ReactNoop.render(
      <CatchingBoundary>
        <Foo />
      </CatchingBoundary>,
    );
    await waitForAll([]);
    expect(errors).toEqual([
      'uh oh',
      componentStack([
        'SomethingThatErrors',
        'Bar',
        'RethrowingBoundary',
        'Foo',
        'CatchingBoundary',
      ]),
    ]);
  });

  it('retains owner stacks when rethrowing an error', async () => {
    function Foo() {
      return (
        <RethrowingBoundary>
          <Bar />
        </RethrowingBoundary>
      );
    }
    function Bar() {
      return <SomethingThatErrors />;
    }
    function SomethingThatErrors() {
      throw new Error('uh oh');
    }

    class RethrowingBoundary extends React.Component {
      static getDerivedStateFromError(error) {
        throw error;
      }

      render() {
        return this.props.children;
      }
    }

    const errors = [];
    class CatchingBoundary extends React.Component {
      constructor() {
        super();
        this.state = {};
      }
      static getDerivedStateFromError(error) {
        return {errored: true};
      }
      render() {
        if (this.state.errored) {
          return null;
        }
        return this.props.children;
      }
    }

    ReactNoop.createRoot({
      onCaughtError(error, errorInfo) {
        errors.push(
          error.message,
          normalizeCodeLocInfo(errorInfo.componentStack),
          React.captureOwnerStack
            ? normalizeCodeLocInfo(React.captureOwnerStack())
            : null,
        );
      },
    }).render(
      <CatchingBoundary>
        <Foo />
      </CatchingBoundary>,
    );
    await waitForAll([]);
    expect(errors).toEqual([
      'uh oh',
      componentStack([
        'SomethingThatErrors',
        'Bar',
        'RethrowingBoundary',
        'Foo',
        'CatchingBoundary',
      ]),
      __DEV__ ? componentStack(['Bar', 'Foo']) : null,
    ]);
  });

  it('includes built-in for Suspense', async () => {
    function SomethingThatErrors() {
      throw new Error('uh oh');
    }

    class RethrowingBoundary extends React.Component {
      static getDerivedStateFromError(error) {
        throw error;
      }

      render() {
        return this.props.children;
      }
    }

    const errors = [];
    class CatchingBoundary extends React.Component {
      constructor() {
        super();
        this.state = {};
      }
      static getDerivedStateFromError(error) {
        return {errored: true};
      }
      componentDidCatch(err, errInfo) {
        errors.push(err.message, normalizeCodeLocInfo(errInfo.componentStack));
      }
      render() {
        if (this.state.errored) {
          return null;
        }
        return this.props.children;
      }
    }

    ReactNoop.render(
      <CatchingBoundary>
        <RethrowingBoundary>
          <Suspense>
            <SomethingThatErrors />
          </Suspense>
        </RethrowingBoundary>
      </CatchingBoundary>,
    );
    await waitForAll([]);
    expect(errors).toEqual([
      'uh oh',
      componentStack([
        'SomethingThatErrors',
        'Suspense',
        'RethrowingBoundary',
        'CatchingBoundary',
      ]),
    ]);
  });

  it('includes built-in for Activity', async () => {
    function SomethingThatErrors() {
      throw new Error('uh oh');
    }

    class RethrowingBoundary extends React.Component {
      static getDerivedStateFromError(error) {
        throw error;
      }

      render() {
        return this.props.children;
      }
    }

    const errors = [];
    class CatchingBoundary extends React.Component {
      constructor() {
        super();
        this.state = {};
      }
      static getDerivedStateFromError(error) {
        return {errored: true};
      }
      componentDidCatch(err, errInfo) {
        errors.push(err.message, normalizeCodeLocInfo(errInfo.componentStack));
      }
      render() {
        if (this.state.errored) {
          return null;
        }
        return this.props.children;
      }
    }

    ReactNoop.render(
      <CatchingBoundary>
        <RethrowingBoundary>
          <Activity>
            <SomethingThatErrors />
          </Activity>
        </RethrowingBoundary>
      </CatchingBoundary>,
    );
    await waitForAll([]);
    expect(errors).toEqual([
      'uh oh',
      componentStack([
        'SomethingThatErrors',
        'Activity',
        'RethrowingBoundary',
        'CatchingBoundary',
      ]),
    ]);
  });

  it('includes built-in for ViewTransition', async () => {
    function SomethingThatErrors() {
      throw new Error('uh oh');
    }

    class RethrowingBoundary extends React.Component {
      static getDerivedStateFromError(error) {
        throw error;
      }

      render() {
        return this.props.children;
      }
    }

    const errors = [];
    class CatchingBoundary extends React.Component {
      constructor() {
        super();
        this.state = {};
      }
      static getDerivedStateFromError(error) {
        return {errored: true};
      }
      componentDidCatch(err, errInfo) {
        errors.push(err.message, normalizeCodeLocInfo(errInfo.componentStack));
      }
      render() {
        if (this.state.errored) {
          return null;
        }
        return this.props.children;
      }
    }

    ReactNoop.render(
      <CatchingBoundary>
        <RethrowingBoundary>
          <ViewTransition>
            <SomethingThatErrors />
          </ViewTransition>
        </RethrowingBoundary>
      </CatchingBoundary>,
    );
    await waitForAll([]);
    expect(errors).toEqual([
      'uh oh',
      componentStack([
        'SomethingThatErrors',
        'ViewTransition',
        'RethrowingBoundary',
        'CatchingBoundary',
      ]),
    ]);
  });
});
