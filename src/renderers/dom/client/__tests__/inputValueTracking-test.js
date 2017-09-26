/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */
'use strict';

var React = require('React');
var ReactDOM = require('ReactDOM');
var ReactTestUtils = require('ReactTestUtils');
var inputValueTracking = require('inputValueTracking');

describe('inputValueTracking', function() {
  var input, checkbox, mockComponent;

  beforeEach(function() {
    input = document.createElement('input');
    input.type = 'text';
    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    mockComponent = {_hostNode: input, _wrapperState: {}};
  });

  it('should attach tracker to wrapper state', function() {
    inputValueTracking.track(mockComponent);

    expect(mockComponent._wrapperState.hasOwnProperty('valueTracker')).toBe(
      true,
    );
  });

  it('should define `value` on the instance node', function() {
    inputValueTracking.track(mockComponent);

    expect(input.hasOwnProperty('value')).toBe(true);
  });

  it('should define `checked` on the instance node', function() {
    mockComponent._hostNode = checkbox;
    inputValueTracking.track(mockComponent);

    expect(checkbox.hasOwnProperty('checked')).toBe(true);
  });

  it('should initialize with the current value', function() {
    input.value = 'foo';

    inputValueTracking.track(mockComponent);

    var tracker = mockComponent._wrapperState.valueTracker;

    expect(tracker.getValue()).toEqual('foo');
  });

  it('should initialize with the current `checked`', function() {
    mockComponent._hostNode = checkbox;
    checkbox.checked = true;
    inputValueTracking.track(mockComponent);

    var tracker = mockComponent._wrapperState.valueTracker;

    expect(tracker.getValue()).toEqual('true');
  });

  it('should track value changes', function() {
    input.value = 'foo';

    inputValueTracking.track(mockComponent);

    var tracker = mockComponent._wrapperState.valueTracker;

    input.value = 'bar';
    expect(tracker.getValue()).toEqual('bar');
  });

  it('should tracked`checked` changes', function() {
    mockComponent._hostNode = checkbox;
    checkbox.checked = true;
    inputValueTracking.track(mockComponent);

    var tracker = mockComponent._wrapperState.valueTracker;

    checkbox.checked = false;
    expect(tracker.getValue()).toEqual('false');
  });

  it('should update value manually', function() {
    input.value = 'foo';
    inputValueTracking.track(mockComponent);

    var tracker = mockComponent._wrapperState.valueTracker;

    tracker.setValue('bar');
    expect(tracker.getValue()).toEqual('bar');
  });

  it('should coerce value to a string', function() {
    input.value = 'foo';
    inputValueTracking.track(mockComponent);

    var tracker = mockComponent._wrapperState.valueTracker;

    tracker.setValue(500);
    expect(tracker.getValue()).toEqual('500');
  });

  it('should update value if it changed and return result', function() {
    inputValueTracking.track(mockComponent);
    input.value = 'foo';

    var tracker = mockComponent._wrapperState.valueTracker;

    expect(inputValueTracking.updateValueIfChanged(mockComponent)).toBe(false);

    tracker.setValue('bar');

    expect(inputValueTracking.updateValueIfChanged(mockComponent)).toBe(true);

    expect(tracker.getValue()).toEqual('foo');
  });

  it('should track value and return true when updating untracked instance', function() {
    input.value = 'foo';

    expect(inputValueTracking.updateValueIfChanged(mockComponent)).toBe(true);

    var tracker = mockComponent._wrapperState.valueTracker;
    expect(tracker.getValue()).toEqual('foo');
  });

  it('should return tracker from node', function() {
    var node = ReactTestUtils.renderIntoDocument(
      <input type="text" defaultValue="foo" />,
    );
    var tracker = inputValueTracking._getTrackerFromNode(node);
    expect(tracker.getValue()).toEqual('foo');
  });

  it('should stop tracking', function() {
    inputValueTracking.track(mockComponent);

    expect(mockComponent._wrapperState.valueTracker).not.toEqual(null);

    inputValueTracking.stopTracking(mockComponent);

    expect(mockComponent._wrapperState.valueTracker).toEqual(null);

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
