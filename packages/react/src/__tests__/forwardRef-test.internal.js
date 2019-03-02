/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('forwardRef', () => {
  let React;
  let ReactFeatureFlags;
  let ReactNoop;
  let Scheduler;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
  });

  it('should work without a ref to be forwarded', () => {
    class Child extends React.Component {
      render() {
        Scheduler.yieldValue(this.props.value);
        return null;
      }
    }

    function Wrapper(props) {
      return <Child {...props} ref={props.forwardedRef} />;
    }

    const RefForwardingComponent = React.forwardRef((props, ref) => (
      <Wrapper {...props} forwardedRef={ref} />
    ));

    ReactNoop.render(<RefForwardingComponent value={123} />);
    expect(Scheduler).toFlushAndYield([123]);
  });

  it('should forward a ref for a single child', () => {
    class Child extends React.Component {
      render() {
        Scheduler.yieldValue(this.props.value);
        return null;
      }
    }

    function Wrapper(props) {
      return <Child {...props} ref={props.forwardedRef} />;
    }

    const RefForwardingComponent = React.forwardRef((props, ref) => (
      <Wrapper {...props} forwardedRef={ref} />
    ));

    const ref = React.createRef();

    ReactNoop.render(<RefForwardingComponent ref={ref} value={123} />);
    expect(Scheduler).toFlushAndYield([123]);
    expect(ref.current instanceof Child).toBe(true);
  });

  it('should forward a ref for multiple children', () => {
    class Child extends React.Component {
      render() {
        Scheduler.yieldValue(this.props.value);
        return null;
      }
    }

    function Wrapper(props) {
      return <Child {...props} ref={props.forwardedRef} />;
    }

    const RefForwardingComponent = React.forwardRef((props, ref) => (
      <Wrapper {...props} forwardedRef={ref} />
    ));

    const ref = React.createRef();

    ReactNoop.render(
      <div>
        <div />
        <RefForwardingComponent ref={ref} value={123} />
        <div />
      </div>,
    );
    expect(Scheduler).toFlushAndYield([123]);
    expect(ref.current instanceof Child).toBe(true);
  });

  it('should maintain child instance and ref through updates', () => {
    class Child extends React.Component {
      constructor(props) {
        super(props);
      }
      render() {
        Scheduler.yieldValue(this.props.value);
        return null;
      }
    }

    function Wrapper(props) {
      return <Child {...props} ref={props.forwardedRef} />;
    }

    const RefForwardingComponent = React.forwardRef((props, ref) => (
      <Wrapper {...props} forwardedRef={ref} />
    ));

    let setRefCount = 0;
    let ref;

    const setRef = r => {
      setRefCount++;
      ref = r;
    };

    ReactNoop.render(<RefForwardingComponent ref={setRef} value={123} />);
    expect(Scheduler).toFlushAndYield([123]);
    expect(ref instanceof Child).toBe(true);
    expect(setRefCount).toBe(1);
    ReactNoop.render(<RefForwardingComponent ref={setRef} value={456} />);
    expect(Scheduler).toFlushAndYield([456]);
    expect(ref instanceof Child).toBe(true);
    expect(setRefCount).toBe(1);
  });

  it('should not break lifecycle error handling', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        Scheduler.yieldValue('ErrorBoundary.componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          Scheduler.yieldValue('ErrorBoundary.render: catch');
          return null;
        }
        Scheduler.yieldValue('ErrorBoundary.render: try');
        return this.props.children;
      }
    }

    class BadRender extends React.Component {
      render() {
        Scheduler.yieldValue('BadRender throw');
        throw new Error('oops!');
      }
    }

    function Wrapper(props) {
      Scheduler.yieldValue('Wrapper');
      return <BadRender {...props} ref={props.forwardedRef} />;
    }

    const RefForwardingComponent = React.forwardRef((props, ref) => (
      <Wrapper {...props} forwardedRef={ref} />
    ));

    const ref = React.createRef();

    ReactNoop.render(
      <ErrorBoundary>
        <RefForwardingComponent ref={ref} />
      </ErrorBoundary>,
    );
    expect(Scheduler).toFlushAndYield([
      'ErrorBoundary.render: try',
      'Wrapper',
      'BadRender throw',

      // React retries one more time
      'ErrorBoundary.render: try',
      'Wrapper',
      'BadRender throw',

      // Errored again on retry. Now handle it.
      'ErrorBoundary.componentDidCatch',
      'ErrorBoundary.render: catch',
    ]);
    expect(ref.current).toBe(null);
  });

  it('should not re-run the render callback on a deep setState', () => {
    let inst;

    class Inner extends React.Component {
      render() {
        Scheduler.yieldValue('Inner');
        inst = this;
        return <div ref={this.props.forwardedRef} />;
      }
    }

    function Middle(props) {
      Scheduler.yieldValue('Middle');
      return <Inner {...props} />;
    }

    const Forward = React.forwardRef((props, ref) => {
      Scheduler.yieldValue('Forward');
      return <Middle {...props} forwardedRef={ref} />;
    });

    function App() {
      Scheduler.yieldValue('App');
      return <Forward />;
    }

    ReactNoop.render(<App />);
    expect(Scheduler).toFlushAndYield(['App', 'Forward', 'Middle', 'Inner']);

    inst.setState({});
    expect(Scheduler).toFlushAndYield(['Inner']);
  });
});
