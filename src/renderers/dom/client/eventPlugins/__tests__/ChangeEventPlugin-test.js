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
var inputValueTracking = require('inputValueTracking');

function getTrackedValue(elem) {
  var tracker = inputValueTracking._getTrackerFromNode(elem);
  return tracker.getValue();
}

function setTrackedValue(elem, value) {
  var tracker = inputValueTracking._getTrackerFromNode(elem);
  tracker.setValue(value);
}

function setUntrackedValue(elem, value) {
  var tracker = inputValueTracking._getTrackerFromNode(elem);
  var current = tracker.getValue();

  if (elem.type === 'checkbox' || elem.type === 'radio') {
    elem.checked = value;
  } else {
    elem.value = value;
  }
  tracker.setValue(current);
}

describe('ChangeEventPlugin', function() {
  pit('should fire change for checkbox input', async function() {
    var called = 0;

    function cb(e) {
      called = 1;
      expect(e.type).toBe('change');
    }

    var input = await ReactTestUtils.renderIntoDocumentAsync(<input type="checkbox" onChange={cb}/>);

    setUntrackedValue(input, true);
    ReactTestUtils.SimulateNative.click(input);

    expect(called).toBe(1);
  });

  pit('should catch setting the value programmatically', async function() {
    var input = await ReactTestUtils.renderIntoDocumentAsync(
      <input type="text" defaultValue="foo"/>
    );

    input.value = 'bar';
    expect(getTrackedValue(input)).toBe('bar');
  });

  pit('should not fire change when setting the value programmatically', async function() {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    var input = await ReactTestUtils.renderIntoDocumentAsync(
      <input type="text" onChange={cb} defaultValue="foo"/>
    );

    input.value = 'bar';
    ReactTestUtils.SimulateNative.change(input);
    expect(called).toBe(0);

    setUntrackedValue(input, 'foo');
    ReactTestUtils.SimulateNative.change(input);

    expect(called).toBe(1);
  });

  pit('should not fire change when setting checked programmatically', async function() {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    var input = await ReactTestUtils.renderIntoDocumentAsync(
      <input type="checkbox" onChange={cb} defaultChecked={true} />
    );

    input.checked = true;
    ReactTestUtils.SimulateNative.click(input);
    expect(called).toBe(0);

    input.checked = false;
    setTrackedValue(input, undefined);
    ReactTestUtils.SimulateNative.click(input);

    expect(called).toBe(1);
  });

  it('should unmount', function() {
    var container = document.createElement('div');
    var input = ReactDOM.render(<input />, container);

    ReactDOM.unmountComponentAtNode(container);
  });

  pit('should only fire change for checked radio button once', async function() {
    var called = 0;

    function cb(e) {
      called += 1;
    }

    var input = await ReactTestUtils.renderIntoDocumentAsync(<input type="radio" onChange={cb}/>);
    setUntrackedValue(input, true);
    ReactTestUtils.SimulateNative.click(input);
    ReactTestUtils.SimulateNative.click(input);
    expect(called).toBe(1);
  });

  pit('should deduplicate input value change events', async function() {
    var input;
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    async function runTest(element) {
      called = 0;
      input = await ReactTestUtils.renderIntoDocumentAsync(element);

      setUntrackedValue(input, '40');
      ReactTestUtils.SimulateNative.change(input);
      ReactTestUtils.SimulateNative.change(input);
      expect(called).toBe(1);

      called = 0;
      input = await ReactTestUtils.renderIntoDocumentAsync(element);
      setUntrackedValue(input, '40');
      ReactTestUtils.SimulateNative.input(input);
      ReactTestUtils.SimulateNative.input(input);
      expect(called).toBe(1);

      called = 0;
      input = await ReactTestUtils.renderIntoDocumentAsync(element);
      setUntrackedValue(input, '40');
      ReactTestUtils.SimulateNative.input(input);
      ReactTestUtils.SimulateNative.change(input);
      expect(called).toBe(1);
    }

    await runTest(<input type="text" onChange={cb}/>);
    await runTest(<input type="number" onChange={cb}/>);
    await runTest(<input type="range" onChange={cb}/>);
  });

  pit('should listen for both change and input events when supported', async function() {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    if (!ChangeEventPlugin._isInputEventSupported) {
      return;
    }

    var input = await ReactTestUtils.renderIntoDocumentAsync(<input type="range" onChange={cb}/>);
    setUntrackedValue(input, 'bar');

    ReactTestUtils.SimulateNative.input(input);

    setUntrackedValue(input, 'foo');

    ReactTestUtils.SimulateNative.change(input);

    expect(called).toBe(2);
  });

  pit('should only fire events when the value changes for range inputs', async function() {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    var input = await ReactTestUtils.renderIntoDocumentAsync(<input type="range" onChange={cb}/>);
    setUntrackedValue(input, '40');
    ReactTestUtils.SimulateNative.input(input);
    ReactTestUtils.SimulateNative.change(input);

    setUntrackedValue(input, 'foo');

    ReactTestUtils.SimulateNative.input(input);
    ReactTestUtils.SimulateNative.change(input);
    expect(called).toBe(2);
  });
});
