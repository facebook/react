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

var React = require('React');
var ReactDOM = require('ReactDOM');
var ReactDOMServer = require('ReactDOMServer');

describe('CSSPropertyOperations', () => {
  var CSSPropertyOperations;

  beforeEach(() => {
    jest.resetModuleRegistry();
    CSSPropertyOperations = require('CSSPropertyOperations');
  });

  it('should create markup for simple styles', () => {
    expect(
      CSSPropertyOperations.createMarkupForStyles({
        backgroundColor: '#3b5998',
        display: 'none',
      }),
    ).toBe('background-color:#3b5998;display:none;');
  });

  it('should ignore undefined styles', () => {
    expect(
      CSSPropertyOperations.createMarkupForStyles({
        backgroundColor: undefined,
        display: 'none',
      }),
    ).toBe('display:none;');
  });

  it('should ignore null styles', () => {
    expect(
      CSSPropertyOperations.createMarkupForStyles({
        backgroundColor: null,
        display: 'none',
      }),
    ).toBe('display:none;');
  });

  it('should return null for no styles', () => {
    expect(
      CSSPropertyOperations.createMarkupForStyles({
        backgroundColor: null,
        display: null,
      }),
    ).toBe(null);
  });

  it('should automatically append `px` to relevant styles', () => {
    expect(
      CSSPropertyOperations.createMarkupForStyles({
        left: 0,
        margin: 16,
        opacity: 0.5,
        padding: '4px',
      }),
    ).toBe('left:0;margin:16px;opacity:0.5;padding:4px;');
  });

  it('should trim values so `px` will be appended correctly', () => {
    expect(
      CSSPropertyOperations.createMarkupForStyles({
        margin: '16 ',
        opacity: 0.5,
        padding: ' 4 ',
      }),
    ).toBe('margin:16px;opacity:0.5;padding:4px;');
  });

  it('should not append `px` to styles that might need a number', () => {
    var CSSProperty = require('CSSProperty');
    var unitlessProperties = Object.keys(CSSProperty.isUnitlessNumber);
    unitlessProperties.forEach(function(property) {
      var styles = {};
      styles[property] = 1;
      expect(CSSPropertyOperations.createMarkupForStyles(styles)).toMatch(
        /:1;$/,
      );
    });
  });

  it('should create vendor-prefixed markup correctly', () => {
    expect(
      CSSPropertyOperations.createMarkupForStyles({
        msTransition: 'none',
        MozTransition: 'none',
      }),
    ).toBe('-ms-transition:none;-moz-transition:none;');
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
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toEqual(
      'Warning: Unsupported style property background-color. Did you mean backgroundColor? ' +
        'Check the render method of `Comp`.',
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

    expect(console.error.calls.count()).toBe(2);
    expect(console.error.calls.argsFor(0)[0]).toEqual(
      'Warning: Unsupported style property -ms-transform. Did you mean msTransform? ' +
        'Check the render method of `Comp`.',
    );
    expect(console.error.calls.argsFor(1)[0]).toEqual(
      'Warning: Unsupported style property -webkit-transform. Did you mean WebkitTransform? ' +
        'Check the render method of `Comp`.',
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
    expect(console.error.calls.count()).toBe(2);
    expect(console.error.calls.argsFor(0)[0]).toEqual(
      'Warning: Unsupported vendor-prefixed style property oTransform. ' +
        'Did you mean OTransform? Check the render method of `Comp`.',
    );
    expect(console.error.calls.argsFor(1)[0]).toEqual(
      'Warning: Unsupported vendor-prefixed style property webkitTransform. ' +
        'Did you mean WebkitTransform? Check the render method of `Comp`.',
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
    expect(console.error.calls.count()).toBe(2);
    expect(console.error.calls.argsFor(0)[0]).toEqual(
      "Warning: Style property values shouldn't contain a semicolon. " +
        'Check the render method of `Comp`. Try "backgroundColor: blue" instead.',
    );
    expect(console.error.calls.argsFor(1)[0]).toEqual(
      "Warning: Style property values shouldn't contain a semicolon. " +
        'Check the render method of `Comp`. Try "color: red" instead.',
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

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toEqual(
      'Warning: `NaN` is an invalid value for the `fontSize` css style property. ' +
        'Check the render method of `Comp`.',
    );
  });
});
