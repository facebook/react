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

let PropTypes;
let ReactFeatureFlags;
let React;
let ReactNoop;

describe('ReactIncrementalErrorHandling', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableGetDerivedStateFromCatch = true;
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    PropTypes = require('prop-types');
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function div(...children) {
    children = children.map(c => (typeof c === 'string' ? {text: c} : c));
    return {type: 'div', children, prop: undefined};
  }

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  it('recovers from errors asynchronously', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        ReactNoop.yield('componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          ReactNoop.yield('ErrorBoundary (catch)');
          return <ErrorMessage error={this.state.error} />;
        }
        ReactNoop.yield('ErrorBoundary (try)');
        return this.props.children;
      }
    }

    function ErrorMessage(props) {
      ReactNoop.yield('ErrorMessage');
      return <span prop={`Caught an error: ${props.error.message}`} />;
    }

    function Indirection(props) {
      ReactNoop.yield('Indirection');
      return props.children || null;
    }

    function BadRender() {
      ReactNoop.yield('throw');
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

    // Start rendering asynchronsouly
    ReactNoop.flushThrough([
      'ErrorBoundary (try)',
      'Indirection',
      'Indirection',
      'Indirection',
      // An error is thrown. React keeps rendering asynchronously.
      'throw',
    ]);

    // Still rendering async...
    ReactNoop.flushThrough(['Indirection']);

    ReactNoop.flushThrough([
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
        ReactNoop.yield('error');
        throw new Error('Oops!');
      }
      ReactNoop.yield('success');
      return <span prop="Everything is fine." />;
    }

    function onCommit() {
      ReactNoop.yield('commit');
    }

    ReactNoop.render(<App isBroken={true} />, onCommit);
    ReactNoop.expire(2000);
    ReactNoop.render(<App isBroken={false} />, onCommit);

    expect(ReactNoop.flush()).toEqual([
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
        ReactNoop.yield('commit: ' + this.state.hideChild);
      }
      render() {
        if (this.state.hideChild) {
          ReactNoop.yield('(empty)');
          return <span prop="(empty)" />;
        }
        return <Child isBroken={this.props.childIsBroken} />;
      }
    }

    function Child(props) {
      if (props.isBroken) {
        ReactNoop.yield('Error!');
        throw new Error('Error!');
      }
      ReactNoop.yield('Child');
      return <span prop="Child" />;
    }

    // Initial mount
    const parent = React.createRef(null);
    ReactNoop.render(<Parent ref={parent} childIsBroken={false} />);
    expect(ReactNoop.flush()).toEqual(['Child']);
    expect(ReactNoop.getChildren()).toEqual([span('Child')]);

    // Schedule a low priority update to hide the child
    parent.current.setState({hideChild: true});

    // Before the low priority update is flushed, synchronsouly trigger an
    // error in the child.
    ReactNoop.flushSync(() => {
      ReactNoop.render(<Parent ref={parent} childIsBroken={true} />);
    });
    expect(ReactNoop.clearYields()).toEqual([
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
      ReactNoop.yield('BadRender');
      throw new Error('oops');
    }

    function Sibling() {
      ops.push('Sibling');
      ReactNoop.yield('Sibling');
      return <span prop="Sibling" />;
    }

    function Parent() {
      ops.push('Parent');
      ReactNoop.yield('Parent');
      return (
        <React.Fragment>
          <BadRender />
          <Sibling />
        </React.Fragment>
      );
    }

    ReactNoop.render(<Parent />);

    // Render the bad component asynchronously
    ReactNoop.flushThrough(['Parent', 'BadRender']);

    // Finish the rest of the async work
    ReactNoop.flushThrough(['Sibling']);

    // Rendering two more units of work should be enough to trigger the retry
    // and synchronously throw an error.
    ops = [];
    expect(() => ReactNoop.flushUnitsOfWork(2)).toThrow('oops');
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
        ReactNoop.yield('BadMount');
        return null;
      }
    }

    class ErrorBoundary extends React.Component {
      state = {errorCount: 0};
      componentDidCatch(error) {
        ReactNoop.yield(`componentDidCatch: ${error.message}`);
        this.setState(state => ({errorCount: state.errorCount + 1}));
      }
      render() {
        if (this.state.errorCount > 0) {
          return <span prop={`Number of errors: ${this.state.errorCount}`} />;
        }
        ReactNoop.yield('ErrorBoundary');
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

    expect(ReactNoop.flush()).toEqual([
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
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: Hello.')]);
  });

  it('catches render error in a boundary during partial deferred mounting', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        ReactNoop.yield('ErrorBoundary componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          ReactNoop.yield('ErrorBoundary render error');
          return (
            <span prop={`Caught an error: ${this.state.error.message}.`} />
          );
        }
        ReactNoop.yield('ErrorBoundary render success');
        return this.props.children;
      }
    }

    function BrokenRender(props) {
      ReactNoop.yield('BrokenRender');
      throw new Error('Hello');
    }

    ReactNoop.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
    );

    ReactNoop.flushThrough(['ErrorBoundary render success']);
    expect(ReactNoop.getChildren()).toEqual([]);

    expect(ReactNoop.flush()).toEqual([
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
      ReactNoop.flush();
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

    ReactNoop.flushDeferredPri(15);
    expect(ops).toEqual(['RethrowErrorBoundary render']);

    ops.length = 0;
    expect(() => {
      ReactNoop.flush();
    }).toThrow('Hello');
    expect(ops).toEqual([
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
    ReactNoop.flush();
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
    ReactNoop.flush();
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
      ReactNoop.flush();
    }).toThrow('Hello');
    expect(ops).toEqual([
      'BrokenRender',
      // React retries one more time
      'BrokenRender',
      // Errored again on retry
    ]);
    ops = [];
    ReactNoop.render(<Foo />);
    ReactNoop.flush();
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
    ReactNoop.flush();
    ops = [];

    expect(() => {
      ReactNoop.render(<BrokenRender throw={true} />);
      ReactNoop.flush();
    }).toThrow('Hello');
    expect(ops).toEqual([
      'BrokenRender',
      // React retries one more time
      'BrokenRender',
      // Errored again on retry
    ]);

    ops = [];
    ReactNoop.render(<Foo />);
    ReactNoop.flush();
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
    ReactNoop.flush();

    expect(() => {
      ReactNoop.render(<div />);
      ReactNoop.flush();
    }).toThrow('Hello');

    ops = [];
    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ops).toEqual(['Foo']);
  });

  it('should not attempt to recover an unmounting error boundary', () => {
    class Parent extends React.Component {
      componentWillUnmount() {
        ReactNoop.yield('Parent componentWillUnmount');
      }
      render() {
        return <Boundary />;
      }
    }

    class Boundary extends React.Component {
      componentDidCatch(e) {
        ReactNoop.yield(`Caught error: ${e.message}`);
      }
      render() {
        return <ThrowsOnUnmount />;
      }
    }

    class ThrowsOnUnmount extends React.Component {
      componentWillUnmount() {
        ReactNoop.yield('ThrowsOnUnmount componentWillUnmount');
        throw new Error('unmount error');
      }
      render() {
        return null;
      }
    }

    ReactNoop.render(<Parent />);
    ReactNoop.flush();
    ReactNoop.render(null);
    expect(ReactNoop.flush()).toEqual([
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
    ReactNoop.flush();

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
    ReactNoop.flush();
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
      ReactNoop.flush();
    }).toThrow('Hello');
    expect(ReactNoop.getChildren('a')).toEqual([]);

    ReactNoop.renderToRootWithID(<BrokenRender />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
    expect(() => {
      ReactNoop.flush();
    }).toThrow('Hello');

    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);

    ReactNoop.renderToRootWithID(<span prop="a:3" />, 'a');
    ReactNoop.renderToRootWithID(<BrokenRender />, 'b');
    expect(() => {
      ReactNoop.flush();
    }).toThrow('Hello');
    expect(ReactNoop.getChildren('a')).toEqual([span('a:3')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);

    ReactNoop.renderToRootWithID(<span prop="a:4" />, 'a');
    ReactNoop.renderToRootWithID(<BrokenRender />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:4" />, 'c');
    expect(() => {
      ReactNoop.flush();
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
      ReactNoop.flush();
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
      ReactNoop.flush();
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
    ReactNoop.flush();
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
    ReactNoop.flush();

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
    expect(ReactNoop.flush).toWarnDev([
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
    ReactNoop.flush();

    ReactNoop.render(
      <ErrorBoundary>
        <BrokenRender fail={true} />
      </ErrorBoundary>,
    );
    expect(ReactNoop.flush).toWarnDev([
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
    expect(ReactNoop.flush).toThrowError(
      'Element type is invalid: expected a string (for built-in components) or ' +
        'a class/function (for composite components) but got: undefined.' +
        (__DEV__
          ? " You likely forgot to export your component from the file it's " +
            'defined in, or you might have mixed up default and named imports.'
          : ''),
    );

    ReactNoop.render(<span prop="hi" />);
    ReactNoop.flush();
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
    ReactNoop.flush();

    inst.setState({fail: true});
    expect(() => {
      ReactNoop.flush();
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
    ReactNoop.flush();
    expect(ops).toEqual(['barRef attach']);
    expect(ReactNoop.getChildren()).toEqual([div(span('Bar'))]);

    ops = [];

    // Unmount
    ReactNoop.render(<Foo hide={true} />);
    expect(() => ReactNoop.flush()).toThrow('Detach error');
    expect(ops).toEqual([
      'barRef detach',
      // Bar should unmount even though its ref threw an error while detaching
      'Bar unmount',
    ]);
    // Because there was an error, entire tree should unmount
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('handles error thrown by host config while working on failed root', () => {
    ReactNoop.simulateErrorInHostConfigDuringBeginPhase(() => {
      ReactNoop.render(<span />);
      expect(() => ReactNoop.flush()).toThrow('Error in host config.');
    });
  });

  it('handles error thrown by top-level callback', () => {
    ReactNoop.render(<div />, () => {
      throw new Error('Error!');
    });
    expect(() => ReactNoop.flush()).toThrow('Error!');
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
    ReactNoop.flush();

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
        ReactNoop.yield('componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          ReactNoop.yield('ErrorBoundary (catch)');
          return <ErrorMessage error={this.state.error} />;
        }
        ReactNoop.yield('ErrorBoundary (try)');
        return this.props.children;
      }
    }

    function ErrorMessage(props) {
      ReactNoop.yield('ErrorMessage');
      return <span prop={`Caught an error: ${props.error.message}`} />;
    }

    function BadRenderSibling(props) {
      ReactNoop.yield('BadRenderSibling');
      return null;
    }

    function BadRender() {
      ReactNoop.yield('throw');
      throw new Error('oops!');
    }

    ReactNoop.render(
      <ErrorBoundary>
        <BadRender />
        <BadRenderSibling />
        <BadRenderSibling />
      </ErrorBoundary>,
    );

    expect(ReactNoop.flush()).toEqual([
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
      ReactNoop.yield('throw');
      throw new Error('oops!');
    }

    class Parent extends React.Component {
      state = {error: null, other: false};
      componentDidCatch(error) {
        ReactNoop.yield('did catch');
        this.setState({error});
      }
      componentDidUpdate() {
        ReactNoop.yield('did update');
      }
      render() {
        if (this.state.error) {
          ReactNoop.yield('render error message');
          return <span prop={`Caught an error: ${this.state.error.message}`} />;
        }
        ReactNoop.yield('render');
        return <BadRender />;
      }
    }

    ReactNoop.render(<Parent step={1} />);
    ReactNoop.flushThrough([
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
          ReactNoop.yield('render error message');
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
    ReactNoop.flushDeferredPri();
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

  it('does not provide component stack to the error boundary with getDerivedStateFromCatch', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromCatch(error, errorInfo) {
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
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: Hello')]);
  });
});
