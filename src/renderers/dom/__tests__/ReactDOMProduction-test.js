/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */
'use strict';

describe('ReactDOMProduction', () => {
  var React;
  var ReactDOM;
  var ReactDOMServer;
  var oldProcess;

  beforeEach(() => {
    __DEV__ = false;

    // Mutating process.env.NODE_ENV would cause our babel plugins to do the
    // wrong thing. If you change this, make sure to test with jest --no-cache.
    oldProcess = process;
    global.process = {
      ...process,
      env: {...process.env, NODE_ENV: 'production'},
    };

    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
  });

  afterEach(() => {
    __DEV__ = true;
    global.process = oldProcess;
  });

  it('should use prod fbjs', () => {
    var warning = require('fbjs/lib/warning');

    spyOn(console, 'error');
    warning(false, 'Do cows go moo?');
    expectDev(console.error.calls.count()).toBe(0);
  });

  it('should use prod React', () => {
    spyOn(console, 'error');

    // no key warning
    void <div>{[<span />]}</div>;

    expectDev(console.error.calls.count()).toBe(0);
  });

  it('should handle a simple flow', () => {
    class Component extends React.Component {
      render() {
        return <span>{this.props.children}</span>;
      }
    }

    var container = document.createElement('div');
    var inst = ReactDOM.render(
      <div className="blue" style={{fontFamily: 'Helvetica'}}>
        <Component key={1}>A</Component>
        <Component key={2}>B</Component>
        <Component key={3}>C</Component>
      </div>,
      container,
    );

    expect(container.firstChild).toBe(inst);
    expect(inst.className).toBe('blue');
    expect(inst.style.fontFamily).toBe('Helvetica');
    expect(inst.textContent).toBe('ABC');

    ReactDOM.render(
      <div className="red" style={{fontFamily: 'Comic Sans MS'}}>
        <Component key={2}>B</Component>
        <Component key={1}>A</Component>
        <Component key={3}>C</Component>
      </div>,
      container,
    );

    expect(inst.className).toBe('red');
    expect(inst.style.fontFamily).toBe('Comic Sans MS');
    expect(inst.textContent).toBe('BAC');

    ReactDOM.unmountComponentAtNode(container);

    expect(container.childNodes.length).toBe(0);
  });

  it('should handle a simple flow (ssr)', () => {
    class Component extends React.Component {
      render() {
        return <span>{this.props.children}</span>;
      }
    }

    var container = document.createElement('div');
    var markup = ReactDOMServer.renderToString(
      <div className="blue" style={{fontFamily: 'Helvetica'}}>
        <Component key={1}>A</Component>
        <Component key={2}>B</Component>
        <Component key={3}>C</Component>
      </div>,
      container,
    );
    container.innerHTML = markup;
    var inst = container.firstChild;

    expect(inst.className).toBe('blue');
    expect(inst.style.fontFamily).toBe('Helvetica');
    expect(inst.textContent).toBe('ABC');
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
    const errorCode = 152;
    expect(function() {
      class Component extends React.Component {
        render() {
          return undefined;
        }
      }

      var container = document.createElement('div');
      ReactDOM.render(<Component />, container);
    }).toThrowError(
      `Minified React error #${errorCode}; visit ` +
        `http://facebook.github.io/react/docs/error-decoder.html?invariant=${errorCode}&args[]=Component` +
        ' for the full message or use the non-minified dev environment' +
        ' for full errors and additional helpful warnings.',
    );
  });

  it('should not crash with devtools installed', () => {
    try {
      global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        inject: function() {},
        onCommitFiberRoot: function() {},
        onCommitFiberUnmount: function() {},
        supportsFiber: true,
      };
      jest.resetModules();
      React = require('react');
      ReactDOM = require('react-dom');
      class Component extends React.Component {
        render() {
          return <div />;
        }
      }
      ReactDOM.render(<Component />, document.createElement('container'));
    } finally {
      global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
    }
  });

  // This test is originally from ReactDOMFiber-test but we replicate it here
  // to avoid production-only regressions because of host context differences
  // in dev and prod.
  it('should keep track of namespace across portals in production', () => {
    var svgEls, htmlEls;
    var expectSVG = {ref: el => svgEls.push(el)};
    var expectHTML = {ref: el => htmlEls.push(el)};
    var usePortal = function(tree) {
      return ReactDOM.createPortal(tree, document.createElement('div'));
    };
    var assertNamespacesMatch = function(tree) {
      var container = document.createElement('div');
      svgEls = [];
      htmlEls = [];
      ReactDOM.render(tree, container);
      svgEls.forEach(el => {
        expect(el.namespaceURI).toBe('http://www.w3.org/2000/svg');
      });
      htmlEls.forEach(el => {
        expect(el.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
      });
      ReactDOM.unmountComponentAtNode(container);
      expect(container.innerHTML).toBe('');
    };

    assertNamespacesMatch(
      <div {...expectHTML}>
        <svg {...expectSVG}>
          <foreignObject {...expectSVG}>
            <p {...expectHTML} />
            {usePortal(
              <svg {...expectSVG}>
                <image {...expectSVG} />
                <svg {...expectSVG}>
                  <image {...expectSVG} />
                  <foreignObject {...expectSVG}>
                    <p {...expectHTML} />
                  </foreignObject>
                  {usePortal(<p {...expectHTML} />)}
                </svg>
                <image {...expectSVG} />
              </svg>,
            )}
            <p {...expectHTML} />
          </foreignObject>
          <image {...expectSVG} />
        </svg>
        <p {...expectHTML} />
      </div>,
    );
  });
});
