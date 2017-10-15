/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

    it('changes values true, false to null, and also warns once', () => {
      spyOn(console, 'error');

      testUnknownAttributeAssignment(true, null);
      testUnknownAttributeAssignment(false, null);

      expectDev(
        normalizeCodeLocInfo(console.error.calls.argsFor(0)[0]),
      ).toMatch(
        'Warning: Received `true` for non-boolean attribute `unknown`. ' +
          'If this is expected, cast the value to a string.\n' +
          '    in div (at **)',
      );
      expectDev(console.error.calls.count()).toBe(1);
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

    it('coerces numbers to strings', () => {
      testUnknownAttributeAssignment(0, '0');
      testUnknownAttributeAssignment(-1, '-1');
      testUnknownAttributeAssignment(42, '42');
      testUnknownAttributeAssignment(9000.99, '9000.99');
    });

    it('coerces NaN to strings and warns', () => {
      spyOn(console, 'error');

      testUnknownAttributeAssignment(NaN, 'NaN');
      expectDev(
        normalizeCodeLocInfo(console.error.calls.argsFor(0)[0]),
      ).toMatch(
        'Warning: Received NaN for numeric attribute `unknown`. ' +
          'If this is expected, cast the value to a string.\n' +
          '    in div (at **)',
      );
      expectDev(console.error.calls.count()).toBe(1);
    });

    it('coerces objects to strings and warns', () => {
      const lol = {
        toString() {
          return 'lol';
        },
      };

      testUnknownAttributeAssignment({hello: 'world'}, '[object Object]');
      testUnknownAttributeAssignment(lol, 'lol');
    });

    it('removes symbols and warns', () => {
      spyOn(console, 'error');

      testUnknownAttributeRemoval(Symbol('foo'));
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Invalid value for prop `unknown` on <div> tag. Either remove it ' +
          'from the element, or pass a string or number value to keep it ' +
          'in the DOM. For details, see https://fb.me/react-attribute-behavior\n' +
          '    in div (at **)',
      );
      expectDev(console.error.calls.count()).toBe(1);
    });

    it('removes functions and warns', () => {
      spyOn(console, 'error');

      testUnknownAttributeRemoval(function someFunction() {});
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Invalid value for prop `unknown` on <div> tag. Either remove ' +
          'it from the element, or pass a string or number value to ' +
          'keep it in the DOM. For details, see ' +
          'https://fb.me/react-attribute-behavior\n' +
          '    in div (at **)',
      );
      expectDev(console.error.calls.count()).toBe(1);
    });

    it('allows camelCase unknown attributes and warns', () => {
      spyOn(console, 'error');

      var el = document.createElement('div');
      ReactDOM.render(<div helloWorld="something" />, el);
      expect(el.firstChild.getAttribute('helloworld')).toBe('something');

      expectDev(console.error.calls.count()).toBe(1);
      expectDev(
        normalizeCodeLocInfo(console.error.calls.argsFor(0)[0]),
      ).toMatch(
        'React does not recognize the `helloWorld` prop on a DOM element. ' +
          'If you intentionally want it to appear in the DOM as a custom ' +
          'attribute, spell it as lowercase `helloworld` instead. ' +
          'If you accidentally passed it from a parent component, remove ' +
          'it from the DOM element.\n' +
          '    in div (at **)',
      );
    });
  });
});
