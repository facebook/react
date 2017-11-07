/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var PropTypes;
var React;
var ReactNoop;

describe('ReactIncrementalErrorHandling', () => {
  beforeEach(() => {
    jest.resetModules();
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
    var ops = [];
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

    ReactNoop.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
    );

    ReactNoop.flushDeferredPri(15);
    expect(ops).toEqual(['ErrorBoundary render success']);
    expect(ReactNoop.getChildren()).toEqual([]);

    ops.length = 0;
    ReactNoop.flushDeferredPri(30);
    expect(ops).toEqual([
      'BrokenRender',
      'ErrorBoundary componentDidCatch',
      'ErrorBoundary render error',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: Hello.')]);
  });

  it('catches render error in a boundary during synchronous mounting', () => {
    var ops = [];
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
      'ErrorBoundary componentDidCatch',
      'ErrorBoundary render error',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: Hello.')]);
  });

  it('catches render error in a boundary during batched mounting', () => {
    var ops = [];
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
      'ErrorBoundary componentDidCatch',
      'ErrorBoundary render error',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: Hello.')]);
  });

  it('propagates an error from a noop error boundary during full deferred mounting', () => {
    var ops = [];
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
      'RethrowErrorBoundary componentDidCatch',
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('propagates an error from a noop error boundary during partial deferred mounting', () => {
    var ops = [];
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
      'RethrowErrorBoundary componentDidCatch',
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('propagates an error from a noop error boundary during synchronous mounting', () => {
    var ops = [];
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
      'RethrowErrorBoundary componentDidCatch',
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('propagates an error from a noop error boundary during batched mounting', () => {
    var ops = [];
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
    var ops = [];

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
    expect(ops).toEqual(['BrokenRender']);

    ops = [];
    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ops).toEqual(['Foo']);
  });

  it('can schedule updates after uncaught error in render on update', () => {
    var ops = [];

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
    expect(ops).toEqual(['BrokenRender']);

    ops = [];
    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ops).toEqual(['Foo']);
  });

  it('can schedule updates after uncaught error during umounting', () => {
    var ops = [];

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
    spyOn(console, 'error');

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
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      span(
        'Element type is invalid: expected a string (for built-in components) or ' +
          'a class/function (for composite components) but got: undefined. ' +
          "You likely forgot to export your component from the file it's " +
          'defined in.\n\nCheck the render method of `BrokenRender`.',
      ),
    ]);
    expect(console.error.calls.count()).toBe(1);
  });

  it('catches reconciler errors in a boundary during update', () => {
    spyOn(console, 'error');

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
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      span(
        'Element type is invalid: expected a string (for built-in components) or ' +
          'a class/function (for composite components) but got: undefined. ' +
          "You likely forgot to export your component from the file it's " +
          'defined in.\n\nCheck the render method of `BrokenRender`.',
      ),
    ]);
    expect(console.error.calls.count()).toBe(1);
  });

  it('recovers from uncaught reconciler errors', () => {
    spyOn(console, 'error');
    const InvalidType = undefined;
    ReactNoop.render(<InvalidType />);
    expect(() => {
      ReactNoop.flush();
    }).toThrowError(
      'Element type is invalid: expected a string (for built-in components) or ' +
        'a class/function (for composite components) but got: undefined. ' +
        "You likely forgot to export your component from the file it's " +
        'defined in.',
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
    var ops = [];

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
    ReactNoop.simulateErrorInHostConfig(() => {
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

  describe('ReactFiberErrorLogger', () => {
    function initReactFiberErrorLoggerMock(mock) {
      jest.resetModules();
      if (mock) {
        jest.mock('../ReactFiberErrorLogger');
      } else {
        jest.unmock('../ReactFiberErrorLogger');
      }
      React = require('react');
      ReactNoop = require('react-noop-renderer');
    }

    function normalizeCodeLocInfo(str) {
      return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
    }

    it('should log errors that occur during the begin phase', () => {
      initReactFiberErrorLoggerMock();
      spyOn(console, 'error');

      class ErrorThrowingComponent extends React.Component {
        componentWillMount() {
          throw Error('componentWillMount error');
        }
        render() {
          return <div />;
        }
      }

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

      expect(console.error.calls.count()).toBe(1);
      const errorMessage = console.error.calls.argsFor(0)[0];
      expect(normalizeCodeLocInfo(errorMessage)).toContain(
        'The above error occurred in the <ErrorThrowingComponent> component:\n' +
          '    in ErrorThrowingComponent (at **)\n' +
          '    in span (at **)\n' +
          '    in div (at **)',
      );
      expect(errorMessage).toContain(
        'Consider adding an error boundary to your tree to customize error handling behavior.',
      );
    });

    it('should log errors that occur during the commit phase', () => {
      initReactFiberErrorLoggerMock();
      spyOn(console, 'error');

      class ErrorThrowingComponent extends React.Component {
        componentDidMount() {
          throw Error('componentDidMount error');
        }
        render() {
          return <div />;
        }
      }

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

      expect(console.error.calls.count()).toBe(1);
      const errorMessage = console.error.calls.argsFor(0)[0];
      expect(normalizeCodeLocInfo(errorMessage)).toContain(
        'The above error occurred in the <ErrorThrowingComponent> component:\n' +
          '    in ErrorThrowingComponent (at **)\n' +
          '    in span (at **)\n' +
          '    in div (at **)',
      );
      expect(errorMessage).toContain(
        'Consider adding an error boundary to your tree to customize error handling behavior.',
      );
    });

    it('should ignore errors thrown in log method to prevent cycle', () => {
      initReactFiberErrorLoggerMock(true);
      spyOn(console, 'error');

      class ErrorThrowingComponent extends React.Component {
        render() {
          throw Error('render error');
        }
      }

      const logCapturedErrorCalls = [];

      const ReactFiberErrorLogger = require('../ReactFiberErrorLogger');
      ReactFiberErrorLogger.logCapturedError.mockImplementation(
        capturedError => {
          logCapturedErrorCalls.push(capturedError);
          throw Error('logCapturedError error');
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
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0].message).toContain(
        'logCapturedError error',
      );
    });

    it('should relay info about error boundary and retry attempts if applicable', () => {
      initReactFiberErrorLoggerMock();
      spyOn(console, 'error');

      class ParentComponent extends React.Component {
        render() {
          return <ErrorBoundaryComponent />;
        }
      }

      let handleErrorCalls = [];
      let renderAttempts = 0;

      class ErrorBoundaryComponent extends React.Component {
        componentDidCatch(error) {
          handleErrorCalls.push(error);
          this.setState({}); // Render again
        }
        render() {
          return <ErrorThrowingComponent />;
        }
      }

      class ErrorThrowingComponent extends React.Component {
        componentDidMount() {
          throw Error('componentDidMount error');
        }
        render() {
          renderAttempts++;
          return <div />;
        }
      }

      try {
        ReactNoop.render(<ParentComponent />);
        ReactNoop.flush();
      } catch (error) {}

      expect(renderAttempts).toBe(2);
      expect(handleErrorCalls.length).toBe(1);
      expect(console.error.calls.count()).toBe(2);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'The above error occurred in the <ErrorThrowingComponent> component:',
      );
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'React will try to recreate this component tree from scratch ' +
          'using the error boundary you provided, ErrorBoundaryComponent.',
      );
      expect(console.error.calls.argsFor(1)[0]).toContain(
        'The above error occurred in the <ErrorThrowingComponent> component:',
      );
      expect(console.error.calls.argsFor(1)[0]).toContain(
        'This error was initially handled by the error boundary ErrorBoundaryComponent.\n' +
          'Recreating the tree from scratch failed so React will unmount the tree.',
      );
    });
  });

  it('resets instance variables before unmounting failed node', () => {
    spyOn(console, 'error');

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
