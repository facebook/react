/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactNoop;

describe('ReactIncrementalErrorHandling', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactNoop = require('ReactNoop');
  });

  function div(...children) {
    children = children.map(c => typeof c === 'string' ? { text: c } : c);
    return { type: 'div', children, prop: undefined };
  }

  function span(prop) {
    return { type: 'span', children: [], prop };
  }

  it('catches render error in a boundary during mounting', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      unstable_handleError(error) {
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          return <span prop={`Caught an error: ${this.state.error.message}.`} />;
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
      </ErrorBoundary>
    );
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span('Caught an error: Hello.')]);
  });

  it('propagates an error from a noop error boundary', () => {
    class NoopBoundary extends React.Component {
      unstable_handleError() {
        // Noop
      }
      render() {
        return this.props.children;
      }
    }

    function RenderError() {
      throw new Error('render error');
    }

    ReactNoop.render(
      <NoopBoundary>
        <RenderError />
      </NoopBoundary>
    );

    expect(ReactNoop.flush).toThrow('render error');
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

  it('continues work on other roots despite caught errors', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      unstable_handleError(error) {
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          return <span prop={`Caught an error: ${this.state.error.message}.`} />;
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
      'a'
    );
    ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    ReactNoop.flush();
    expect(ReactNoop.getChildren('a')).toEqual([span('Caught an error: Hello.')]);
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
    // Currently we assume previous tree stays intact for fataled trees.
    // We may consider tearing it down in the future.
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);

    ReactNoop.renderToRootWithID(<span prop="a:4" />, 'a');
    ReactNoop.renderToRootWithID(<BrokenRender />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:4" />, 'c');
    expect(() => {
      ReactNoop.flush();
    }).toThrow('Hello');
    expect(ReactNoop.getChildren('a')).toEqual([span('a:4')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
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
    expect(ReactNoop.getChildren('a')).toEqual([span('a:5')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:6')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:5')]);
    expect(ReactNoop.getChildren('d')).toEqual([span('d:6')]);
    expect(ReactNoop.getChildren('e')).toEqual([]);
    expect(ReactNoop.getChildren('f')).toEqual([span('f:6')]);

    ReactNoop.unmountRootWithID('a');
    ReactNoop.unmountRootWithID('b');
    ReactNoop.unmountRootWithID('c');
    ReactNoop.unmountRootWithID('d');
    ReactNoop.unmountRootWithID('e');
    ReactNoop.unmountRootWithID('f');
    expect(ReactNoop.getChildren('a')).toEqual(null);
    expect(ReactNoop.getChildren('b')).toEqual(null);
    expect(ReactNoop.getChildren('c')).toEqual(null);
    expect(ReactNoop.getChildren('d')).toEqual(null);
    expect(ReactNoop.getChildren('e')).toEqual(null);
    expect(ReactNoop.getChildren('f')).toEqual(null);
  });

  it('force unmounts failed subtree before rerendering', () => {
    var ops = [];
    var barInstance;

    class ErrorBoundary extends React.Component {
      state = {error: null};
      unstable_handleError(error) {
        ops.push('handle error');
        this.setState({error});
      }
      // Shouldn't fire
      componentWillUnmount() {
        ops.push('ErrorBoundary unmount');
      }
      render() {
        ops.push('ErrorBoundary render');
        return (
          <div>
            <Foo />
            {this.state.error ?
              <span prop={`Caught an error: ${this.state.error.message}.`} /> :
              <Bar />
            }
          </div>
        );
      }
    }

    class Foo extends React.Component {
      componentWillUnmount() {
        ops.push('Foo unmount');
      }
      render() {
        ops.push('Foo render');
        return <span prop="foo" />;
      }
    }

    class Bar extends React.Component {
      state = { fail: false };
      componentWillUnmount() {
        ops.push('Bar unmount');
        throw new Error('should ignore unmount error');
      }
      render() {
        barInstance = this;
        ops.push('Bar render');
        if (this.state.fail) {
          ops.push('Bar error');
          throw new Error('Render error');
        }
        return <span prop="bar" />;
      }
    }


    ReactNoop.render(
      <ErrorBoundary />
    );
    ReactNoop.flush();

    expect(ops).toEqual([
      'ErrorBoundary render',
      'Foo render',
      'Bar render',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span('foo'),
        span('bar')
      ),
    ]);

    ops = [];
    barInstance.setState({ fail: true });
    ReactNoop.flush();

    expect(ops).toEqual([
      'Bar render',
      'Bar error',
      'handle error',
      'ErrorBoundary render',
      'Foo render',
      // Foo should be force unmounted. If it's not, that means ErrorBoundary is
      // incorrectly reusing the old, failed tree.
      'Foo unmount',
      'Bar unmount',
    ]);

    expect(ReactNoop.getChildren()).toEqual([
      div(
        span('foo'),
        span('Caught an error: Render error.'),
      ),
    ]);
  });

  it('force unmounts failed subtree before rerendering (fragment)', () => {
    var ops = [];
    var barInstance;

    class ErrorBoundary extends React.Component {
      state = {error: null};
      unstable_handleError(error) {
        ops.push('handle error');
        this.setState({error});
      }
      // Shouldn't fire
      componentWillUnmount() {
        ops.push('ErrorBoundary unmount');
      }
      render() {
        ops.push('ErrorBoundary render');
        return [
          <Foo />,
          this.state.error ?
            <span prop={`Caught an error: ${this.state.error.message}.`} /> :
            <Bar />,
        ];
      }
    }

    class Foo extends React.Component {
      componentWillUnmount() {
        ops.push('Foo unmount');
      }
      render() {
        ops.push('Foo render');
        return <span prop="foo" />;
      }
    }

    class Bar extends React.Component {
      state = { fail: false };
      componentWillUnmount() {
        ops.push('Bar unmount');
        throw new Error('should ignore unmount error');
      }
      render() {
        barInstance = this;
        ops.push('Bar render');
        if (this.state.fail) {
          ops.push('Bar error');
          throw new Error('Render error');
        }
        return <span prop="bar" />;
      }
    }


    ReactNoop.render(
      <ErrorBoundary />
    );
    ReactNoop.flush();

    expect(ops).toEqual([
      'ErrorBoundary render',
      'Foo render',
      'Bar render',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('foo'),
      span('bar'),
    ]);

    ops = [];
    barInstance.setState({ fail: true });
    ReactNoop.flush();

    expect(ops).toEqual([
      'Bar render',
      'Bar error',
      'handle error',
      'ErrorBoundary render',
      'Foo render',
      // Foo should be force unmounted. If it's not, that means ErrorBoundary is
      // incorrectly reusing the old, failed tree.
      'Foo unmount',
      'Bar unmount',
    ]);

    expect(ReactNoop.getChildren()).toEqual([
      span('foo'),
      span('Caught an error: Render error.'),
    ]);
  });

  it('force unmounts failed root', () => {
    var ops = [];
    var barInstance;

    function Parent(props) {
      ops.push('Parent render');
      return (
        <div>
          <Foo step={props.step} />
          <Bar />
        </div>
      );
    }

    class Foo extends React.Component {
      componentWillUnmount() {
        ops.push('Foo unmount');
      }
      render() {
        ops.push('Foo render');
        return <span prop={'foo:' + this.props.step} />;
      }
    }

    class Bar extends React.Component {
      state = { fail: false };
      componentWillUnmount() {
        ops.push('Bar unmount');
        throw new Error('should ignore unmount error');
      }
      render() {
        barInstance = this;
        ops.push('Bar render');
        if (this.state.fail) {
          ops.push('Bar error');
          throw new Error('Render error');
        }
        return <span prop="bar" />;
      }
    }


    ReactNoop.render(<Parent step="1" />);
    ReactNoop.flush();
    const barInstance1 = barInstance;

    expect(ops).toEqual([
      'Parent render',
      'Foo render',
      'Bar render',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span('foo:1'),
        span('bar')
      ),
    ]);

    ops = [];
    barInstance.setState({ fail: true });
    expect(() => ReactNoop.flush()).toThrow('Render error');

    expect(ops).toEqual([
      'Bar render',
      'Bar error',
      // Foo and Bar should be soft unmounted
      'Foo unmount',
      'Bar unmount',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span('foo:1'),
        span('bar')
      ),
    ]);

    ops = [];
    ReactNoop.render(<Parent step="2" />);
    ReactNoop.flush();
    const barInstance2 = barInstance;

    expect(ops).toEqual([
      'Parent render',
      'Foo render',
      'Bar render',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span('foo:2'),
        span('bar')
      ),
    ]);

    expect(barInstance1 !== barInstance2).toEqual(true);
  });
});
