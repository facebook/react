/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let PropTypes;
let ReactFeatureFlags;
let React;
let ReactNoop;
let Scheduler;

describe('ReactIncrementalErrorHandling', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    PropTypes = require('prop-types');
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
  });

  function div(...children) {
    children = children.map(c => (typeof c === 'string' ? {text: c} : c));
    return {type: 'div', children, prop: undefined, hidden: false};
  }

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  it('recovers from errors asynchronously', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        Scheduler.yieldValue('getDerivedStateFromError');
        return {error};
      }
      render() {
        if (this.state.error) {
          Scheduler.yieldValue('ErrorBoundary (catch)');
          return <ErrorMessage error={this.state.error} />;
        }
        Scheduler.yieldValue('ErrorBoundary (try)');
        return this.props.children;
      }
    }

    function ErrorMessage(props) {
      Scheduler.yieldValue('ErrorMessage');
      return <span prop={`Caught an error: ${props.error.message}`} />;
    }

    function Indirection(props) {
      Scheduler.yieldValue('Indirection');
      return props.children || null;
    }

    function BadRender() {
      Scheduler.yieldValue('throw');
      throw new Error('oops!');
    }

    ReactNoop.render(
      <ErrorBoundary>
        <Indirection>
          <Indirection>
            <Indirection>
              <BadRender />
              <Indirection />
              <Indirection />
            </Indirection>
          </Indirection>
        </Indirection>
      </ErrorBoundary>,
    );

    // Start rendering asynchronously
    expect(Scheduler).toFlushAndYieldThrough([
      'ErrorBoundary (try)',
      'Indirection',
      'Indirection',
      'Indirection',
      // An error is thrown. React keeps rendering asynchronously.
      'throw',
    ]);

    // Still rendering async...
    expect(Scheduler).toFlushAndYieldThrough(['Indirection']);

    expect(Scheduler).toFlushAndYieldThrough([
      'Indirection',

      // Call getDerivedStateFromError and re-render the error boundary, this
      // time rendering an error message.
      'getDerivedStateFromError',
      'ErrorBoundary (catch)',
      'ErrorMessage',
    ]);

    // Since the error was thrown during an async render, React won't commit
    // the result yet.
    expect(ReactNoop.getChildren()).toEqual([]);

    // Instead, it will try rendering one more time, synchronously, in case that
    // happens to fix the error.
    expect(ReactNoop.flushNextYield()).toEqual([
      'ErrorBoundary (try)',
      'Indirection',
      'Indirection',
      'Indirection',

      // The error was thrown again. This time, React will actually commit
      // the result.
      'throw',
      'Indirection',
      'Indirection',
      'getDerivedStateFromError',
      'ErrorBoundary (catch)',
      'ErrorMessage',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: oops!')]);
  });

  it('recovers from errors asynchronously (legacy, no getDerivedStateFromError)', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        Scheduler.yieldValue('componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          Scheduler.yieldValue('ErrorBoundary (catch)');
          return <ErrorMessage error={this.state.error} />;
        }
        Scheduler.yieldValue('ErrorBoundary (try)');
        return this.props.children;
      }
    }

    function ErrorMessage(props) {
      Scheduler.yieldValue('ErrorMessage');
      return <span prop={`Caught an error: ${props.error.message}`} />;
    }

    function Indirection(props) {
      Scheduler.yieldValue('Indirection');
      return props.children || null;
    }

    function BadRender() {
      Scheduler.yieldValue('throw');
      throw new Error('oops!');
    }

    ReactNoop.render(
      <ErrorBoundary>
        <Indirection>
          <Indirection>
            <Indirection>
              <BadRender />
              <Indirection />
              <Indirection />
            </Indirection>
          </Indirection>
        </Indirection>
      </ErrorBoundary>,
    );

    // Start rendering asynchronously
    expect(Scheduler).toFlushAndYieldThrough([
      'ErrorBoundary (try)',
      'Indirection',
      'Indirection',
      'Indirection',
      // An error is thrown. React keeps rendering asynchronously.
      'throw',
    ]);

    // Still rendering async...
    expect(Scheduler).toFlushAndYieldThrough(['Indirection']);

    expect(Scheduler).toFlushAndYieldThrough([
      'Indirection',
      // Now that the tree is complete, and there's no remaining work, React
      // reverts to sync mode to retry one more time before handling the error.

      'ErrorBoundary (try)',
      'Indirection',
      'Indirection',
      'Indirection',

      // The error was thrown again. Now we can handle it.
      'throw',
      'Indirection',
      'Indirection',
      'componentDidCatch',
      'ErrorBoundary (catch)',
      'ErrorMessage',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: oops!')]);
  });

  it("retries at a lower priority if there's additional pending work", () => {
    function App(props) {
      if (props.isBroken) {
        Scheduler.yieldValue('error');
        throw new Error('Oops!');
      }
      Scheduler.yieldValue('success');
      return <span prop="Everything is fine." />;
    }

    function onCommit() {
      Scheduler.yieldValue('commit');
    }

    function interrupt() {
      ReactNoop.flushSync(() => {
        ReactNoop.renderToRootWithID(null, 'other-root');
      });
    }

    ReactNoop.render(<App isBroken={true} />, onCommit);
    Scheduler.advanceTime(1000);
    expect(Scheduler).toFlushAndYieldThrough(['error']);
    interrupt();

    // This update is in a separate batch
    ReactNoop.render(<App isBroken={false} />, onCommit);

    expect(Scheduler).toFlushAndYield([
      // The first render fails. But because there's a lower priority pending
      // update, it doesn't throw.
      'error',
      // Now we retry at the lower priority. This time it succeeds.
      'success',
      // Nothing commits until the second update completes.
      'commit',
      'commit',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Everything is fine.')]);
  });

  it('on error, retries at a lower priority using the expiration of higher priority', () => {
    class Parent extends React.Component {
      state = {hideChild: false};
      componentDidUpdate() {
        Scheduler.yieldValue('commit: ' + this.state.hideChild);
      }
      render() {
        if (this.state.hideChild) {
          Scheduler.yieldValue('(empty)');
          return <span prop="(empty)" />;
        }
        return <Child isBroken={this.props.childIsBroken} />;
      }
    }

    function Child(props) {
      if (props.isBroken) {
        Scheduler.yieldValue('Error!');
        throw new Error('Error!');
      }
      Scheduler.yieldValue('Child');
      return <span prop="Child" />;
    }

    // Initial mount
    const parent = React.createRef(null);
    ReactNoop.render(<Parent ref={parent} childIsBroken={false} />);
    expect(Scheduler).toFlushAndYield(['Child']);
    expect(ReactNoop.getChildren()).toEqual([span('Child')]);

    // Schedule a low priority update to hide the child
    parent.current.setState({hideChild: true});

    // Before the low priority update is flushed, synchronously trigger an
    // error in the child.
    ReactNoop.flushSync(() => {
      ReactNoop.render(<Parent ref={parent} childIsBroken={true} />);
    });
    expect(Scheduler).toHaveYielded([
      // First the sync update triggers an error
      'Error!',
      // Because there's a pending low priority update, we restart at the
      // lower priority. This hides the children, suppressing the error.
      '(empty)',
      // Now the tree can commit.
      'commit: true',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('(empty)')]);
  });

  it('retries one more time before handling error', () => {
    let ops = [];
    function BadRender() {
      ops.push('BadRender');
      Scheduler.yieldValue('BadRender');
      throw new Error('oops');
    }

    function Sibling() {
      ops.push('Sibling');
      Scheduler.yieldValue('Sibling');
      return <span prop="Sibling" />;
    }

    function Parent() {
      ops.push('Parent');
      Scheduler.yieldValue('Parent');
      return (
        <React.Fragment>
          <BadRender />
          <Sibling />
        </React.Fragment>
      );
    }

    ReactNoop.render(<Parent />, () => Scheduler.yieldValue('commit'));

    // Render the bad component asynchronously
    expect(Scheduler).toFlushAndYieldThrough(['Parent', 'BadRender']);

    // Finish the rest of the async work
    expect(Scheduler).toFlushAndYieldThrough(['Sibling']);

    // React retries once, synchronously, before throwing.
    ops = [];
    expect(() => ReactNoop.flushNextYield()).toThrow('oops');
    expect(ops).toEqual(['Parent', 'BadRender', 'Sibling']);
  });

  // TODO: This is currently unobservable, but will be once we lift renderRoot
  // and commitRoot into the renderer.
  // it("does not retry synchronously if there's an update between complete and commit");

  it('calls componentDidCatch multiple times for multiple errors', () => {
    let id = 0;
    class BadMount extends React.Component {
      componentDidMount() {
        throw new Error(`Error ${++id}`);
      }
      render() {
        Scheduler.yieldValue('BadMount');
        return null;
      }
    }

    class ErrorBoundary extends React.Component {
      state = {errorCount: 0};
      componentDidCatch(error) {
        Scheduler.yieldValue(`componentDidCatch: ${error.message}`);
        this.setState(state => ({errorCount: state.errorCount + 1}));
      }
      render() {
        if (this.state.errorCount > 0) {
          return <span prop={`Number of errors: ${this.state.errorCount}`} />;
        }
        Scheduler.yieldValue('ErrorBoundary');
        return this.props.children;
      }
    }

    ReactNoop.render(
      <ErrorBoundary>
        <BadMount />
        <BadMount />
        <BadMount />
      </ErrorBoundary>,
    );

    expect(Scheduler).toFlushAndYield([
      'ErrorBoundary',
      'BadMount',
      'BadMount',
      'BadMount',
      'componentDidCatch: Error 1',
      'componentDidCatch: Error 2',
      'componentDidCatch: Error 3',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Number of errors: 3')]);
  });

  it('catches render error in a boundary during full deferred mounting', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          return (
            <span prop={`Caught an error: ${this.state.error.message}.`} />
          );
        }
        return this.props.children;
      }
    }

    function BrokenRender(props) {
      throw new Error('Hello');
    }

    ReactNoop.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
    );
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: Hello.')]);
  });

  it('catches render error in a boundary during partial deferred mounting', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        Scheduler.yieldValue('ErrorBoundary componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          Scheduler.yieldValue('ErrorBoundary render error');
          return (
            <span prop={`Caught an error: ${this.state.error.message}.`} />
          );
        }
        Scheduler.yieldValue('ErrorBoundary render success');
        return this.props.children;
      }
    }

    function BrokenRender(props) {
      Scheduler.yieldValue('BrokenRender');
      throw new Error('Hello');
    }

    ReactNoop.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
    );

    expect(Scheduler).toFlushAndYieldThrough(['ErrorBoundary render success']);
    expect(ReactNoop.getChildren()).toEqual([]);

    expect(Scheduler).toFlushAndYield([
      'BrokenRender',
      // React retries one more time
      'ErrorBoundary render success',

      // Errored again on retry. Now handle it.
      'BrokenRender',
      'ErrorBoundary componentDidCatch',
      'ErrorBoundary render error',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: Hello.')]);
  });

  it('catches render error in a boundary during synchronous mounting', () => {
    const ops = [];
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        ops.push('ErrorBoundary componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          ops.push('ErrorBoundary render error');
          return (
            <span prop={`Caught an error: ${this.state.error.message}.`} />
          );
        }
        ops.push('ErrorBoundary render success');
        return this.props.children;
      }
    }

    function BrokenRender(props) {
      ops.push('BrokenRender');
      throw new Error('Hello');
    }

    ReactNoop.flushSync(() => {
      ReactNoop.render(
        <ErrorBoundary>
          <BrokenRender />
        </ErrorBoundary>,
      );
    });

    expect(ops).toEqual([
      'ErrorBoundary render success',
      'BrokenRender',
      // React doesn't retry because we're already rendering synchronously.
      'ErrorBoundary componentDidCatch',
      'ErrorBoundary render error',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: Hello.')]);
  });

  it('catches render error in a boundary during batched mounting', () => {
    const ops = [];
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        ops.push('ErrorBoundary componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          ops.push('ErrorBoundary render error');
          return (
            <span prop={`Caught an error: ${this.state.error.message}.`} />
          );
        }
        ops.push('ErrorBoundary render success');
        return this.props.children;
      }
    }

    function BrokenRender(props) {
      ops.push('BrokenRender');
      throw new Error('Hello');
    }

    ReactNoop.flushSync(() => {
      ReactNoop.render(<ErrorBoundary>Before the storm.</ErrorBoundary>);
      ReactNoop.render(
        <ErrorBoundary>
          <BrokenRender />
        </ErrorBoundary>,
      );
    });

    expect(ops).toEqual([
      'ErrorBoundary render success',
      'BrokenRender',
      // React doesn't retry because we're already rendering synchronously.
      'ErrorBoundary componentDidCatch',
      'ErrorBoundary render error',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: Hello.')]);
  });

  it('propagates an error from a noop error boundary during full deferred mounting', () => {
    const ops = [];
    class RethrowErrorBoundary extends React.Component {
      componentDidCatch(error) {
        ops.push('RethrowErrorBoundary componentDidCatch');
        throw error;
      }
      render() {
        ops.push('RethrowErrorBoundary render');
        return this.props.children;
      }
    }

    function BrokenRender() {
      ops.push('BrokenRender');
      throw new Error('Hello');
    }

    ReactNoop.render(
      <RethrowErrorBoundary>
        <BrokenRender />
      </RethrowErrorBoundary>,
    );

    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');
    expect(ops).toEqual([
      'RethrowErrorBoundary render',
      'BrokenRender',

      // React retries one more time
      'RethrowErrorBoundary render',
      'BrokenRender',

      // Errored again on retry. Now handle it.
      'RethrowErrorBoundary componentDidCatch',
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('propagates an error from a noop error boundary during partial deferred mounting', () => {
    class RethrowErrorBoundary extends React.Component {
      componentDidCatch(error) {
        Scheduler.yieldValue('RethrowErrorBoundary componentDidCatch');
        throw error;
      }
      render() {
        Scheduler.yieldValue('RethrowErrorBoundary render');
        return this.props.children;
      }
    }

    function BrokenRender() {
      Scheduler.yieldValue('BrokenRender');
      throw new Error('Hello');
    }

    ReactNoop.render(
      <RethrowErrorBoundary>
        <BrokenRender />
      </RethrowErrorBoundary>,
    );

    expect(Scheduler).toFlushAndYieldThrough(['RethrowErrorBoundary render']);

    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');
    expect(Scheduler).toHaveYielded([
      'BrokenRender',

      // React retries one more time
      'RethrowErrorBoundary render',
      'BrokenRender',

      // Errored again on retry. Now handle it.
      'RethrowErrorBoundary componentDidCatch',
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('propagates an error from a noop error boundary during synchronous mounting', () => {
    const ops = [];
    class RethrowErrorBoundary extends React.Component {
      componentDidCatch(error) {
        ops.push('RethrowErrorBoundary componentDidCatch');
        throw error;
      }
      render() {
        ops.push('RethrowErrorBoundary render');
        return this.props.children;
      }
    }

    function BrokenRender() {
      ops.push('BrokenRender');
      throw new Error('Hello');
    }

    expect(() => {
      ReactNoop.flushSync(() => {
        ReactNoop.render(
          <RethrowErrorBoundary>
            <BrokenRender />
          </RethrowErrorBoundary>,
        );
      });
    }).toThrow('Hello');
    expect(ops).toEqual([
      'RethrowErrorBoundary render',
      'BrokenRender',
      // React doesn't retry because we're already rendering synchronously.
      'RethrowErrorBoundary componentDidCatch',
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('propagates an error from a noop error boundary during batched mounting', () => {
    const ops = [];
    class RethrowErrorBoundary extends React.Component {
      componentDidCatch(error) {
        ops.push('RethrowErrorBoundary componentDidCatch');
        throw error;
      }
      render() {
        ops.push('RethrowErrorBoundary render');
        return this.props.children;
      }
    }

    function BrokenRender() {
      ops.push('BrokenRender');
      throw new Error('Hello');
    }

    expect(() => {
      ReactNoop.flushSync(() => {
        ReactNoop.render(
          <RethrowErrorBoundary>Before the storm.</RethrowErrorBoundary>,
        );
        ReactNoop.render(
          <RethrowErrorBoundary>
            <BrokenRender />
          </RethrowErrorBoundary>,
        );
      });
    }).toThrow('Hello');
    expect(ops).toEqual([
      'RethrowErrorBoundary render',
      'BrokenRender',
      // React doesn't retry because we're already rendering synchronously.
      'RethrowErrorBoundary componentDidCatch',
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('applies batched updates regardless despite errors in scheduling', () => {
    ReactNoop.render(<span prop="a:1" />);
    expect(() => {
      ReactNoop.batchedUpdates(() => {
        ReactNoop.render(<span prop="a:2" />);
        ReactNoop.render(<span prop="a:3" />);
        throw new Error('Hello');
      });
    }).toThrow('Hello');
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([span('a:3')]);
  });

  it('applies nested batched updates despite errors in scheduling', () => {
    ReactNoop.render(<span prop="a:1" />);
    expect(() => {
      ReactNoop.batchedUpdates(() => {
        ReactNoop.render(<span prop="a:2" />);
        ReactNoop.render(<span prop="a:3" />);
        ReactNoop.batchedUpdates(() => {
          ReactNoop.render(<span prop="a:4" />);
          ReactNoop.render(<span prop="a:5" />);
          throw new Error('Hello');
        });
      });
    }).toThrow('Hello');
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([span('a:5')]);
  });

  it('applies sync updates regardless despite errors in scheduling', () => {
    ReactNoop.render(<span prop="a:1" />);
    expect(() => {
      ReactNoop.flushSync(() => {
        ReactNoop.batchedUpdates(() => {
          ReactNoop.render(<span prop="a:2" />);
          ReactNoop.render(<span prop="a:3" />);
          throw new Error('Hello');
        });
      });
    }).toThrow('Hello');
    expect(ReactNoop.getChildren()).toEqual([span('a:3')]);
  });

  it('can schedule updates after uncaught error in render on mount', () => {
    let ops = [];

    function BrokenRender() {
      ops.push('BrokenRender');
      throw new Error('Hello');
    }

    function Foo() {
      ops.push('Foo');
      return null;
    }

    ReactNoop.render(<BrokenRender />);
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');
    expect(ops).toEqual([
      'BrokenRender',
      // React retries one more time
      'BrokenRender',
      // Errored again on retry
    ]);
    ops = [];
    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ops).toEqual(['Foo']);
  });

  it('can schedule updates after uncaught error in render on update', () => {
    let ops = [];

    function BrokenRender(props) {
      ops.push('BrokenRender');
      if (props.throw) {
        throw new Error('Hello');
      }
      return null;
    }

    function Foo() {
      ops.push('Foo');
      return null;
    }

    ReactNoop.render(<BrokenRender throw={false} />);
    expect(Scheduler).toFlushWithoutYielding();
    ops = [];

    expect(() => {
      ReactNoop.render(<BrokenRender throw={true} />);
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');
    expect(ops).toEqual([
      'BrokenRender',
      // React retries one more time
      'BrokenRender',
      // Errored again on retry
    ]);

    ops = [];
    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ops).toEqual(['Foo']);
  });

  it('can schedule updates after uncaught error during umounting', () => {
    let ops = [];

    class BrokenComponentWillUnmount extends React.Component {
      render() {
        return <div />;
      }
      componentWillUnmount() {
        throw new Error('Hello');
      }
    }

    function Foo() {
      ops.push('Foo');
      return null;
    }

    ReactNoop.render(<BrokenComponentWillUnmount />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(() => {
      ReactNoop.render(<div />);
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');

    ops = [];
    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ops).toEqual(['Foo']);
  });

  it('should not attempt to recover an unmounting error boundary', () => {
    class Parent extends React.Component {
      componentWillUnmount() {
        Scheduler.yieldValue('Parent componentWillUnmount');
      }
      render() {
        return <Boundary />;
      }
    }

    class Boundary extends React.Component {
      componentDidCatch(e) {
        Scheduler.yieldValue(`Caught error: ${e.message}`);
      }
      render() {
        return <ThrowsOnUnmount />;
      }
    }

    class ThrowsOnUnmount extends React.Component {
      componentWillUnmount() {
        Scheduler.yieldValue('ThrowsOnUnmount componentWillUnmount');
        throw new Error('unmount error');
      }
      render() {
        return null;
      }
    }

    ReactNoop.render(<Parent />);
    expect(Scheduler).toFlushWithoutYielding();
    ReactNoop.render(null);
    expect(Scheduler).toFlushAndYield([
      // Parent unmounts before the error is thrown.
      'Parent componentWillUnmount',
      'ThrowsOnUnmount componentWillUnmount',
    ]);
    ReactNoop.render(<Parent />);
  });

  it('can unmount an error boundary before it is handled', () => {
    let parent;

    class Parent extends React.Component {
      state = {step: 0};
      render() {
        parent = this;
        return this.state.step === 0 ? <Boundary /> : null;
      }
    }

    class Boundary extends React.Component {
      componentDidCatch() {}
      render() {
        return <Child />;
      }
    }

    class Child extends React.Component {
      componentDidUpdate() {
        parent.setState({step: 1});
        throw new Error('update error');
      }
      render() {
        return null;
      }
    }

    ReactNoop.render(<Parent />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.flushSync(() => {
      ReactNoop.render(<Parent />);
    });
  });

  it('continues work on other roots despite caught errors', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          return (
            <span prop={`Caught an error: ${this.state.error.message}.`} />
          );
        }
        return this.props.children;
      }
    }

    function BrokenRender(props) {
      throw new Error('Hello');
    }

    ReactNoop.renderToRootWithID(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
      'a',
    );
    ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren('a')).toEqual([
      span('Caught an error: Hello.'),
    ]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
  });

  it('continues work on other roots despite uncaught errors', () => {
    function BrokenRender(props) {
      throw new Error('Hello');
    }

    ReactNoop.renderToRootWithID(<BrokenRender />, 'a');
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');
    expect(ReactNoop.getChildren('a')).toEqual([]);

    ReactNoop.renderToRootWithID(<BrokenRender />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');

    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);

    ReactNoop.renderToRootWithID(<span prop="a:3" />, 'a');
    ReactNoop.renderToRootWithID(<BrokenRender />, 'b');
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');
    expect(ReactNoop.getChildren('a')).toEqual([span('a:3')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);

    ReactNoop.renderToRootWithID(<span prop="a:4" />, 'a');
    ReactNoop.renderToRootWithID(<BrokenRender />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:4" />, 'c');
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');
    expect(ReactNoop.getChildren('a')).toEqual([span('a:4')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:4')]);

    ReactNoop.renderToRootWithID(<span prop="a:5" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:5" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:5" />, 'c');
    ReactNoop.renderToRootWithID(<span prop="d:5" />, 'd');
    ReactNoop.renderToRootWithID(<BrokenRender />, 'e');
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');
    expect(ReactNoop.getChildren('a')).toEqual([span('a:5')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:5')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:5')]);
    expect(ReactNoop.getChildren('d')).toEqual([span('d:5')]);
    expect(ReactNoop.getChildren('e')).toEqual([]);

    ReactNoop.renderToRootWithID(<BrokenRender />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:6" />, 'b');
    ReactNoop.renderToRootWithID(<BrokenRender />, 'c');
    ReactNoop.renderToRootWithID(<span prop="d:6" />, 'd');
    ReactNoop.renderToRootWithID(<BrokenRender />, 'e');
    ReactNoop.renderToRootWithID(<span prop="f:6" />, 'f');
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');
    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:6')]);
    expect(ReactNoop.getChildren('c')).toEqual([]);
    expect(ReactNoop.getChildren('d')).toEqual([span('d:6')]);
    expect(ReactNoop.getChildren('e')).toEqual([]);
    expect(ReactNoop.getChildren('f')).toEqual([span('f:6')]);

    ReactNoop.unmountRootWithID('a');
    ReactNoop.unmountRootWithID('b');
    ReactNoop.unmountRootWithID('c');
    ReactNoop.unmountRootWithID('d');
    ReactNoop.unmountRootWithID('e');
    ReactNoop.unmountRootWithID('f');
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren('a')).toEqual(null);
    expect(ReactNoop.getChildren('b')).toEqual(null);
    expect(ReactNoop.getChildren('c')).toEqual(null);
    expect(ReactNoop.getChildren('d')).toEqual(null);
    expect(ReactNoop.getChildren('e')).toEqual(null);
    expect(ReactNoop.getChildren('f')).toEqual(null);
  });

  it('unwinds the context stack correctly on error', () => {
    class Provider extends React.Component {
      static childContextTypes = {message: PropTypes.string};
      static contextTypes = {message: PropTypes.string};
      getChildContext() {
        return {
          message: (this.context.message || '') + this.props.message,
        };
      }
      render() {
        return this.props.children;
      }
    }

    function Connector(props, context) {
      return <span prop={context.message} />;
    }

    Connector.contextTypes = {
      message: PropTypes.string,
    };

    function BadRender() {
      throw new Error('render error');
    }

    class Boundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        this.setState({error});
      }
      render() {
        return (
          <Provider message="b">
            <Provider message="c">
              <Provider message="d">
                <Provider message="e">
                  {!this.state.error && <BadRender />}
                </Provider>
              </Provider>
            </Provider>
          </Provider>
        );
      }
    }

    ReactNoop.render(
      <Provider message="a">
        <Boundary />
        <Connector />
      </Provider>,
    );
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toWarnDev(
      'Legacy context API has been detected within a strict-mode tree: \n\n' +
        'Please update the following components: Connector, Provider',
      {withoutStack: true},
    );

    // If the context stack does not unwind, span will get 'abcde'
    expect(ReactNoop.getChildren()).toEqual([span('a')]);
  });

  it('catches reconciler errors in a boundary during mounting', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          return <span prop={this.state.error.message} />;
        }
        return this.props.children;
      }
    }
    const InvalidType = undefined;
    function BrokenRender(props) {
      return <InvalidType />;
    }

    ReactNoop.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
    );
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toWarnDev([
      'Warning: React.createElement: type is invalid -- expected a string',
      // React retries once on error
      'Warning: React.createElement: type is invalid -- expected a string',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span(
        'Element type is invalid: expected a string (for built-in components) or ' +
          'a class/function (for composite components) but got: undefined.' +
          (__DEV__
            ? " You likely forgot to export your component from the file it's " +
              'defined in, or you might have mixed up default and named imports.' +
              '\n\nCheck the render method of `BrokenRender`.'
            : ''),
      ),
    ]);
  });

  it('catches reconciler errors in a boundary during update', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          return <span prop={this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    const InvalidType = undefined;
    function BrokenRender(props) {
      return props.fail ? <InvalidType /> : <span />;
    }

    ReactNoop.render(
      <ErrorBoundary>
        <BrokenRender fail={false} />
      </ErrorBoundary>,
    );
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(
      <ErrorBoundary>
        <BrokenRender fail={true} />
      </ErrorBoundary>,
    );
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toWarnDev([
      'Warning: React.createElement: type is invalid -- expected a string',
      // React retries once on error
      'Warning: React.createElement: type is invalid -- expected a string',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span(
        'Element type is invalid: expected a string (for built-in components) or ' +
          'a class/function (for composite components) but got: undefined.' +
          (__DEV__
            ? " You likely forgot to export your component from the file it's " +
              'defined in, or you might have mixed up default and named imports.' +
              '\n\nCheck the render method of `BrokenRender`.'
            : ''),
      ),
    ]);
  });

  it('recovers from uncaught reconciler errors', () => {
    const InvalidType = undefined;
    expect(() => ReactNoop.render(<InvalidType />)).toWarnDev(
      'Warning: React.createElement: type is invalid -- expected a string',
      {withoutStack: true},
    );
    expect(Scheduler).toFlushAndThrow(
      'Element type is invalid: expected a string (for built-in components) or ' +
        'a class/function (for composite components) but got: undefined.' +
        (__DEV__
          ? " You likely forgot to export your component from the file it's " +
            'defined in, or you might have mixed up default and named imports.'
          : ''),
    );

    ReactNoop.render(<span prop="hi" />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([span('hi')]);
  });

  it('unmounts components with uncaught errors', () => {
    const ops = [];
    let inst;

    class BrokenRenderAndUnmount extends React.Component {
      state = {fail: false};
      componentWillUnmount() {
        ops.push('BrokenRenderAndUnmount componentWillUnmount');
      }
      render() {
        inst = this;
        if (this.state.fail) {
          throw new Error('Hello.');
        }
        return null;
      }
    }

    class Parent extends React.Component {
      componentWillUnmount() {
        ops.push('Parent componentWillUnmount [!]');
        throw new Error('One does not simply unmount me.');
      }
      render() {
        return this.props.children;
      }
    }

    ReactNoop.render(
      <Parent>
        <Parent>
          <BrokenRenderAndUnmount />
        </Parent>
      </Parent>,
    );
    expect(Scheduler).toFlushWithoutYielding();

    inst.setState({fail: true});
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrowError('Hello.');

    expect(ops).toEqual([
      // Attempt to clean up.
      // Errors in parents shouldn't stop children from unmounting.
      'Parent componentWillUnmount [!]',
      'Parent componentWillUnmount [!]',
      'BrokenRenderAndUnmount componentWillUnmount',
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('does not interrupt unmounting if detaching a ref throws', () => {
    let ops = [];

    class Bar extends React.Component {
      componentWillUnmount() {
        ops.push('Bar unmount');
      }
      render() {
        return <span prop="Bar" />;
      }
    }

    function barRef(inst) {
      if (inst === null) {
        ops.push('barRef detach');
        throw new Error('Detach error');
      }
      ops.push('barRef attach');
    }

    function Foo(props) {
      return <div>{props.hide ? null : <Bar ref={barRef} />}</div>;
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ops).toEqual(['barRef attach']);
    expect(ReactNoop.getChildren()).toEqual([div(span('Bar'))]);

    ops = [];

    // Unmount
    ReactNoop.render(<Foo hide={true} />);
    expect(Scheduler).toFlushAndThrow('Detach error');
    expect(ops).toEqual([
      'barRef detach',
      // Bar should unmount even though its ref threw an error while detaching
      'Bar unmount',
    ]);
    // Because there was an error, entire tree should unmount
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('handles error thrown by host config while working on failed root', () => {
    ReactNoop.render(<errorInBeginPhase />);
    expect(Scheduler).toFlushAndThrow('Error in host config.');
  });

  it('handles error thrown by top-level callback', () => {
    ReactNoop.render(<div />, () => {
      throw new Error('Error!');
    });
    expect(Scheduler).toFlushAndThrow('Error!');
  });

  it('error boundaries capture non-errors', () => {
    spyOnProd(console, 'error');
    spyOnDev(console, 'error');
    let ops = [];

    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        // Should not be called
        ops.push('componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          ops.push('ErrorBoundary (catch)');
          return (
            <span
              prop={`Caught an error: ${this.state.error.nonStandardMessage}`}
            />
          );
        }
        ops.push('ErrorBoundary (try)');
        return this.props.children;
      }
    }

    function Indirection(props) {
      ops.push('Indirection');
      return props.children;
    }

    const notAnError = {nonStandardMessage: 'oops'};
    function BadRender() {
      ops.push('BadRender');
      throw notAnError;
    }

    ReactNoop.render(
      <ErrorBoundary>
        <Indirection>
          <BadRender />
        </Indirection>
      </ErrorBoundary>,
    );
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([
      'ErrorBoundary (try)',
      'Indirection',
      'BadRender',

      // React retries one more time
      'ErrorBoundary (try)',
      'Indirection',
      'BadRender',

      // Errored again on retry. Now handle it.
      'componentDidCatch',
      'ErrorBoundary (catch)',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: oops')]);

    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'The above error occurred in the <BadRender> component:',
      );
    } else {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(notAnError);
    }
  });

  // TODO: Error boundary does not catch promises

  it('continues working on siblings of a component that throws', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        Scheduler.yieldValue('componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          Scheduler.yieldValue('ErrorBoundary (catch)');
          return <ErrorMessage error={this.state.error} />;
        }
        Scheduler.yieldValue('ErrorBoundary (try)');
        return this.props.children;
      }
    }

    function ErrorMessage(props) {
      Scheduler.yieldValue('ErrorMessage');
      return <span prop={`Caught an error: ${props.error.message}`} />;
    }

    function BadRenderSibling(props) {
      Scheduler.yieldValue('BadRenderSibling');
      return null;
    }

    function BadRender() {
      Scheduler.yieldValue('throw');
      throw new Error('oops!');
    }

    ReactNoop.render(
      <ErrorBoundary>
        <BadRender />
        <BadRenderSibling />
        <BadRenderSibling />
      </ErrorBoundary>,
    );

    expect(Scheduler).toFlushAndYield([
      'ErrorBoundary (try)',
      'throw',
      // Continue rendering siblings after BadRender throws
      'BadRenderSibling',
      'BadRenderSibling',

      // React retries one more time
      'ErrorBoundary (try)',
      'throw',
      'BadRenderSibling',
      'BadRenderSibling',

      // Errored again on retry. Now handle it.
      'componentDidCatch',
      'ErrorBoundary (catch)',
      'ErrorMessage',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: oops!')]);
  });

  it('calls the correct lifecycles on the error boundary after catching an error (mixed)', () => {
    // This test seems a bit contrived, but it's based on an actual regression
    // where we checked for the existence of didUpdate instead of didMount, and
    // didMount was not defined.
    function BadRender() {
      Scheduler.yieldValue('throw');
      throw new Error('oops!');
    }

    class Parent extends React.Component {
      state = {error: null, other: false};
      componentDidCatch(error) {
        Scheduler.yieldValue('did catch');
        this.setState({error});
      }
      componentDidUpdate() {
        Scheduler.yieldValue('did update');
      }
      render() {
        if (this.state.error) {
          Scheduler.yieldValue('render error message');
          return <span prop={`Caught an error: ${this.state.error.message}`} />;
        }
        Scheduler.yieldValue('render');
        return <BadRender />;
      }
    }

    ReactNoop.render(<Parent step={1} />);
    expect(Scheduler).toFlushAndYieldThrough([
      'render',
      'throw',
      'render',
      'throw',
      'did catch',
      'render error message',
      'did update',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: oops!')]);
  });

  it('provides component stack to the error boundary with componentDidCatch', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null, errorInfo: null};
      componentDidCatch(error, errorInfo) {
        this.setState({error, errorInfo});
      }
      render() {
        if (this.state.errorInfo) {
          Scheduler.yieldValue('render error message');
          return (
            <span
              prop={`Caught an error:${normalizeCodeLocInfo(
                this.state.errorInfo.componentStack,
              )}.`}
            />
          );
        }
        return this.props.children;
      }
    }

    function BrokenRender(props) {
      throw new Error('Hello');
    }

    ReactNoop.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
    );
    expect(Scheduler).toFlushAndYield(['render error message']);
    expect(ReactNoop.getChildren()).toEqual([
      span(
        'Caught an error:\n' +
          (__DEV__
            ? '    in BrokenRender (at **)\n'
            : '    in BrokenRender\n') +
          (__DEV__ ? '    in ErrorBoundary (at **).' : '    in ErrorBoundary.'),
      ),
    ]);
  });

  it('does not provide component stack to the error boundary with getDerivedStateFromError', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error, errorInfo) {
        expect(errorInfo).toBeUndefined();
        return {error};
      }
      render() {
        if (this.state.error) {
          return <span prop={`Caught an error: ${this.state.error.message}`} />;
        }
        return this.props.children;
      }
    }

    function BrokenRender(props) {
      throw new Error('Hello');
    }

    ReactNoop.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
    );
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: Hello')]);
  });

  it('handles error thrown inside getDerivedStateFromProps of a module-style context provider', () => {
    function Provider() {
      return {
        getChildContext() {
          return {foo: 'bar'};
        },
        render() {
          return 'Hi';
        },
      };
    }
    Provider.childContextTypes = {
      x: () => {},
    };
    Provider.getDerivedStateFromProps = () => {
      throw new Error('Oops!');
    };

    ReactNoop.render(<Provider />);
    expect(() => {
      expect(Scheduler).toFlushAndThrow('Oops!');
    }).toWarnDev(
      'Legacy context API has been detected within a strict-mode tree: \n\n' +
        'Please update the following components: Provider',
      {withoutStack: true},
    );
  });
});
