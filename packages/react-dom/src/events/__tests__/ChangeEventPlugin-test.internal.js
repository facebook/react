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


    node.dispatchEvent(new Event('click'));
    expect(called).toBe(0);

    setUntrackedChecked.call(node, false);
    node.dispatchEvent(new Event('click', {bubbles: true, cancelable: true}));
    expect(called).toBe(1);
    expect(node.checked).toBe(true);

    setUntrackedChecked.call(node, true);
    node.dispatchEvent(new Event('click', {bubbles: true, cancelable: true}));
    expect(called).toBe(2);
    expect(node.checked).toBe(false);
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

    input.value = 'bar';
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    expect(called).toBe(0);

    setUntrackedValue.call(input, 'foo');
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));

    expect(called).toBe(1);
    expect(input.value).toBe('foo');

    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    expect(called).toBe(1);
  });

  it('should not fire change when setting checked programmatically', () => {
    var called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    var input = ReactDOM.render(
      <input type="checkbox" onChange={cb} defaultChecked={true} />,
      container,
    );

    //set programmatically
    input.checked = true;

    setUntrackedChecked.call(input, false);
    input.dispatchEvent(new Event('click', {bubbles: true, cancelable: true}));
    expect(called).toBe(0);

    setUntrackedChecked.call(input, true);
    input.dispatchEvent(new Event('click', {bubbles: true, cancelable: true}));

    expect(called).toBe(1);
  });

  it('should catch setting the value programmatically', () => {
    var called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    var input = ReactDOM.render(
      <input type="text" onChange={cb} defaultValue="foo" />,
      container,
    );

    setUntrackedValue.call(input, 'bar');
    expect(called).toBe(0);
    expect(getTrackedValue(input)).toBe('bar');
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

    var input = ReactDOM.render(<input type="text" onChange={cb} />, container);

    setUntrackedValue.call(input, 'foo');

    input.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));
    input.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));

    expect(called).toBe(1);

    setUntrackedValue.call(input, 'bar');

    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));

    expect(called).toBe(2);

    setUntrackedValue.call(input, 'foobar');

    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    input.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));

    expect(called).toBe(3);
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

    setUntrackedValue.call(input, '0');
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));

    setUntrackedValue.call(input, '1');
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
