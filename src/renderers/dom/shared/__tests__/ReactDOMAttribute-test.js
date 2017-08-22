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

describe('ReactDOM unknown attribute', () => {
  var React;
  var ReactDOM;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
  });

  describe('unknown attributes', () => {
    it('removes values null and undefined', () => {
      var el = document.createElement('div');
      spyOn(console, 'error');

      function testRemove(value) {
        ReactDOM.render(<div unknown="something" />, el);
        expect(el.firstChild.getAttribute('unknown')).toBe('something');
        expectDev(console.error.calls.count(0)).toBe(0);
        ReactDOM.render(<div unknown={value} />, el);
        expect(el.firstChild.hasAttribute('unknown')).toBe(false);
        expectDev(console.error.calls.count(0)).toBe(0);
        console.error.calls.reset();
      }

      testRemove(null);
      testRemove(undefined);
    });

    it('removes unknown attributes that were rendered but are now missing', () => {
      var el = document.createElement('div');
      spyOn(console, 'error');
      ReactDOM.render(<div unknown="something" />, el);
      expect(el.firstChild.getAttribute('unknown')).toBe('something');
      expectDev(console.error.calls.count(0)).toBe(0);
      ReactDOM.render(<div />, el);
      expect(el.firstChild.hasAttribute('unknown')).toBe(false);
      expectDev(console.error.calls.count(0)).toBe(0);
    });

    it('passes through strings', () => {
      var el = document.createElement('div');
      spyOn(console, 'error');
      ReactDOM.render(<div unknown="something" />, el);
      expect(el.firstChild.getAttribute('unknown')).toBe('something');
      expectDev(console.error.calls.count(0)).toBe(0);
      ReactDOM.render(<div />, el);
      expect(el.firstChild.hasAttribute('unknown')).toBe(false);
      expectDev(console.error.calls.count(0)).toBe(0);
    });

    it('coerces numbers and booleans to strings', () => {
      var el = document.createElement('div');
      spyOn(console, 'error');

      function testCoerceToString(value) {
        ReactDOM.render(<div unknown="something" />, el);
        expect(el.firstChild.getAttribute('unknown')).toBe('something');
        expectDev(console.error.calls.count(0)).toBe(0);
        ReactDOM.render(<div unknown={value} />, el);
        expect(el.firstChild.getAttribute('unknown')).toBe(value + '');
        expectDev(console.error.calls.count(0)).toBe(0);
        console.error.calls.reset();
      }

      testCoerceToString(0);
      testCoerceToString(-1);
      testCoerceToString(42);
      testCoerceToString(9000.99999);
      testCoerceToString(true);
      testCoerceToString(false);
    });

    it('coerces NaN and object to strings **and warns**', () => {
      var el = document.createElement('div');
      spyOn(console, 'error');

      function testCoerceToString(value) {
        ReactDOM.render(<div unknown="something" />, el);
        expect(el.firstChild.getAttribute('unknown')).toBe('something');
        expectDev(console.error.calls.count(0)).toBe(0);
        ReactDOM.render(<div unknown={value} />, el);
        expect(el.firstChild.getAttribute('unknown')).toBe(value + '');
        expectDev(console.error.calls.count(0)).toBe(1);
        // TODO: add specific expectations about what the warning says
        // expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(...
        console.error.calls.reset();
      }

      testCoerceToString(NaN);
      testCoerceToString({hello: 'world'});
    });

    it('removes symbols and functions **and warns**', () => {
      var el = document.createElement('div');
      spyOn(console, 'error');

      function testCoerceToString(value) {
        ReactDOM.render(<div unknown="something" />, el);
        expect(el.firstChild.getAttribute('unknown')).toBe('something');
        expectDev(console.error.calls.count(0)).toBe(0);
        ReactDOM.render(<div unknown={value} />, el);
        expect(el.firstChild.getAttribute('unknown')).toBe(value + '');
        expectDev(console.error.calls.count(0)).toBe(1);
        // TODO: add specific expectations about what the warning says
        // expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(...
        console.error.calls.reset();
      }

      testCoerceToString(Symbol('foo'));
      testCoerceToString(() => 'foo');
    });
  });
});
