/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;

describe('SyntheticEvent', () => {
  let container;

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

  it('should be able to `preventDefault`', () => {
    let expectedCount = 0;

    const eventHandler = syntheticEvent => {
      expect(syntheticEvent.isDefaultPrevented()).toBe(false);
      syntheticEvent.preventDefault();
      expect(syntheticEvent.isDefaultPrevented()).toBe(true);
      expect(syntheticEvent.defaultPrevented).toBe(true);

      expectedCount++;
    };
    const node = ReactDOM.render(<div onClick={eventHandler} />, container);

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);
    node.dispatchEvent(event);

    expect(expectedCount).toBe(1);
  });

  it('should be prevented if nativeEvent is prevented', () => {
    let expectedCount = 0;

    const eventHandler = syntheticEvent => {
      expect(syntheticEvent.isDefaultPrevented()).toBe(true);

      expectedCount++;
    };
    const node = ReactDOM.render(<div onClick={eventHandler} />, container);

    let event;
    event = document.createEvent('Event');
    event.initEvent('click', true, true);
    event.preventDefault();
    node.dispatchEvent(event);

    event = document.createEvent('Event');
    event.initEvent('click', true, true);
    // Emulate IE8
    Object.defineProperty(event, 'defaultPrevented', {
      get() {},
    });
    Object.defineProperty(event, 'returnValue', {
      get() {
        return false;
      },
    });
    node.dispatchEvent(event);

    expect(expectedCount).toBe(2);
  });

  it('should be able to `stopPropagation`', () => {
    let expectedCount = 0;

    const eventHandler = syntheticEvent => {
      expect(syntheticEvent.isPropagationStopped()).toBe(false);
      syntheticEvent.stopPropagation();
      expect(syntheticEvent.isPropagationStopped()).toBe(true);

      expectedCount++;
    };
    const node = ReactDOM.render(<div onClick={eventHandler} />, container);

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);
    node.dispatchEvent(event);

    expect(expectedCount).toBe(1);
  });
});
