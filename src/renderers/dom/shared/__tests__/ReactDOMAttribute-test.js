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

describe('ReactDOMAttribute', () => {
  var React;
  var ReactDOM;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
  });

  describe('unknown attributes', () => {
    it('removes unknown attributes with values null and undefined', () => {
      var el = document.createElement('div');

      function testRemove(value) {
        ReactDOM.render(<div unknown="something" />, el);
        expect(el.firstChild.getAttribute('unknown')).toBe('something');
        ReactDOM.render(<div unknown={value} />, el);
        expect(el.firstChild.hasAttribute('unknown')).toBe(false);
      }

      testRemove(null);
      testRemove(undefined);
    });

    it('removes unknown attributes that were rendered but are now missing', () => {
      var el = document.createElement('div');
      ReactDOM.render(<div unknown="something" />, el);
      expect(el.firstChild.getAttribute('unknown')).toBe('something');
      ReactDOM.render(<div />, el);
      expect(el.firstChild.hasAttribute('unknown')).toBe(false);
    });

    it('passes through strings to unknown attributes', () => {
      var el = document.createElement('div');
      ReactDOM.render(<div unknown="something" />, el);
      expect(el.firstChild.getAttribute('unknown')).toBe('something');
      ReactDOM.render(<div />, el);
      expect(el.firstChild.hasAttribute('unknown')).toBe(false);
    });
  });
});
