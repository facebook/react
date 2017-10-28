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
// TODO: can we express this test with only public API?
var inputValueTracking = require('../client/inputValueTracking');

var getTracker = inputValueTracking._getTrackerFromNode;

describe('inputValueTracking', () => {
  var input;

  beforeEach(() => {
    input = document.createElement('input');
    input.type = 'text';
  });

  it('should attach tracker to node', () => {
    var node = ReactTestUtils.renderIntoDocument(<input type="text" />);

    expect(getTracker(node)).toBeDefined();
  });

  it('should define `value` on the node instance', () => {
    var node = ReactTestUtils.renderIntoDocument(<input type="text" />);

    expect(node.hasOwnProperty('value')).toBe(true);
  });

  it('should define `checked` on the node instance', () => {
    var node = ReactTestUtils.renderIntoDocument(<input type="checkbox" />);

    expect(node.hasOwnProperty('checked')).toBe(true);
  });

  it('should initialize with the current value', () => {
    input.value = 'foo';

    inputValueTracking.track(input);

    var tracker = getTracker(input);

    expect(tracker.getValue()).toEqual('foo');
  });

  it('should initialize with the current `checked`', () => {
    const checkbox = document.createElement('input');

    checkbox.type = 'checkbox';
    checkbox.checked = true;
    inputValueTracking.track(checkbox);

    var tracker = getTracker(checkbox);

    expect(tracker.getValue()).toEqual('true');
  });

  it('should track value changes', () => {
    var node = ReactTestUtils.renderIntoDocument(
      <input type="text" defaultValue="foo" />,
    );

    var tracker = getTracker(node);

    node.value = 'bar';
    expect(tracker.getValue()).toEqual('bar');
  });

  it('should tracked`checked` changes', () => {
    var node = ReactTestUtils.renderIntoDocument(
      <input type="checkbox" defaultChecked={true} />,
    );

    var tracker = getTracker(node);

    node.checked = false;
    expect(tracker.getValue()).toEqual('false');
  });

  it('should update value manually', () => {
    var node = ReactTestUtils.renderIntoDocument(
      <input type="text" defaultValue="foo" />,
    );

    var tracker = getTracker(node);

    tracker.setValue('bar');
    expect(tracker.getValue()).toEqual('bar');
  });

  it('should coerce value to a string', () => {
    var node = ReactTestUtils.renderIntoDocument(
      <input type="text" defaultValue="foo" />,
    );

    var tracker = getTracker(node);

    tracker.setValue(500);
    expect(tracker.getValue()).toEqual('500');
  });

  it('should update value if it changed and return result', () => {
    var node = ReactTestUtils.renderIntoDocument(
      <input type="text" defaultValue="foo" />,
    );

    var tracker = getTracker(node);

    expect(inputValueTracking.updateValueIfChanged(node)).toBe(false);

    tracker.setValue('bar');

    expect(inputValueTracking.updateValueIfChanged(node)).toBe(true);

    expect(tracker.getValue()).toEqual('foo');
  });

  it('should return true when updating untracked instance', () => {
    input.value = 'foo';

    expect(inputValueTracking.updateValueIfChanged(input)).toBe(true);

    expect(getTracker(input)).not.toBeDefined();
  });

  it('should return tracker from node', () => {
    var div = document.createElement('div');
    var node = ReactDOM.render(<input type="text" defaultValue="foo" />, div);

    var tracker = getTracker(node);
    expect(tracker.getValue()).toEqual('foo');
  });

  it('should stop tracking', () => {
    inputValueTracking.track(input);

    expect(getTracker(input)).not.toEqual(null);

    inputValueTracking.stopTracking(input);

    expect(getTracker(input)).toEqual(null);

    expect(input.hasOwnProperty('value')).toBe(false);
  });

  it('does not crash for nodes with custom value property', () => {
    // https://github.com/facebook/react/issues/10196
    try {
      var originalCreateElement = document.createElement;
      document.createElement = function() {
        var node = originalCreateElement.apply(this, arguments);
        Object.defineProperty(node, 'value', {
          get() {},
          set() {},
        });
        return node;
      };
      var div = document.createElement('div');
      // Mount
      var node = ReactDOM.render(<input type="text" />, div);
      // Update
      ReactDOM.render(<input type="text" />, div);
      // Change
      ReactTestUtils.SimulateNative.change(node);
      // Unmount
      ReactDOM.unmountComponentAtNode(div);
    } finally {
      document.createElement = originalCreateElement;
    }
  });
});
