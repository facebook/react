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

  it('catches reconciler errors in a boundary during mounting', () => {
    spyOn(console, 'error');

    class ErrorBoundary extends React.Component {
      state = {error: null};
      unstable_handleError(error) {
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
    const brokenElement = <InvalidType />;
    function BrokenRender(props) {
      return brokenElement;
    }

    ReactNoop.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>
    );
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span(
      'Element type is invalid: expected a string (for built-in components) or ' +
      'a class/function (for composite components) but got: undefined.'
    )]);
    expect(console.error.calls.count()).toBe(1);
  });

  it('catches reconciler errors in a boundary during update', () => {
    spyOn(console, 'error');

    class ErrorBoundary extends React.Component {
      state = {error: null};
      unstable_handleError(error) {
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
    const brokenElement = <InvalidType />;
    function BrokenRender(props) {
      return props.fail ? brokenElement : <span />;
    }

    ReactNoop.render(
      <ErrorBoundary>
        <BrokenRender fail={false} />
      </ErrorBoundary>
    );
    ReactNoop.flush();

    ReactNoop.render(
      <ErrorBoundary>
        <BrokenRender fail={true} />
      </ErrorBoundary>
    );
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span(
      'Element type is invalid: expected a string (for built-in components) or ' +
      'a class/function (for composite components) but got: undefined.'
    )]);
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
      'a class/function (for composite components) but got: undefined.'
    );

    ReactNoop.render(<span prop="hi" />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span('hi')]);
  });
});
