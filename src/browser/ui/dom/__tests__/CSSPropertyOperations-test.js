/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

/*jslint evil: true */

'use strict';

var React = require('React');

describe('CSSPropertyOperations', function() {
  var CSSPropertyOperations;

  beforeEach(function() {
    require('mock-modules').dumpCache();
    CSSPropertyOperations = require('CSSPropertyOperations');
  });

  it('should create markup for simple styles', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      backgroundColor: '#3b5998',
      display: 'none'
    })).toBe('background-color:#3b5998;display:none;');
  });

  it('should ignore undefined styles', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      backgroundColor: undefined,
      display: 'none'
    })).toBe('display:none;');
  });

  it('should ignore null styles', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      backgroundColor: null,
      display: 'none'
    })).toBe('display:none;');
  });

  it('should return null for no styles', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      backgroundColor: null,
      display: null
    })).toBe(null);
  });

  it('should automatically append `px` to relevant styles', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      left: 0,
      margin: 16,
      opacity: 0.5,
      padding: '4px'
    })).toBe('left:0;margin:16px;opacity:0.5;padding:4px;');
  });

  it('should trim values so `px` will be appended correctly', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      margin: '16 ',
      opacity: 0.5,
      padding: ' 4 '
    })).toBe('margin:16px;opacity:0.5;padding:4px;');
  });

  it('should not append `px` to styles that might need a number', function() {
    var CSSProperty = require('CSSProperty');
    var unitlessProperties = Object.keys(CSSProperty.isUnitlessNumber);
    unitlessProperties.forEach(function(property) {
      var styles = {};
      styles[property] = 1;
      expect(CSSPropertyOperations.createMarkupForStyles(styles))
        .toMatch(/:1;$/);
    });
  });

  it('should create vendor-prefixed markup correctly', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      msTransition: 'none',
      MozTransition: 'none'
    })).toBe('-ms-transition:none;-moz-transition:none;');
  });

  it('should set style attribute when styles exist', function() {
    var styles = {
      backgroundColor: '#000',
      display: 'none'
    };
    var div = <div style={styles} />;
    var root = document.createElement('div');
    div = React.render(div, root);
    expect(/style=".*"/.test(root.innerHTML)).toBe(true);
  });

  it('should not set style attribute when no styles exist', function() {
    var styles = {
      backgroundColor: null,
      display: null
    };
    var div = <div style={styles} />;
    var root = document.createElement('div');
    React.render(div, root);
    expect(/style=".*"/.test(root.innerHTML)).toBe(false);
  });

  it('should warn when using hyphenated style names', function() {
    spyOn(console, 'warn');

    expect(CSSPropertyOperations.createMarkupForStyles({
      'background-color': 'crimson'
    })).toBe('background-color:crimson;');

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain('backgroundColor');
  });

  it('should warn when updating hyphenated style names', function() {
    spyOn(console, 'warn');

    var root = document.createElement('div');
    var styles = {
      '-ms-transform': 'translate3d(0, 0, 0)',
      '-webkit-transform': 'translate3d(0, 0, 0)'
    };

    React.render(<div />, root);
    React.render(<div style={styles} />, root);

    expect(console.warn.argsForCall.length).toBe(2);
    expect(console.warn.argsForCall[0][0]).toContain('msTransform');
    expect(console.warn.argsForCall[1][0]).toContain('WebkitTransform');
  });

  it('warns when miscapitalizing vendored style names', function() {
    spyOn(console, 'warn');

    CSSPropertyOperations.createMarkupForStyles({
      msTransform: 'translate3d(0, 0, 0)',
      oTransform: 'translate3d(0, 0, 0)',
      webkitTransform: 'translate3d(0, 0, 0)'
    });

    // msTransform is correct already and shouldn't warn
    expect(console.warn.argsForCall.length).toBe(2);
    expect(console.warn.argsForCall[0][0]).toContain('oTransform');
    expect(console.warn.argsForCall[0][0]).toContain('OTransform');
    expect(console.warn.argsForCall[1][0]).toContain('webkitTransform');
    expect(console.warn.argsForCall[1][0]).toContain('WebkitTransform');
  });

  it('should warn about style having a trailing semicolon', function() {
    spyOn(console, 'warn');

    CSSPropertyOperations.createMarkupForStyles({
      fontFamily: 'Helvetica, arial',
      backgroundImage: 'url(foo;bar)',
      backgroundColor: 'blue;',
      color: 'red;   '
    });

    expect(console.warn.calls.length).toBe(2);
    expect(console.warn.argsForCall[0][0]).toContain('Try "backgroundColor: blue" instead');
    expect(console.warn.argsForCall[1][0]).toContain('Try "color: red" instead');
  });
});
