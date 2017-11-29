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

  // See https://github.com/facebook/react/pull/3639 for details.
  it('does not get confused when dependent events are registered independently', () => {
    var select = jest.fn();
    var onSelect = event => {
      expect(typeof event).toBe('object');
      expect(event.type).toBe('select');
      expect(event.target).toBe(node);
      select(event.currentTarget);
    };

    // Pass `onMouseDown` so React registers a top-level listener.
    var node = ReactDOM.render(
      <input type="text" onMouseDown={function() {}} />,
      container,
    );
    node.focus();

    // Trigger `mousedown` and `mouseup`. Note that
    // React is not currently listening to `mouseup`.
    node.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      }),
    );
    node.dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
      }),
    );

    // Now subscribe to `onSelect`.
    ReactDOM.render(<input type="text" onSelect={onSelect} />, container);
    node.focus();

    // This triggers a `select` event in our polyfill.
    node.dispatchEvent(
      new KeyboardEvent('keydown', {bubbles: true, cancelable: true}),
    );

    // Verify that it doesn't get "stuck" waiting for
    // a `mouseup` event that it has "missed" because
    // a top-level listener didn't exist yet.
    expect(select.mock.calls.length).toBe(1);
  });

  it('should fire `onSelect` when a listener is present', () => {
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
