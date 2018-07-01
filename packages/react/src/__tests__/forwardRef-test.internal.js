/**
 * Copyright (c) 2013-present, Facebook, Inc.
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

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  it('should work without a ref to be forwarded', () => {
    class Child extends React.Component {
      render() {
        ReactNoop.yield(this.props.value);
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
    expect(ReactNoop.flush()).toEqual([123]);
  });

  it('should forward a ref for a single child', () => {
    class Child extends React.Component {
      render() {
        ReactNoop.yield(this.props.value);
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
    expect(ReactNoop.flush()).toEqual([123]);
    expect(ref.current instanceof Child).toBe(true);
  });

  it('should forward a ref for multiple children', () => {
    class Child extends React.Component {
      render() {
        ReactNoop.yield(this.props.value);
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
    expect(ReactNoop.flush()).toEqual([123]);
    expect(ref.current instanceof Child).toBe(true);
  });

  it('should maintain child instance and ref through updates', () => {
    class Child extends React.Component {
      constructor(props) {
        super(props);
      }
      render() {
        ReactNoop.yield(this.props.value);
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
    expect(ReactNoop.flush()).toEqual([123]);
    expect(ref instanceof Child).toBe(true);
    expect(setRefCount).toBe(1);
    ReactNoop.render(<RefForwardingComponent ref={setRef} value={456} />);
    expect(ReactNoop.flush()).toEqual([456]);
    expect(ref instanceof Child).toBe(true);
    expect(setRefCount).toBe(1);
  });

  it('should not break lifecycle error handling', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        ReactNoop.yield('ErrorBoundary.componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          ReactNoop.yield('ErrorBoundary.render: catch');
          return null;
        }
        ReactNoop.yield('ErrorBoundary.render: try');
        return this.props.children;
      }
    }

    class BadRender extends React.Component {
      render() {
        ReactNoop.yield('BadRender throw');
        throw new Error('oops!');
      }
    }

    function Wrapper(props) {
      ReactNoop.yield('Wrapper');
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
    expect(ReactNoop.flush()).toEqual([
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
        ReactNoop.yield('Inner');
        inst = this;
        return <div ref={this.props.forwardedRef} />;
      }
    }

    function Middle(props) {
      ReactNoop.yield('Middle');
      return <Inner {...props} />;
    }

    const Forward = React.forwardRef((props, ref) => {
      ReactNoop.yield('Forward');
      return <Middle {...props} forwardedRef={ref} />;
    });

    function App() {
      ReactNoop.yield('App');
      return <Forward />;
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual(['App', 'Forward', 'Middle', 'Inner']);

    inst.setState({});
    expect(ReactNoop.flush()).toEqual(['Inner']);
  });
});
