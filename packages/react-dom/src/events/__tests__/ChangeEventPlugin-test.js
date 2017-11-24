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

var setUntrackedChecked = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'checked',
).set;

var setUntrackedValue = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value',
).set;

describe('ChangeEventPlugin', () => {
  var container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('should fire change for checkbox input', () => {
    var called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    var node = ReactDOM.render(
      <input type="checkbox" onChange={cb} />,
      container,
    );

    expect(node.checked).toBe(false);
    node.dispatchEvent(
      new MouseEvent('click', {bubbles: true, cancelable: true}),
    );
    // Note: unlike with text input events, dispatching `click` actually
    // toggles the checkbox and updates its `checked` value.
    expect(node.checked).toBe(true);
    expect(called).toBe(1);

    expect(node.checked).toBe(true);
    node.dispatchEvent(
      new MouseEvent('click', {bubbles: true, cancelable: true}),
    );
    expect(node.checked).toBe(false);
    expect(called).toBe(2);
  });

  it('should not fire change setting the value programmatically', () => {
    var called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    var input = ReactDOM.render(
      <input type="text" defaultValue="foo" onChange={cb} />,
      container,
    );

    // We try to avoid firing "duplicate" React change events.
    // However, to tell which events are duplicates and should be ignored,
    // we are tracking the "current" input value, and only respect events
    // that occur after it changes. In this test, we verify that we can
    // keep track of the "current" value even if it is set programatically.

    // Set it programmatically.
    input.value = 'bar';
    // Even if a DOM input event fires, React sees that the real input value now
    // ('bar') is the same as the "current" one we already recorded.
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    expect(input.value).toBe('bar');
    // In this case we don't expect to get a React event.
    expect(called).toBe(0);

    // However, we can simulate user typing by calling the underlying setter.
    setUntrackedValue.call(input, 'foo');
    // Now, when the event fires, the real input value ('foo') differs from the
    // "current" one we previously recorded ('bar').
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    expect(input.value).toBe('foo');
    // In this case React should fire an event for it.
    expect(called).toBe(1);

    // Verify again that extra events without real changes are ignored.
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    expect(called).toBe(1);
  });

  // See a similar input test above for a detailed description of why.
  it('should not fire change when setting checked programmatically', () => {
    var called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    var input = ReactDOM.render(
      <input type="checkbox" onChange={cb} defaultChecked={false} />,
      container,
    );

    // Set the value, updating the "current" value that React tracks to true.
    input.checked = true;
    // Under the hood, uncheck the box so that the click will "check" it again.
    setUntrackedChecked.call(input, false);
    input.dispatchEvent(
      new MouseEvent('click', {bubbles: true, cancelable: true}),
    );
    expect(input.checked).toBe(true);
    // We don't expect a React event because at the time of the click, the real
    // checked value (true) was the same as the last recorded "current" value
    // (also true).
    expect(called).toBe(0);

    // However, simulating a normal click should fire a React event because the
    // real value (false) would have changed from the last tracked value (true).
    input.dispatchEvent(new Event('click', {bubbles: true, cancelable: true}));
    expect(called).toBe(1);
  });

  it('should unmount', () => {
    var input = ReactDOM.render(<input />, container);

    ReactDOM.unmountComponentAtNode(container);
  });

  it('should only fire change for checked radio button once', () => {
    var called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    var input = ReactDOM.render(
      <input type="radio" onChange={cb} />,
      container,
    );

    setUntrackedChecked.call(input, true);
    input.dispatchEvent(new Event('click', {bubbles: true, cancelable: true}));
    input.dispatchEvent(new Event('click', {bubbles: true, cancelable: true}));
    expect(called).toBe(1);
  });

  it('should deduplicate input value change events', () => {
    var called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    var input;
    ['text', 'number', 'range'].forEach(type => {
      called = 0;
      input = ReactDOM.render(<input type={type} onChange={cb} />, container);
      setUntrackedValue.call(input, '42');
      input.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );
      input.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );
      expect(called).toBe(1);
      ReactDOM.unmountComponentAtNode(container);

      called = 0;
      input = ReactDOM.render(<input type={type} onChange={cb} />, container);
      setUntrackedValue.call(input, '42');
      input.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      input.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      expect(called).toBe(1);
      ReactDOM.unmountComponentAtNode(container);

      called = 0;
      input = ReactDOM.render(<input type={type} onChange={cb} />, container);
      setUntrackedValue.call(input, '42');
      input.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      input.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );
      expect(called).toBe(1);
      ReactDOM.unmountComponentAtNode(container);
    });
  });

  it('should listen for both change and input events when supported', () => {
    var called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    var input = ReactDOM.render(
      <input type="range" onChange={cb} />,
      container,
    );

    setUntrackedValue.call(input, 'foo');
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));

    setUntrackedValue.call(input, 'bar');
    input.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));

    expect(called).toBe(2);
  });

  it('should only fire events when the value changes for range inputs', () => {
    var called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    var input = ReactDOM.render(
      <input type="range" onChange={cb} />,
      container,
    );
    setUntrackedValue.call(input, '40');
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    input.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));

    setUntrackedValue.call(input, 'foo');
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    input.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));

    expect(called).toBe(2);
  });
});
