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
  var LinkedInput;
  var React;
  var ReactDOM;

  beforeEach(function() {
    LinkedInput = require('LinkedInput');
    React = require('React');
    ReactDOM = require('ReactDOM');
  });

  it('should basically work', function() {
    var container = document.createElement('div');
    var component = ReactDOM.render(<LinkedInput value="foo" onChange={function() {}} />, container);
    var input = ReactDOM.findDOMNode(component);
    expect(input.value).toBe('foo');
    ReactDOM.render(<LinkedInput valueLink={{value: 'boo', requestChange: function() {}}} />, container);
    expect(input.value).toBe('boo');
  });

  it('should throw', function() {
    var container = document.createElement('div');
    var element = <LinkedInput value="foo" valueLink={{value: 'boo', requestChange: function() {}}} />;
    expect(function() {
      ReactDOM.render(element, container);
    }).toThrow();
  });
});
