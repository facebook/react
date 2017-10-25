/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var ReactTestUtils = require('react-dom/test-utils');

function getTrackedValue(elem) {
  return elem.value;
}

var setUntrackedChecked = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'checked',
).set;

var setUntrackedValue = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value',
).set;

describe('ChangeEventPlugin', () => {
  it('should fire change for checkbox input', () => {
    var called = 0;

    function cb(e) {
      called = 1;
      expect(e.type).toBe('change');
    }

    var input = ReactTestUtils.renderIntoDocument(
      <input type="checkbox" onChange={cb} />,
    );

    setUntrackedChecked.call(input, true);
    ReactTestUtils.SimulateNative.click(input);

    expect(called).toBe(1);
  });

  it('should catch setting the value programmatically', () => {
    var input = ReactTestUtils.renderIntoDocument(
      <input type="text" defaultValue="foo" />,
    );

    input.value = 'bar';
    expect(getTrackedValue(input)).toBe('bar');
  });

  it('should not fire change when setting the value programmatically', () => {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    var input = ReactTestUtils.renderIntoDocument(
      <input type="text" onChange={cb} defaultValue="foo" />,
    );

    input.value = 'bar';
    ReactTestUtils.SimulateNative.change(input);
    expect(called).toBe(0);

    setUntrackedValue.call(input, 'foo');
    ReactTestUtils.SimulateNative.change(input);

    expect(called).toBe(1);
  });

  it('should not fire change when setting checked programmatically', () => {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    var input = ReactTestUtils.renderIntoDocument(
      <input type="checkbox" onChange={cb} defaultChecked={true} />,
    );

    input.checked = true;
    ReactTestUtils.SimulateNative.click(input);
    expect(called).toBe(0);

    setUntrackedChecked.call(input, false);
    ReactTestUtils.SimulateNative.click(input);

    expect(called).toBe(1);
  });

  it('should unmount', () => {
    var container = document.createElement('div');
    var input = ReactDOM.render(<input />, container);

    ReactDOM.unmountComponentAtNode(container);
  });

  it('should only fire change for checked radio button once', () => {
    var called = 0;

    function cb(e) {
      called += 1;
    }

    var input = ReactTestUtils.renderIntoDocument(
      <input type="radio" onChange={cb} />,
    );
    setUntrackedChecked.call(input, true);
    ReactTestUtils.SimulateNative.click(input);
    ReactTestUtils.SimulateNative.click(input);
    expect(called).toBe(1);
  });

  it('should deduplicate input value change events', () => {
    var input;
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    [
      <input type="text" onChange={cb} />,
      <input type="number" onChange={cb} />,
      <input type="range" onChange={cb} />,
    ].forEach(function(element) {
      called = 0;
      input = ReactTestUtils.renderIntoDocument(element);

      setUntrackedValue.call(input, '40');
      ReactTestUtils.SimulateNative.change(input);
      ReactTestUtils.SimulateNative.change(input);
      expect(called).toBe(1);

      called = 0;
      input = ReactTestUtils.renderIntoDocument(element);
      setUntrackedValue.call(input, '40');
      ReactTestUtils.SimulateNative.input(input);
      ReactTestUtils.SimulateNative.input(input);
      expect(called).toBe(1);

      called = 0;
      input = ReactTestUtils.renderIntoDocument(element);
      setUntrackedValue.call(input, '40');
      ReactTestUtils.SimulateNative.input(input);
      ReactTestUtils.SimulateNative.change(input);
      expect(called).toBe(1);
    });
  });

  it('should listen for both change and input events when supported', () => {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    var input = ReactTestUtils.renderIntoDocument(
      <input type="range" onChange={cb} />,
    );
    setUntrackedValue.call(input, 'bar');

    ReactTestUtils.SimulateNative.input(input);

    setUntrackedValue.call(input, 'foo');

    ReactTestUtils.SimulateNative.change(input);

    expect(called).toBe(2);
  });

  it('should only fire events when the value changes for range inputs', () => {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    var input = ReactTestUtils.renderIntoDocument(
      <input type="range" onChange={cb} />,
    );
    setUntrackedValue.call(input, '40');
    ReactTestUtils.SimulateNative.input(input);
    ReactTestUtils.SimulateNative.change(input);

    setUntrackedValue.call(input, 'foo');

    ReactTestUtils.SimulateNative.input(input);
    ReactTestUtils.SimulateNative.change(input);
    expect(called).toBe(2);
  });
});
