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

'use strict';


describe('ReactDOMOption', function() {
  var React;
  var ReactTestUtils;

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should flatten children to a string', function() {
    var stub = <option>{1} {'foo'}</option>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = React.findDOMNode(stub);

    expect(node.innerHTML).toBe('1 foo');
  });

  it('should ignore invalid children types', function() {
    spyOn(console, 'error');
    var stub = <option>{1} <div /> {2}</option>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = React.findDOMNode(stub);

    expect(node.innerHTML).toBe('1  2');
    expect(console.error.calls.length).toBe(1);
    expect(console.error.calls[0].args[0]).toContain('Only strings and numbers are supported as <option> children.');
  });

  it('should warn when passing invalid children', function() {
    var stub = <option>{1} <div /></option>;
    spyOn(console, 'error');
    stub = ReactTestUtils.renderIntoDocument(stub);

    expect(console.error.calls.length).toBe(1);
    expect(console.error.calls[0].args[0]).toContain(
      'Only strings and numbers are supported as <option> children.'
    );
  });

  it('should ignore null/undefined/false children without warning', function() {
    var stub = <option>{1} {false}{true}{null}{undefined} {2}</option>;
    spyOn(console, 'error');
    stub = ReactTestUtils.renderIntoDocument(stub);

    var node = React.findDOMNode(stub);

    expect(console.error.calls.length).toBe(0);
    expect(node.innerHTML).toBe('1  2');
  });

});
