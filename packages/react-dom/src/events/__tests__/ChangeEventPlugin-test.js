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

function getEvent(type, opts) {
  var event = document.createEvent('Event');
  event.initEvent(type, true, true);
  return event;
}

function dispatchEventOnNode(node, type) {
  //console.log(`Dispatch ${type}`, node.checked);
  var res = node.dispatchEvent(
    new Event( type, {bubbles: true, cancelable: true} ));
}

describe('ChangeEventPlugin', () => {
  it('should fire click for checkbox input', () => {
    var called = 0;

    function cb(e) {
      called = 1;
      expect(e.type).toBe('click');
    }

    var container = document.createElement('div');

    var stub = ReactDOM.render(
      <input type="checkbox" onClick={cb}/>,
      container
    );

    document.body.appendChild(container);

    var node = ReactDOM.findDOMNode(stub);

    setUntrackedChecked.call(node, false); // track and set to false
    dispatchEventOnNode(node, 'click'); // make it true

    expect(called).toBe(1); // onClick has been called
    expect(node.checked).toBe(true); // tracked property is now true

    document.body.removeChild(container);
  });

  it('should catch setting the value programmatically', () => {
    var container = document.createElement('div');
    var ref = ReactDOM.render(
      <input type="text" defaultValue="foo" />, container
    );
    var input = ReactDOM.findDOMNode(ref);
    setUntrackedValue.call(input, 'bar');

    expect(getTrackedValue(input)).toBe('bar');
  });

  it('should not fire change when setting the value programmatically', () => {
    var called = 0;

    function cb(e) {
      called += 1;
      expect(e.type).toBe('change');
    }

    var container = document.createElement('div');
    var ref = ReactDOM.render(
      <input type="text" onChange={cb} defaultValue="foo" />, container
    );
    var input = ReactDOM.findDOMNode(ref);

    input.value = 'bar';
    dispatchEventOnNode(input, 'change');
    expect(called).toBe(0);

    setUntrackedValue.call(input, 'foo');
    expect(input.value).toBe('foo');

    dispatchEventOnNode(input, 'change');
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
    input.dispatchEvent(getEvent('click'));
    expect(called).toBe(0);

    setUntrackedChecked.call(input, false);
    input.dispatchEvent(getEvent('click'));

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
    input.dispatchEvent(getEvent('click'));
    input.dispatchEvent(getEvent('click'));
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
      input.dispatchEvent(getEvent('change'));
      input.dispatchEvent(getEvent('change'));
      expect(called).toBe(1);

      called = 0;
      input = ReactTestUtils.renderIntoDocument(element);
      setUntrackedValue.call(input, '40');
      input.dispatchEvent(getEvent('input'));
      input.dispatchEvent(getEvent('input'));
      expect(called).toBe(1);

      called = 0;
      input = ReactTestUtils.renderIntoDocument(element);
      setUntrackedValue.call(input, '40');
      input.dispatchEvent(getEvent('input'));
      input.dispatchEvent(getEvent('change'));
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

    input.dispatchEvent(getEvent('input'));

    setUntrackedValue.call(input, 'foo');

    input.dispatchEvent(getEvent('change'));

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
    input.dispatchEvent(getEvent('input'));
    input.dispatchEvent(getEvent('change'));

    setUntrackedValue.call(input, 'foo');

    input.dispatchEvent(getEvent('input'));
    input.dispatchEvent(getEvent('change'));
    expect(called).toBe(2);
  });
});
