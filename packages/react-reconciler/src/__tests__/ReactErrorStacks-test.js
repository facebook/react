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
let waitForAll;

describe('ReactFragment', () => {
  beforeEach(function () {
    jest.resetModules();

    React = require('react');
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
});
