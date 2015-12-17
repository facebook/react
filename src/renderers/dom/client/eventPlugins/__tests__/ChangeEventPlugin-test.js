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

var React = require('React');
var ReactTestUtils = require('ReactTestUtils');

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

  it('should listen for both change and input events for range inputs', function() {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    var input = ReactTestUtils.renderIntoDocument(<input type="range" onChange={cb}/>);

    ReactTestUtils.SimulateNative.input(input);
    input.value = 'foo';
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
    input.value = 'foo';
    ReactTestUtils.SimulateNative.input(input);
    ReactTestUtils.SimulateNative.change(input);
    expect(called).toBe(2);
  });
});
