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

let ReactFeatureFlags = require('shared/ReactFeatureFlags');
let PropTypes;
let React;
let ReactNoop;
let Scheduler;
let act;

describe('ReactIncrementalErrorHandling', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    PropTypes = require('prop-types');
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
  });

  function div(...children) {
    children = children.map(c => (typeof c === 'string' ? {text: c} : c));
    return {type: 'div', children, prop: undefined, hidden: false};
  }

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  function normalizeCodeLocInfo(str) {
    return (
      str &&
      str.replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function(m, name) {
        return '\n    in ' + name + ' (at **)';
      })
    );
  }

  // Note: This is based on a similar component we use in www. We can delete
  // once the extra div wrapper is no longer necessary.
  function LegacyHiddenDiv({children, mode}) {
    return (
      <div hidden={mode === 'hidden'}>
        <React.unstable_LegacyHidden
          mode={mode === 'hidden' ? 'unstable-defer-without-hiding' : mode}>
          {children}
        </React.unstable_LegacyHidden>
      </div>
    );
  }

  it('recovers from errors asynchronously', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        Scheduler.unstable_yieldValue('getDerivedStateFromError');
        return {error};
      }
      render() {
        if (this.state.error) {
          Scheduler.unstable_yieldValue('ErrorBoundary (catch)');
          return <ErrorMessage error={this.state.error} />;
        }
        Scheduler.unstable_yieldValue('ErrorBoundary (try)');
        return this.props.children;
      }
    }

    function ErrorMessage({error}) {
      Scheduler.unstable_yieldValue('ErrorMessage');
      return <span prop={`Caught an error: ${error.message}`} />;
    }

    function Indirection({children}) {
      Scheduler.unstable_yieldValue('Indirection');
      return children || null;
    }

    function BadRender({unused}) {
      Scheduler.unstable_yieldValue('throw');
      throw new Error('oops!');
    }

    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
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
      });
    } else {
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
    }

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
        Scheduler.unstable_yieldValue('componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          Scheduler.unstable_yieldValue('ErrorBoundary (catch)');
          return <ErrorMessage error={this.state.error} />;
        }
        Scheduler.unstable_yieldValue('ErrorBoundary (try)');
        return this.props.children;
      }
    }

    function ErrorMessage({error}) {
      Scheduler.unstable_yieldValue('ErrorMessage');
      return <span prop={`Caught an error: ${error.message}`} />;
    }

    function Indirection({children}) {
      Scheduler.unstable_yieldValue('Indirection');
      return children || null;
    }

    function BadRender({unused}) {
      Scheduler.unstable_yieldValue('throw');
      throw new Error('oops!');
    }

    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
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
      });
    } else {
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
    }

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
      // reverts to legacy mode to retry one more time before handling the error.

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

  it("retries at a lower priority if there's additional pending work", async () => {
    function App(props) {
      if (props.isBroken) {
        Scheduler.unstable_yieldValue('error');
        throw new Error('Oops!');
      }
      Scheduler.unstable_yieldValue('success');
      return <span prop="Everything is fine." />;
    }

    function onCommit() {
      Scheduler.unstable_yieldValue('commit');
    }

    React.startTransition(() => {
      ReactNoop.render(<App isBroken={true} />, onCommit);
    });
    expect(Scheduler).toFlushAndYieldThrough(['error']);

    React.startTransition(() => {
      // This update is in a separate batch
      ReactNoop.render(<App isBroken={false} />, onCommit);
    });

    // React will try to recover by rendering all the pending updates in a
    // single batch, synchronously. This time it succeeds.
    //
    // This tells Scheduler to render a single unit of work. Because the render
    // to recover from the error is synchronous, this should be enough to
    // finish the rest of the work.
    Scheduler.unstable_flushNumberOfYields(1);
    expect(Scheduler).toHaveYielded([
      'success',
      // Nothing commits until the second update completes.
      'commit',
      'commit',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Everything is fine.')]);
  });

  // @gate www
  it('does not include offscreen work when retrying after an error', () => {
    function App(props) {
      if (props.isBroken) {
        Scheduler.unstable_yieldValue('error');
        throw new Error('Oops!');
      }
      Scheduler.unstable_yieldValue('success');
      return (
        <>
          Everything is fine
          <LegacyHiddenDiv mode="hidden">
            <div>Offscreen content</div>
          </LegacyHiddenDiv>
        </>
      );
    }

    function onCommit() {
      Scheduler.unstable_yieldValue('commit');
    }

    React.startTransition(() => {
      ReactNoop.render(<App isBroken={true} />, onCommit);
    });
    expect(Scheduler).toFlushAndYieldThrough(['error']);

    expect(ReactNoop).toMatchRenderedOutput(null);

    React.startTransition(() => {
      // This update is in a separate batch
      ReactNoop.render(<App isBroken={false} />, onCommit);
    });

    // React will try to recover by rendering all the pending updates in a
    // single batch, synchronously. This time it succeeds.
    //
    // This tells Scheduler to render a single unit of work. Because the render
    // to recover from the error is synchronous, this should be enough to
    // finish the rest of the work.
    Scheduler.unstable_flushNumberOfYields(1);
    expect(Scheduler).toHaveYielded([
      'success',
      // Nothing commits until the second update completes.
      'commit',
      'commit',
    ]);
    // This should not include the offscreen content
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        Everything is fine
        <div hidden={true} />
      </>,
    );

    // The offscreen content finishes in a subsequent render
    expect(Scheduler).toFlushAndYield([]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        Everything is fine
        <div hidden={true}>
          <div>Offscreen content</div>
        </div>
      </>,
    );
  });

  it('retries one more time before handling error', () => {
    function BadRender({unused}) {
      Scheduler.unstable_yieldValue('BadRender');
      throw new Error('oops');
    }

    function Sibling({unused}) {
      Scheduler.unstable_yieldValue('Sibling');
      return <span prop="Sibling" />;
    }

    function Parent({unused}) {
      Scheduler.unstable_yieldValue('Parent');
      return (
        <>
          <BadRender />
          <Sibling />
        </>
      );
    }

    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        ReactNoop.render(<Parent />, () =>
          Scheduler.unstable_yieldValue('commit'),
        );
      });
    } else {
      ReactNoop.render(<Parent />, () =>
        Scheduler.unstable_yieldValue('commit'),
      );
    }

    // Render the bad component asynchronously
    expect(Scheduler).toFlushAndYieldThrough(['Parent', 'BadRender']);

    // Finish the rest of the async work
    expect(Scheduler).toFlushAndYieldThrough(['Sibling']);

    // Old scheduler renders, commits, and throws synchronously
    expect(() => Scheduler.unstable_flushNumberOfYields(1)).toThrow('oops');
    expect(Scheduler).toHaveYielded([
      'Parent',
      'BadRender',
      'Sibling',
      'commit',
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('retries one more time if an error occurs during a render that expires midway through the tree', async () => {
    function Oops({unused}) {
      Scheduler.unstable_yieldValue('Oops');
      throw new Error('Oops');
    }

    function Text({text}) {
      Scheduler.unstable_yieldValue(text);
      return text;
    }

    function App({unused}) {
      return (
        <>
          <Text text="A" />
          <Text text="B" />
          <Oops />
          <Text text="C" />
          <Text text="D" />
        </>
      );
    }

    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        ReactNoop.render(<App />);
      });
    } else {
      ReactNoop.render(<App />);
    }

    // Render part of the tree
    expect(Scheduler).toFlushAndYieldThrough(['A', 'B']);

    // Expire the render midway through
    Scheduler.unstable_advanceTime(10000);

    expect(() => {
      Scheduler.unstable_flushExpired();
      ReactNoop.flushSync();
    }).toThrow('Oops');

    expect(Scheduler).toHaveYielded([
      // The render expired, but we shouldn't throw out the partial work.
      // Finish the current level.
      'Oops',
      'C',
      'D',

      // Since the error occurred during a partially concurrent render, we should
      // retry one more time, synchronously.
      'A',
      'B',
      'Oops',
      'C',
      'D',
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('calls componentDidCatch multiple times for multiple errors', () => {
    let id = 0;
    class BadMount extends React.Component {
      componentDidMount() {
        throw new Error(`Error ${++id}`);
      }
      render() {
        Scheduler.unstable_yieldValue('BadMount');
        return null;
      }
    }

    class ErrorBoundary extends React.Component {
      state = {errorCount: 0};
      componentDidCatch(error) {
        Scheduler.unstable_yieldValue(`componentDidCatch: ${error.message}`);
        this.setState(state => ({errorCount: state.errorCount + 1}));
      }
      render() {
        if (this.state.errorCount > 0) {
          return <span prop={`Number of errors: ${this.state.errorCount}`} />;
        }
        Scheduler.unstable_yieldValue('ErrorBoundary');
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
        Scheduler.unstable_yieldValue('ErrorBoundary componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          Scheduler.unstable_yieldValue('ErrorBoundary render error');
          return (
            <span prop={`Caught an error: ${this.state.error.message}.`} />
          );
        }
        Scheduler.unstable_yieldValue('ErrorBoundary render success');
        return this.props.children;
      }
    }

    function BrokenRender({unused}) {
      Scheduler.unstable_yieldValue('BrokenRender');
      throw new Error('Hello');
    }

    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        ReactNoop.render(
          <ErrorBoundary>
            <BrokenRender />
          </ErrorBoundary>,
        );
      });
    } else {
      ReactNoop.render(
        <ErrorBoundary>
          <BrokenRender />
        </ErrorBoundary>,
      );
    }

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
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        Scheduler.unstable_yieldValue('ErrorBoundary componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          Scheduler.unstable_yieldValue('ErrorBoundary render error');
          return (
            <span prop={`Caught an error: ${this.state.error.message}.`} />
          );
        }
        Scheduler.unstable_yieldValue('ErrorBoundary render success');
        return this.props.children;
      }
    }

    function BrokenRender({unused}) {
      Scheduler.unstable_yieldValue('BrokenRender');
      throw new Error('Hello');
    }

    ReactNoop.flushSync(() => {
      ReactNoop.render(
        <ErrorBoundary>
          <BrokenRender />
        </ErrorBoundary>,
      );
    });

    expect(Scheduler).toHaveYielded([
      'ErrorBoundary render success',
      'BrokenRender',

      // React retries one more time
      'ErrorBoundary render success',
      'BrokenRender',

      // Errored again on retry. Now handle it.
      'ErrorBoundary componentDidCatch',
      'ErrorBoundary render error',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: Hello.')]);
  });

  it('catches render error in a boundary during batched mounting', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        Scheduler.unstable_yieldValue('ErrorBoundary componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          Scheduler.unstable_yieldValue('ErrorBoundary render error');
          return (
            <span prop={`Caught an error: ${this.state.error.message}.`} />
          );
        }
        Scheduler.unstable_yieldValue('ErrorBoundary render success');
        return this.props.children;
      }
    }

    function BrokenRender({unused}) {
      Scheduler.unstable_yieldValue('BrokenRender');
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

    expect(Scheduler).toHaveYielded([
      'ErrorBoundary render success',
      'BrokenRender',

      // React retries one more time
      'ErrorBoundary render success',
      'BrokenRender',

      // Errored again on retry. Now handle it.
      'ErrorBoundary componentDidCatch',
      'ErrorBoundary render error',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: Hello.')]);
  });

  it('propagates an error from a noop error boundary during full deferred mounting', () => {
    class RethrowErrorBoundary extends React.Component {
      componentDidCatch(error) {
        Scheduler.unstable_yieldValue('RethrowErrorBoundary componentDidCatch');
        throw error;
      }
      render() {
        Scheduler.unstable_yieldValue('RethrowErrorBoundary render');
        return this.props.children;
      }
    }

    function BrokenRender({unused}) {
      Scheduler.unstable_yieldValue('BrokenRender');
      throw new Error('Hello');
    }

    ReactNoop.render(
      <RethrowErrorBoundary>
        <BrokenRender />
      </RethrowErrorBoundary>,
    );

    expect(() => {
      expect(Scheduler).toFlushAndYield([
        'RethrowErrorBoundary render',
        'BrokenRender',

        // React retries one more time
        'RethrowErrorBoundary render',
        'BrokenRender',

        // Errored again on retry. Now handle it.
        'RethrowErrorBoundary componentDidCatch',
      ]);
    }).toThrow('Hello');
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('propagates an error from a noop error boundary during partial deferred mounting', () => {
    class RethrowErrorBoundary extends React.Component {
      componentDidCatch(error) {
        Scheduler.unstable_yieldValue('RethrowErrorBoundary componentDidCatch');
        throw error;
      }
      render() {
        Scheduler.unstable_yieldValue('RethrowErrorBoundary render');
        return this.props.children;
      }
    }

    function BrokenRender({unused}) {
      Scheduler.unstable_yieldValue('BrokenRender');
      throw new Error('Hello');
    }

    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        ReactNoop.render(
          <RethrowErrorBoundary>
            <BrokenRender />
          </RethrowErrorBoundary>,
        );
      });
    } else {
      ReactNoop.render(
        <RethrowErrorBoundary>
          <BrokenRender />
        </RethrowErrorBoundary>,
      );
    }

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
    class RethrowErrorBoundary extends React.Component {
      componentDidCatch(error) {
        Scheduler.unstable_yieldValue('RethrowErrorBoundary componentDidCatch');
        throw error;
      }
      render() {
        Scheduler.unstable_yieldValue('RethrowErrorBoundary render');
        return this.props.children;
      }
    }

    function BrokenRender({unused}) {
      Scheduler.unstable_yieldValue('BrokenRender');
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
    expect(Scheduler).toHaveYielded([
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

  it('propagates an error from a noop error boundary during batched mounting', () => {
    class RethrowErrorBoundary extends React.Component {
      componentDidCatch(error) {
        Scheduler.unstable_yieldValue('RethrowErrorBoundary componentDidCatch');
        throw error;
      }
      render() {
        Scheduler.unstable_yieldValue('RethrowErrorBoundary render');
        return this.props.children;
      }
    }

    function BrokenRender({unused}) {
      Scheduler.unstable_yieldValue('BrokenRender');
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
    expect(Scheduler).toHaveYielded([
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

  // TODO: Is this a breaking change?
  it('defers additional sync work to a separate event after an error', () => {
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
    Scheduler.unstable_flushAll();
    expect(ReactNoop.getChildren()).toEqual([span('a:3')]);
  });

  it('can schedule updates after uncaught error in render on mount', () => {
    function BrokenRender({unused}) {
      Scheduler.unstable_yieldValue('BrokenRender');
      throw new Error('Hello');
    }

    function Foo({unused}) {
      Scheduler.unstable_yieldValue('Foo');
      return null;
    }

    ReactNoop.render(<BrokenRender />);
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');
    ReactNoop.render(<Foo />);
    expect(Scheduler).toHaveYielded([
      'BrokenRender',
      // React retries one more time
      'BrokenRender',
      // Errored again on retry
    ]);
    expect(Scheduler).toFlushAndYield(['Foo']);
  });

  it('can schedule updates after uncaught error in render on update', () => {
    function BrokenRender({shouldThrow}) {
      Scheduler.unstable_yieldValue('BrokenRender');
      if (shouldThrow) {
        throw new Error('Hello');
      }
      return null;
    }

    function Foo({unused}) {
      Scheduler.unstable_yieldValue('Foo');
      return null;
    }

    ReactNoop.render(<BrokenRender shouldThrow={false} />);
    expect(Scheduler).toFlushAndYield(['BrokenRender']);

    expect(() => {
      ReactNoop.render(<BrokenRender shouldThrow={true} />);
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');
    expect(Scheduler).toHaveYielded([
      'BrokenRender',
      // React retries one more time
      'BrokenRender',
      // Errored again on retry
    ]);

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYield(['Foo']);
  });

  it('can schedule updates after uncaught error during unmounting', () => {
    class BrokenComponentWillUnmount extends React.Component {
      render() {
        return <div />;
      }
      componentWillUnmount() {
        throw new Error('Hello');
      }
    }

    function Foo() {
      Scheduler.unstable_yieldValue('Foo');
      return null;
    }

    ReactNoop.render(<BrokenComponentWillUnmount />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(() => {
      ReactNoop.render(<div />);
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('Hello');

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYield(['Foo']);
  });

  // @gate skipUnmountedBoundaries
  it('should not attempt to recover an unmounting error boundary', () => {
    class Parent extends React.Component {
      componentWillUnmount() {
        Scheduler.unstable_yieldValue('Parent componentWillUnmount');
      }
      render() {
        return <Boundary />;
      }
    }

    class Boundary extends React.Component {
      componentDidCatch(e) {
        Scheduler.unstable_yieldValue(`Caught error: ${e.message}`);
      }
      render() {
        return <ThrowsOnUnmount />;
      }
    }

    class ThrowsOnUnmount extends React.Component {
      componentWillUnmount() {
        Scheduler.unstable_yieldValue('ThrowsOnUnmount componentWillUnmount');
        throw new Error('unmount error');
      }
      render() {
        return null;
      }
    }

    ReactNoop.render(<Parent />);
    expect(Scheduler).toFlushWithoutYielding();

    // Because the error boundary is also unmounting,
    // an error in ThrowsOnUnmount should be rethrown.
    expect(() => {
      ReactNoop.render(null);
      expect(Scheduler).toFlushAndYield([
        'Parent componentWillUnmount',
        'ThrowsOnUnmount componentWillUnmount',
      ]);
    }).toThrow('unmount error');

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
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
  });

  it('continues work on other roots despite uncaught errors', () => {
    function BrokenRender(props) {
      throw new Error(props.label);
    }

    ReactNoop.renderToRootWithID(<BrokenRender label="a" />, 'a');
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('a');
    expect(ReactNoop.getChildren('a')).toEqual([]);

    ReactNoop.renderToRootWithID(<BrokenRender label="a" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('a');

    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);

    ReactNoop.renderToRootWithID(<span prop="a:3" />, 'a');
    ReactNoop.renderToRootWithID(<BrokenRender label="b" />, 'b');
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('b');
    expect(ReactNoop.getChildren('a')).toEqual([span('a:3')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);

    ReactNoop.renderToRootWithID(<span prop="a:4" />, 'a');
    ReactNoop.renderToRootWithID(<BrokenRender label="b" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:4" />, 'c');
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('b');
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:4')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:4')]);

    ReactNoop.renderToRootWithID(<span prop="a:5" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:5" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:5" />, 'c');
    ReactNoop.renderToRootWithID(<span prop="d:5" />, 'd');
    ReactNoop.renderToRootWithID(<BrokenRender label="e" />, 'e');
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('e');
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:5')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:5')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:5')]);
    expect(ReactNoop.getChildren('d')).toEqual([span('d:5')]);
    expect(ReactNoop.getChildren('e')).toEqual([]);

    ReactNoop.renderToRootWithID(<BrokenRender label="a" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:6" />, 'b');
    ReactNoop.renderToRootWithID(<BrokenRender label="c" />, 'c');
    ReactNoop.renderToRootWithID(<span prop="d:6" />, 'd');
    ReactNoop.renderToRootWithID(<BrokenRender label="e" />, 'e');
    ReactNoop.renderToRootWithID(<span prop="f:6" />, 'f');

    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('a');
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('c');
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('e');

    expect(Scheduler).toFlushWithoutYielding();
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
    expect(Scheduler).toFlushWithoutYielding();

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
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toErrorDev([
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
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toErrorDev([
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
    expect(() =>
      ReactNoop.render(<InvalidType />),
    ).toErrorDev(
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
    let inst;

    class BrokenRenderAndUnmount extends React.Component {
      state = {fail: false};
      componentWillUnmount() {
        Scheduler.unstable_yieldValue(
          'BrokenRenderAndUnmount componentWillUnmount',
        );
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
        Scheduler.unstable_yieldValue('Parent componentWillUnmount [!]');
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

    expect(Scheduler).toHaveYielded([
      // Attempt to clean up.
      // Errors in parents shouldn't stop children from unmounting.
      'Parent componentWillUnmount [!]',
      'Parent componentWillUnmount [!]',
      'BrokenRenderAndUnmount componentWillUnmount',
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);

    expect(() => {
      ReactNoop.flushSync();
    }).toThrow('One does not simply unmount me.');
  });

  it('does not interrupt unmounting if detaching a ref throws', () => {
    class Bar extends React.Component {
      componentWillUnmount() {
        Scheduler.unstable_yieldValue('Bar unmount');
      }
      render() {
        return <span prop="Bar" />;
      }
    }

    function barRef(inst) {
      if (inst === null) {
        Scheduler.unstable_yieldValue('barRef detach');
        throw new Error('Detach error');
      }
      Scheduler.unstable_yieldValue('barRef attach');
    }

    function Foo(props) {
      return <div>{props.hide ? null : <Bar ref={barRef} />}</div>;
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYield(['barRef attach']);
    expect(ReactNoop.getChildren()).toEqual([div(span('Bar'))]);

    // Unmount
    ReactNoop.render(<Foo hide={true} />);
    expect(Scheduler).toFlushAndThrow('Detach error');
    expect(Scheduler).toHaveYielded([
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

    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        // Should not be called
        Scheduler.unstable_yieldValue('componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          Scheduler.unstable_yieldValue('ErrorBoundary (catch)');
          return (
            <span
              prop={`Caught an error: ${this.state.error.nonStandardMessage}`}
            />
          );
        }
        Scheduler.unstable_yieldValue('ErrorBoundary (try)');
        return this.props.children;
      }
    }

    function Indirection({children}) {
      Scheduler.unstable_yieldValue('Indirection');
      return children;
    }

    const notAnError = {nonStandardMessage: 'oops'};
    function BadRender({unused}) {
      Scheduler.unstable_yieldValue('BadRender');
      throw notAnError;
    }

    ReactNoop.render(
      <ErrorBoundary>
        <Indirection>
          <BadRender />
        </Indirection>
      </ErrorBoundary>,
    );

    expect(Scheduler).toFlushAndYield([
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
        Scheduler.unstable_yieldValue('componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          Scheduler.unstable_yieldValue('ErrorBoundary (catch)');
          return <ErrorMessage error={this.state.error} />;
        }
        Scheduler.unstable_yieldValue('ErrorBoundary (try)');
        return this.props.children;
      }
    }

    function ErrorMessage({error}) {
      Scheduler.unstable_yieldValue('ErrorMessage');
      return <span prop={`Caught an error: ${error.message}`} />;
    }

    function BadRenderSibling({unused}) {
      Scheduler.unstable_yieldValue('BadRenderSibling');
      return null;
    }

    function BadRender({unused}) {
      Scheduler.unstable_yieldValue('throw');
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
    function BadRender({unused}) {
      Scheduler.unstable_yieldValue('throw');
      throw new Error('oops!');
    }

    class Parent extends React.Component {
      state = {error: null, other: false};
      componentDidCatch(error) {
        Scheduler.unstable_yieldValue('did catch');
        this.setState({error});
      }
      componentDidUpdate() {
        Scheduler.unstable_yieldValue('did update');
      }
      render() {
        if (this.state.error) {
          Scheduler.unstable_yieldValue('render error message');
          return <span prop={`Caught an error: ${this.state.error.message}`} />;
        }
        Scheduler.unstable_yieldValue('render');
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
          Scheduler.unstable_yieldValue('render error message');
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
          '    in BrokenRender (at **)\n' +
          '    in ErrorBoundary (at **).',
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

  it('provides component stack even if overriding prepareStackTrace', () => {
    Error.prepareStackTrace = function(error, callsites) {
      const stack = ['An error occurred:', error.message];
      for (let i = 0; i < callsites.length; i++) {
        const callsite = callsites[i];
        stack.push(
          '\t' + callsite.getFunctionName(),
          '\t\tat ' + callsite.getFileName(),
          '\t\ton line ' + callsite.getLineNumber(),
        );
      }

      return stack.join('\n');
    };

    class ErrorBoundary extends React.Component {
      state = {error: null, errorInfo: null};
      componentDidCatch(error, errorInfo) {
        this.setState({error, errorInfo});
      }
      render() {
        if (this.state.errorInfo) {
          Scheduler.unstable_yieldValue('render error message');
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
    Error.prepareStackTrace = undefined;

    expect(ReactNoop.getChildren()).toEqual([
      span(
        'Caught an error:\n' +
          '    in BrokenRender (at **)\n' +
          '    in ErrorBoundary (at **).',
      ),
    ]);
  });

  if (!ReactFeatureFlags.disableModulePatternComponents) {
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
      }).toErrorDev([
        'Warning: The <Provider /> component appears to be a function component that returns a class instance. ' +
          'Change Provider to a class that extends React.Component instead. ' +
          "If you can't use a class try assigning the prototype on the function as a workaround. " +
          '`Provider.prototype = React.Component.prototype`. ' +
          "Don't use an arrow function since it cannot be called with `new` by React.",
      ]);
    });
  }

  it('uncaught errors should be discarded if the render is aborted', async () => {
    const root = ReactNoop.createRoot();

    function Oops({unused}) {
      Scheduler.unstable_yieldValue('Oops');
      throw Error('Oops');
    }

    await act(async () => {
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        React.startTransition(() => {
          root.render(<Oops />);
        });
      } else {
        root.render(<Oops />);
      }

      // Render past the component that throws, then yield.
      expect(Scheduler).toFlushAndYieldThrough(['Oops']);
      expect(root).toMatchRenderedOutput(null);
      // Interleaved update. When the root completes, instead of throwing the
      // error, it should try rendering again. This update will cause it to
      // recover gracefully.
      React.startTransition(() => {
        root.render('Everything is fine.');
      });
    });

    // Should finish without throwing.
    expect(root).toMatchRenderedOutput('Everything is fine.');
  });

  it('uncaught errors are discarded if the render is aborted, case 2', async () => {
    const {useState} = React;
    const root = ReactNoop.createRoot();

    let setShouldThrow;
    function Oops() {
      const [shouldThrow, _setShouldThrow] = useState(false);
      setShouldThrow = _setShouldThrow;
      if (shouldThrow) {
        throw Error('Oops');
      }
      return null;
    }

    function AllGood() {
      Scheduler.unstable_yieldValue('Everything is fine.');
      return 'Everything is fine.';
    }

    await act(async () => {
      root.render(<Oops />);
    });

    await act(async () => {
      // Schedule a default pri and a low pri update on the root.
      root.render(<Oops />);
      React.startTransition(() => {
        root.render(<AllGood />);
      });

      // Render through just the default pri update. The low pri update remains on
      // the queue.
      expect(Scheduler).toFlushAndYieldThrough(['Everything is fine.']);

      // Schedule a discrete update on a child that triggers an error.
      // The root should capture this error. But since there's still a pending
      // update on the root, the error should be suppressed.
      ReactNoop.discreteUpdates(() => {
        setShouldThrow(true);
      });
    });
    // Should render the final state without throwing the error.
    expect(Scheduler).toHaveYielded(['Everything is fine.']);
    expect(root).toMatchRenderedOutput('Everything is fine.');
  });

  it("does not infinite loop if there's a render phase update in the same render as an error", async () => {
    // Some React features may schedule a render phase update as an
    // implementation detail. When an error is accompanied by a render phase
    // update, we assume that it comes from React internals, because render
    // phase updates triggered from userspace are not allowed (we log a
    // warning). So we keep attempting to recover until no more opaque
    // identifiers need to be upgraded. However, we should give up after some
    // point to prevent an infinite loop in the case where there is (by
    // accident) a render phase triggered from userspace.

    spyOnDev(console, 'error');

    let numberOfThrows = 0;

    let setStateInRenderPhase;
    function Child() {
      const [, setState] = React.useState(0);
      setStateInRenderPhase = setState;
      return 'All good';
    }

    function App({shouldThrow}) {
      if (shouldThrow) {
        setStateInRenderPhase();
        numberOfThrows++;
        throw new Error('Oops!');
      }
      return <Child />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App shouldThrow={false} />);
    });
    expect(root).toMatchRenderedOutput('All good');

    let error;
    try {
      await act(async () => {
        root.render(<App shouldThrow={true} />);
      });
    } catch (e) {
      error = e;
    }

    expect(error.message).toBe('Oops!');
    expect(numberOfThrows < 100).toBe(true);

    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(2);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Cannot update a component (`%s`) while rendering a different component',
      );
      expect(console.error.calls.argsFor(1)[0]).toContain(
        'The above error occurred in the <App> component',
      );
    }
  });

  if (global.__PERSISTENT__) {
    it('regression test: should fatal if error is thrown at the root', () => {
      const root = ReactNoop.createRoot();
      root.render('Error when completing root');
      expect(Scheduler).toFlushAndThrow('Error when completing root');
    });
  }
});
