/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOM;

describe('SelectEventPlugin', () => {
  var container;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('should verify that `onSelect` fails to fire when no `topMouseUp` has yet occurred to unset the flag', () => {
    var select = jest.fn();
    var onSelect = event => select(event.currentTarget);

    var node = ReactDOM.render(
      <input type="text" onSelect={onSelect} />,
      container,
    );
    node.focus();

    var nativeEvent = new MouseEvent('focus', {
      bubbles: true,
      cancelable: true,
    });
    node.dispatchEvent(nativeEvent);

    nativeEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    node.dispatchEvent(nativeEvent);

    nativeEvent = new MouseEvent('keyup', {bubbles: true, cancelable: true});
    node.dispatchEvent(nativeEvent);
    expect(select.mock.calls.length).toBe(0);
  });

  it('should verify that `onSelect` fires when the listener is present', () => {
    var select = jest.fn();
    var onSelect = event => {
      expect(typeof event).toBe('object');
      expect(event.type).toBe('select');
      expect(event.target).toBe(node);
      select(event.currentTarget);
    };

    var node = ReactDOM.render(
      <input type="text" onSelect={onSelect} />,
      container,
    );
    node.focus();

    var nativeEvent = new MouseEvent('focus', {
      bubbles: true,
      cancelable: true,
    });
    node.dispatchEvent(nativeEvent);
    expect(select.mock.calls.length).toBe(0);

    nativeEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    node.dispatchEvent(nativeEvent);
    expect(select.mock.calls.length).toBe(0);

    nativeEvent = new MouseEvent('mouseup', {bubbles: true, cancelable: true});
    node.dispatchEvent(nativeEvent);
    expect(select.mock.calls.length).toBe(1);
  });
});
