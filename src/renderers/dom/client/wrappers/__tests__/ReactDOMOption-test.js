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


describe('ReactDOMOption', function() {
  let React;
  let ReactDOM;
  let ReactTestUtils;

  beforeEach(function() {
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should flatten children to a string', function() {
    let stub = <option>{1} {'foo'}</option>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    const node = ReactDOM.findDOMNode(stub);

    expect(node.innerHTML).toBe('1 foo');
  });

  it('should ignore invalid children types', function() {
    spyOn(console, 'error');
    let stub = <option>{1} <div /> {2}</option>;
    stub = ReactTestUtils.renderIntoDocument(stub);
    const node = ReactDOM.findDOMNode(stub);

    expect(node.innerHTML).toBe('1  2');
    expect(console.error.calls.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toContain('Only strings and numbers are supported as <option> children.');
  });

  it('should warn when passing invalid children', function() {
    let stub = <option>{1} <div /></option>;
    spyOn(console, 'error');
    stub = ReactTestUtils.renderIntoDocument(stub);

    expect(console.error.calls.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toContain(
      'Only strings and numbers are supported as <option> children.'
    );
  });

  it('should ignore null/undefined/false children without warning', function() {
    let stub = <option>{1} {false}{true}{null}{undefined} {2}</option>;
    spyOn(console, 'error');
    stub = ReactTestUtils.renderIntoDocument(stub);

    const node = ReactDOM.findDOMNode(stub);

    expect(console.error.calls.length).toBe(0);
    expect(node.innerHTML).toBe('1  2');
  });

  it('should be able to use dangerouslySetInnerHTML on option', function() {
    let stub = <option dangerouslySetInnerHTML={{ __html: 'foobar' }} />;
    stub = ReactTestUtils.renderIntoDocument(stub);

    const node = ReactDOM.findDOMNode(stub);
    expect(node.innerHTML).toBe('foobar');
  });
});
