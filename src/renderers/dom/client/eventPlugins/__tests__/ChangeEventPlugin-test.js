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
var ReactTestUtils = require('ReactTestUtils');
var ChangeEventPlugin = require('ChangeEventPlugin');

var lastInputValue = ChangeEventPlugin.__lastInputValue;

function setUntrackedValue(elem, value) {
  var current = lastInputValue.get(elem);

  elem.value = value;
  lastInputValue.set(elem, current);
}

describe('ChangeEventPlugin', function() {
  it('should fire change for checkbox input', function() {
    var called = 0;

    function cb(e) {
      called = 1;
      expect(e.type).toBe('change');
    }

    var input = ReactTestUtils.renderIntoDocument(<input type="checkbox" onChange={cb}/>);
    ReactTestUtils.SimulateNative.click(input);
    expect(called).toBe(1);
  });

  it('should catch setting the value programmatically', function() {

    var input = ReactTestUtils.renderIntoDocument(
      <input type="text" defaultValue="foo"/>
    );

    input.value = 'bar';

    expect(lastInputValue.get(input)).toBe('bar');
  });

  it('should not fire change when setting the value programmatically', function() {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    var input = ReactTestUtils.renderIntoDocument(
      <input type="text" onChange={cb} defaultValue="foo"/>
    );

    input.value = 'bar';
    ReactTestUtils.SimulateNative.change(input);
    expect(called).toBe(0);

    setUntrackedValue(input, 'foo');
    ReactTestUtils.SimulateNative.change(input);

    expect(called).toBe(1);
  });

  it('should not fire change when setting checked programmatically', function() {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    var input = ReactTestUtils.renderIntoDocument(
      <input type="checkbox" onChange={cb} defaultChecked={true} />
    );

    input.checked = true;
    ReactTestUtils.SimulateNative.click(input);
    expect(called).toBe(0);

    input.checked = false;
    lastInputValue.set(input, undefined);
    ReactTestUtils.SimulateNative.click(input);

    expect(called).toBe(1);
  });

  it('should unmount', function() {
    var container = document.createElement('div');
    var input = ReactDOM.render(<input />, container);
    
    ReactDOM.unmountComponentAtNode(container);
  });

  it('should only fire change for checked radio button once', function() {
    var called = 0;

    function cb(e) {
      called += 1;
    }

    var input = ReactTestUtils.renderIntoDocument(<input type="radio" onChange={cb}/>);
    ReactTestUtils.SimulateNative.click(input);
    ReactTestUtils.SimulateNative.click(input);
    expect(called).toBe(1);
  });

  it('should deduplicate input value change events', function() {
    var input;
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    [
      <input type="text" onChange={cb}/>,
      <input type="number" onChange={cb}/>,
      <input type="range" onChange={cb}/>,
    ].forEach(function(element) {
      called = 0;
      input = ReactTestUtils.renderIntoDocument(element);

      ReactTestUtils.SimulateNative.change(input);
      ReactTestUtils.SimulateNative.change(input);
      expect(called).toBe(1);

      called = 0;
      input = ReactTestUtils.renderIntoDocument(element);
      ReactTestUtils.SimulateNative.input(input);
      ReactTestUtils.SimulateNative.input(input);
      expect(called).toBe(1);

      called = 0;
      input = ReactTestUtils.renderIntoDocument(element);
      ReactTestUtils.SimulateNative.input(input);
      ReactTestUtils.SimulateNative.change(input);
      expect(called).toBe(1);
    });
  });

  it('should listen for both change and input events when supported', function() {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    if (!ChangeEventPlugin._isInputEventSupported) {
      return;
    }

    var input = ReactTestUtils.renderIntoDocument(<input type="range" onChange={cb}/>);

    ReactTestUtils.SimulateNative.input(input);

    setUntrackedValue(input, 'foo');

    ReactTestUtils.SimulateNative.change(input);

    expect(called).toBe(2);
  });

  it('should only fire events when the value changes for range inputs', function() {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    var input = ReactTestUtils.renderIntoDocument(<input type="range" onChange={cb}/>);

    ReactTestUtils.SimulateNative.input(input);
    ReactTestUtils.SimulateNative.change(input);

    setUntrackedValue(input, 'foo');

    ReactTestUtils.SimulateNative.input(input);
    ReactTestUtils.SimulateNative.change(input);
    expect(called).toBe(2);
  });
});
