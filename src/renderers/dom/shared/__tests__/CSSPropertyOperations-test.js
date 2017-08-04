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

var React = require('react');
var ReactDOM = require('react-dom');
var ReactDOMServer = require('react-dom/server');

describe('CSSPropertyOperations', () => {
  it('should automatically append `px` to relevant styles', () => {
    var styles = {
      left: 0,
      margin: 16,
      opacity: 0.5,
      padding: '4px',
    };
    var div = <div style={styles} />;
    var html = ReactDOMServer.renderToString(div);
    expect(html).toContain('"left:0;margin:16px;opacity:0.5;padding:4px"');
  });

  it('should trim values', () => {
    var styles = {
      left: '16 ',
      opacity: 0.5,
      right: ' 4 ',
    };
    var div = <div style={styles} />;
    var html = ReactDOMServer.renderToString(div);
    expect(html).toContain('"left:16;opacity:0.5;right:4"');
  });

  it('should not append `px` to styles that might need a number', () => {
    var styles = {
      flex: 0,
      opacity: 0.5,
    };
    var div = <div style={styles} />;
    var html = ReactDOMServer.renderToString(div);
    expect(html).toContain('"flex:0;opacity:0.5"');
  });

  it('should create vendor-prefixed markup correctly', () => {
    var styles = {
      msTransition: 'none',
      MozTransition: 'none',
    };
    var div = <div style={styles} />;
    var html = ReactDOMServer.renderToString(div);
    expect(html).toContain('"-ms-transition:none;-moz-transition:none"');
  });

  it('should set style attribute when styles exist', () => {
    var styles = {
      backgroundColor: '#000',
      display: 'none',
    };
    var div = <div style={styles} />;
    var root = document.createElement('div');
    div = ReactDOM.render(div, root);
    expect(/style=".*"/.test(root.innerHTML)).toBe(true);
  });

  it('should not set style attribute when no styles exist', () => {
    var styles = {
      backgroundColor: null,
      display: null,
    };
    var div = <div style={styles} />;
    var html = ReactDOMServer.renderToString(div);
    expect(/style=/.test(html)).toBe(false);
  });

  it('should warn when using hyphenated style names', () => {
    class Comp extends React.Component {
      static displayName = 'Comp';

      render() {
        return <div style={{'background-color': 'crimson'}} />;
      }
    }

    spyOn(console, 'error');
    var root = document.createElement('div');
    ReactDOM.render(<Comp />, root);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toEqual(
      'Warning: Unsupported style property background-color. Did you mean backgroundColor?' +
        '\n\nCheck the render method of `Comp`.',
    );
  });

  it('should warn when updating hyphenated style names', () => {
    class Comp extends React.Component {
      static displayName = 'Comp';

      render() {
        return <div style={this.props.style} />;
      }
    }

    spyOn(console, 'error');
    var styles = {
      '-ms-transform': 'translate3d(0, 0, 0)',
      '-webkit-transform': 'translate3d(0, 0, 0)',
    };
    var root = document.createElement('div');
    ReactDOM.render(<Comp />, root);
    ReactDOM.render(<Comp style={styles} />, root);

    expectDev(console.error.calls.count()).toBe(2);
    expectDev(console.error.calls.argsFor(0)[0]).toEqual(
      'Warning: Unsupported style property -ms-transform. Did you mean msTransform?' +
        '\n\nCheck the render method of `Comp`.',
    );
    expectDev(console.error.calls.argsFor(1)[0]).toEqual(
      'Warning: Unsupported style property -webkit-transform. Did you mean WebkitTransform?' +
        '\n\nCheck the render method of `Comp`.',
    );
  });

  it('warns when miscapitalizing vendored style names', () => {
    class Comp extends React.Component {
      static displayName = 'Comp';

      render() {
        return (
          <div
            style={{
              msTransform: 'translate3d(0, 0, 0)',
              oTransform: 'translate3d(0, 0, 0)',
              webkitTransform: 'translate3d(0, 0, 0)',
            }}
          />
        );
      }
    }

    spyOn(console, 'error');
    var root = document.createElement('div');
    ReactDOM.render(<Comp />, root);
    // msTransform is correct already and shouldn't warn
    expectDev(console.error.calls.count()).toBe(2);
    expectDev(console.error.calls.argsFor(0)[0]).toEqual(
      'Warning: Unsupported vendor-prefixed style property oTransform. ' +
        'Did you mean OTransform?\n\nCheck the render method of `Comp`.',
    );
    expectDev(console.error.calls.argsFor(1)[0]).toEqual(
      'Warning: Unsupported vendor-prefixed style property webkitTransform. ' +
        'Did you mean WebkitTransform?\n\nCheck the render method of `Comp`.',
    );
  });

  it('should warn about style having a trailing semicolon', () => {
    class Comp extends React.Component {
      static displayName = 'Comp';

      render() {
        return (
          <div
            style={{
              fontFamily: 'Helvetica, arial',
              backgroundImage: 'url(foo;bar)',
              backgroundColor: 'blue;',
              color: 'red;   ',
            }}
          />
        );
      }
    }

    spyOn(console, 'error');
    var root = document.createElement('div');
    ReactDOM.render(<Comp />, root);
    expectDev(console.error.calls.count()).toBe(2);
    expectDev(console.error.calls.argsFor(0)[0]).toEqual(
      "Warning: Style property values shouldn't contain a semicolon." +
        '\n\nCheck the render method of `Comp`. Try "backgroundColor: blue" instead.',
    );
    expectDev(console.error.calls.argsFor(1)[0]).toEqual(
      "Warning: Style property values shouldn't contain a semicolon." +
        '\n\nCheck the render method of `Comp`. Try "color: red" instead.',
    );
  });

  it('should warn about style containing a NaN value', () => {
    class Comp extends React.Component {
      static displayName = 'Comp';

      render() {
        return <div style={{fontSize: NaN}} />;
      }
    }

    spyOn(console, 'error');
    var root = document.createElement('div');
    ReactDOM.render(<Comp />, root);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toEqual(
      'Warning: `NaN` is an invalid value for the `fontSize` css style property.' +
        '\n\nCheck the render method of `Comp`.',
    );
  });

  it('should not warn when setting CSS custom properties', () => {
    class Comp extends React.Component {
      render() {
        return <div style={{'--foo-primary': 'red', backgroundColor: 'red'}} />;
      }
    }

    spyOn(console, 'error');
    var root = document.createElement('div');
    ReactDOM.render(<Comp />, root);

    expectDev(console.error.calls.count()).toBe(0);
  });

  it('should warn about style containing a Infinity value', () => {
    class Comp extends React.Component {
      static displayName = 'Comp';

      render() {
        return <div style={{fontSize: 1 / 0}} />;
      }
    }

    spyOn(console, 'error');
    var root = document.createElement('div');
    ReactDOM.render(<Comp />, root);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toEqual(
      'Warning: `Infinity` is an invalid value for the `fontSize` css style property.' +
        '\n\nCheck the render method of `Comp`.',
    );
  });

  it('should not add units to CSS custom properties', () => {
    class Comp extends React.Component {
      render() {
        return <div style={{'--foo': 5}} />;
      }
    }

    var root = document.createElement('div');
    ReactDOM.render(<Comp />, root);

    expect(root.children[0].style.Foo).toEqual('5');
  });
});
