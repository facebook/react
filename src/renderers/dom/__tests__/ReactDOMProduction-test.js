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

describe('ReactDOMProduction', () => {
  var oldProcess;

  var React;
  var ReactDOM;

  beforeEach(() => {
    __DEV__ = false;
    oldProcess = process;
    global.process = {env: {NODE_ENV: 'production'}};

    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
  });

  afterEach(() => {
    __DEV__ = true;
    global.process = oldProcess;
  });

  it('should use prod fbjs', () => {
    var warning = require('warning');

    spyOn(console, 'error');
    warning(false, 'Do cows go moo?');
    expect(console.error.calls.count()).toBe(0);
  });

  it('should use prod React', () => {
    spyOn(console, 'error');

    // no key warning
    void <div>{[<span />]}</div>;

    expect(console.error.calls.count()).toBe(0);
  });

  it('should handle a simple flow', () => {
    class Component extends React.Component {
      render() {
        return <span>{this.props.children}</span>;
      }
    }

    var container = document.createElement('div');
    var inst = ReactDOM.render(
      <div className="blue">
        <Component key={1}>A</Component>
        <Component key={2}>B</Component>
        <Component key={3}>C</Component>
      </div>,
      container,
    );

    expect(container.firstChild).toBe(inst);
    expect(inst.className).toBe('blue');
    expect(inst.textContent).toBe('ABC');

    ReactDOM.render(
      <div className="red">
        <Component key={2}>B</Component>
        <Component key={1}>A</Component>
        <Component key={3}>C</Component>
      </div>,
      container,
    );

    expect(inst.className).toBe('red');
    expect(inst.textContent).toBe('BAC');

    ReactDOM.unmountComponentAtNode(container);

    expect(container.childNodes.length).toBe(0);
  });

  it('should call lifecycle methods', () => {
    var log = [];
    class Component extends React.Component {
      state = {y: 1};
      shouldComponentUpdate(nextProps, nextState) {
        log.push(['shouldComponentUpdate', nextProps, nextState]);
        return nextProps.x !== this.props.x || nextState.y !== this.state.y;
      }
      componentWillMount() {
        log.push(['componentWillMount']);
      }
      componentDidMount() {
        log.push(['componentDidMount']);
      }
      componentWillReceiveProps(nextProps) {
        log.push(['componentWillReceiveProps', nextProps]);
      }
      componentWillUpdate(nextProps, nextState) {
        log.push(['componentWillUpdate', nextProps, nextState]);
      }
      componentDidUpdate(prevProps, prevState) {
        log.push(['componentDidUpdate', prevProps, prevState]);
      }
      componentWillUnmount() {
        log.push(['componentWillUnmount']);
      }
      render() {
        log.push(['render']);
        return null;
      }
    }

    var container = document.createElement('div');
    var inst = ReactDOM.render(<Component x={1} />, container);
    expect(log).toEqual([
      ['componentWillMount'],
      ['render'],
      ['componentDidMount'],
    ]);
    log = [];

    inst.setState({y: 2});
    expect(log).toEqual([
      ['shouldComponentUpdate', {x: 1}, {y: 2}],
      ['componentWillUpdate', {x: 1}, {y: 2}],
      ['render'],
      ['componentDidUpdate', {x: 1}, {y: 1}],
    ]);
    log = [];

    inst.setState({y: 2});
    expect(log).toEqual([['shouldComponentUpdate', {x: 1}, {y: 2}]]);
    log = [];

    ReactDOM.render(<Component x={2} />, container);
    expect(log).toEqual([
      ['componentWillReceiveProps', {x: 2}],
      ['shouldComponentUpdate', {x: 2}, {y: 2}],
      ['componentWillUpdate', {x: 2}, {y: 2}],
      ['render'],
      ['componentDidUpdate', {x: 1}, {y: 2}],
    ]);
    log = [];

    ReactDOM.render(<Component x={2} />, container);
    expect(log).toEqual([
      ['componentWillReceiveProps', {x: 2}],
      ['shouldComponentUpdate', {x: 2}, {y: 2}],
    ]);
    log = [];

    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([['componentWillUnmount']]);
  });

  it('should throw with an error code in production', () => {
    expect(function() {
      class Component extends React.Component {
        render() {
          return ['this is wrong'];
        }
      }

      var container = document.createElement('div');
      ReactDOM.render(<Component />, container);
    }).toThrowError(
      'Minified React error #109; visit ' +
        'http://facebook.github.io/react/docs/error-decoder.html?invariant=109&args[]=Component' +
        ' for the full message or use the non-minified dev environment' +
        ' for full errors and additional helpful warnings.',
    );
  });
});
