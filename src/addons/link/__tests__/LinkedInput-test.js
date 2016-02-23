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


describe('LinkedStateMixin', function() {
  let LinkedInput;
  let React;
  let ReactDOM;

  beforeEach(function() {
    LinkedInput = require('LinkedInput');
    React = require('React');
    ReactDOM = require('ReactDOM');
  });

  it('should basically work', function() {
    const container = document.createElement('div');
    const component = ReactDOM.render(<LinkedInput value="foo" onChange={function() {}} />, container);
    const input = ReactDOM.findDOMNode(component);
    expect(input.value).toBe('foo');
    ReactDOM.render(<LinkedInput valueLink={{value: 'boo', requestChange: function() {}}} />, container);
    expect(input.value).toBe('boo');
  });

  it('should throw', function() {
    const container = document.createElement('div');
    const element = <LinkedInput value="foo" valueLink={{value: 'boo', requestChange: function() {}}} />;
    expect(function() {
      ReactDOM.render(element, container);
    }).toThrow();
  });
});
