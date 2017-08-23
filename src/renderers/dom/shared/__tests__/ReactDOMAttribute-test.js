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

  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  function testUnknownAttributeRemoval(givenValue) {
    var el = document.createElement('div');
    ReactDOM.render(<div unknown="something" />, el);
    expect(el.firstChild.getAttribute('unknown')).toBe('something');
    ReactDOM.render(<div unknown={givenValue} />, el);
    expect(el.firstChild.hasAttribute('unknown')).toBe(false);
  }

  function testUnknownAttributeAssignment(givenValue, expectedDOMValue) {
    var el = document.createElement('div');
    ReactDOM.render(<div unknown="something" />, el);
    expect(el.firstChild.getAttribute('unknown')).toBe('something');
    ReactDOM.render(<div unknown={givenValue} />, el);
    expect(el.firstChild.getAttribute('unknown')).toBe(expectedDOMValue);
  }

  describe('unknown attributes', () => {
    it('removes values null and undefined', () => {
      testUnknownAttributeRemoval(null);
      testUnknownAttributeRemoval(undefined);
    });

    it('removes unknown attributes that were rendered but are now missing', () => {
      var el = document.createElement('div');
      ReactDOM.render(<div unknown="something" />, el);
      expect(el.firstChild.getAttribute('unknown')).toBe('something');
      ReactDOM.render(<div />, el);
      expect(el.firstChild.hasAttribute('unknown')).toBe(false);
    });

    it('passes through strings', () => {
      testUnknownAttributeAssignment('a string', 'a string');
    });

    it('coerces numbers and booleans to strings', () => {
      testUnknownAttributeAssignment(0, '0');
      testUnknownAttributeAssignment(-1, '-1');
      testUnknownAttributeAssignment(42, '42');
      testUnknownAttributeAssignment(9000.99, '9000.99');
      testUnknownAttributeAssignment(true, 'true');
      testUnknownAttributeAssignment(false, 'false');
    });

    it('coerces NaN to strings and warns', () => {
      spyOn(console, 'error');

      testUnknownAttributeAssignment(NaN, 'NaN');
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Received NaN for numeric attribute `unknown`. ' +
          'If this is expected, cast the value to a string.\n' +
          '    in div (at **)',
      );
      expectDev(console.error.calls.count()).toBe(1);
    });

    it('coerces objects to strings **and warns**', () => {
      spyOn(console, 'error');

      const lol = {
        toString() {
          return 'lol';
        },
      };

      testUnknownAttributeAssignment({hello: 'world'}, '[object Object]');
      testUnknownAttributeAssignment(lol, 'lol');
      // TODO: add specific expectations about what the warning says
      // expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(...
      expectDev(console.error.calls.count()).toBe(1);
    });

    it('removes symbols and warns', () => {
      spyOn(console, 'error');

      testUnknownAttributeRemoval(Symbol('foo'));
      // TODO: add specific expectations about what the warning says
      // expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(...
      expectDev(console.error.calls.count()).toBe(1);
    });

    it('removes functions and warns', () => {
      spyOn(console, 'error');

      testUnknownAttributeRemoval(function someFunction() {});
      // TODO: add specific expectations about what the warning says
      // expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(...
      expectDev(console.error.calls.count()).toBe(1);
    });
  });
});
