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

    setUntrackedValue(input, true);
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

    setUntrackedValue(input, 'foo');
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

    input.checked = false;
    setTrackedValue(input, undefined);
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
    setUntrackedValue(input, true);
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

      setUntrackedValue(input, '40');
      ReactTestUtils.SimulateNative.change(input);
      ReactTestUtils.SimulateNative.change(input);
      expect(called).toBe(1);

      called = 0;
      input = ReactTestUtils.renderIntoDocument(element);
      setUntrackedValue(input, '40');
      ReactTestUtils.SimulateNative.input(input);
      ReactTestUtils.SimulateNative.input(input);
      expect(called).toBe(1);

      called = 0;
      input = ReactTestUtils.renderIntoDocument(element);
      setUntrackedValue(input, '40');
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

    if (!ChangeEventPlugin._isInputEventSupported) {
      return;
    }

    var input = ReactTestUtils.renderIntoDocument(
      <input type="range" onChange={cb} />,
    );
    setUntrackedValue(input, 'bar');

    ReactTestUtils.SimulateNative.input(input);

    setUntrackedValue(input, 'foo');

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
    setUntrackedValue(input, '40');
    ReactTestUtils.SimulateNative.input(input);
    ReactTestUtils.SimulateNative.change(input);

    setUntrackedValue(input, 'foo');

    ReactTestUtils.SimulateNative.input(input);
    ReactTestUtils.SimulateNative.change(input);
    expect(called).toBe(2);
  });

  describe('composition events', () => {
    function simulateEvent(inst, event) {
      ReactTestUtils.SimulateNative[event](inst);
    }

    function TestCompositionEvent(Scenario) {
      var called = 0;
      var value = null;

      function cb(e) {
        called += 1;
        value = e.target.value;
      }

      var input = ReactTestUtils.renderIntoDocument(
        <input type="text" onChange={cb} />,
      );

      Scenario.forEach(el => {
        el.run.apply(null, [input].concat(el.args));
      });

      expect(called).toBe(1);
      expect(value).toBe('你');
    }

    var Scenario = {
      ChromeUnder53: [
        {run: setUntrackedValue, args: ['n']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionStart']},
        {run: simulateEvent, args: ['compositionUpdate']},
        {run: simulateEvent, args: ['input']},
        {run: simulateEvent, args: ['keyUp']},
        {run: setUntrackedValue, args: ['ni']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionUpdate']},
        {run: simulateEvent, args: ['input']},
        {run: simulateEvent, args: ['keyUp']},
        {run: setUntrackedValue, args: ['你']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionEnd']},
        {run: simulateEvent, args: ['textInput']},
        {run: simulateEvent, args: ['input']},
        {run: simulateEvent, args: ['keyUp']},
      ],
      Chrome: [
        {run: setUntrackedValue, args: ['n']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionStart']},
        {run: simulateEvent, args: ['compositionUpdate']},
        {run: simulateEvent, args: ['input']},
        {run: simulateEvent, args: ['keyUp']},
        {run: setUntrackedValue, args: ['ni']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionUpdate']},
        {run: simulateEvent, args: ['input']},
        {run: simulateEvent, args: ['keyUp']},
        {run: setUntrackedValue, args: ['你']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionUpdate']},
        {run: simulateEvent, args: ['textInput']},
        {run: simulateEvent, args: ['input']},
        {run: simulateEvent, args: ['compositionEnd']},
        {run: simulateEvent, args: ['keyUp']},
      ],
      Firefox: [
        {run: setUntrackedValue, args: ['n']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionStart']},
        {run: simulateEvent, args: ['compositionUpdate']},
        {run: simulateEvent, args: ['input']},
        {run: setUntrackedValue, args: ['ni']},
        {run: simulateEvent, args: ['compositionUpdate']},
        {run: simulateEvent, args: ['input']},
        {run: setUntrackedValue, args: ['你']},
        {run: simulateEvent, args: ['compositionUpdate']},
        {run: simulateEvent, args: ['compositionEnd']},
        {run: simulateEvent, args: ['input']},
        {run: simulateEvent, args: ['keyUp']},
      ],
      IE9: [
        {run: setUntrackedValue, args: ['n']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionStart']},
        {run: simulateEvent, args: ['compositionUpdate']},
        {run: simulateEvent, args: ['keyUp']},
        {run: setUntrackedValue, args: ['ni']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionUpdate']},
        {run: simulateEvent, args: ['keyUp']},
        {run: setUntrackedValue, args: ['你']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['input']},
        {run: simulateEvent, args: ['compositionUpdate']},
        {run: simulateEvent, args: ['compositionEnd']},
        {run: simulateEvent, args: ['keyUp']},
      ],
      IE10: [
        {run: setUntrackedValue, args: ['n']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionStart']},
        {run: simulateEvent, args: ['keyUp']},
        {run: setUntrackedValue, args: ['ni']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['keyUp']},
        {run: setUntrackedValue, args: ['你']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['keyUp']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionEnd']},
        {run: simulateEvent, args: ['input']},
        {run: simulateEvent, args: ['keyUp']},
      ],
      IE11: [
        {run: setUntrackedValue, args: ['n']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionStart']},
        {run: simulateEvent, args: ['compositionUpdate']},
        {run: simulateEvent, args: ['input']},
        {run: simulateEvent, args: ['keyUp']},
        {run: setUntrackedValue, args: ['ni']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['input']},
        {run: simulateEvent, args: ['keyUp']},
        {run: setUntrackedValue, args: ['你']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionEnd']},
        {run: simulateEvent, args: ['input']},
        {run: simulateEvent, args: ['keyUp']},
      ],
      Edge: [
        {run: setUntrackedValue, args: ['n']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionStart']},
        {run: simulateEvent, args: ['keyUp']},
        {run: setUntrackedValue, args: ['ni']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['keyUp']},
        {run: setUntrackedValue, args: ['你']},
        {run: simulateEvent, args: ['keyDown']},
        {run: simulateEvent, args: ['compositionEnd']},
        {run: simulateEvent, args: ['input']},
      ],
    };

    it('should only fire change once on Chrome', () => {
      TestCompositionEvent(Scenario.Chrome);
    });

    it('should only fire change once on Chrome under 53', () => {
      TestCompositionEvent(Scenario.ChromeUnder53);
    });

    it('should only fire change once on Firefox', () => {
      TestCompositionEvent(Scenario.Firefox);
    });

    it('should only fire change once on IE9', () => {
      TestCompositionEvent(Scenario.IE9);
    });

    it('should only fire change once on IE10', () => {
      TestCompositionEvent(Scenario.IE10);
    });

    it('should only fire change once on IE11', () => {
      TestCompositionEvent(Scenario.IE11);
    });

    it('should only fire change once on Edge', () => {
      TestCompositionEvent(Scenario.Edge);
    });
  });
});
