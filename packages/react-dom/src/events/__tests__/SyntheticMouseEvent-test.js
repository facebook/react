/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;

describe('SyntheticMouseEvent', () => {
  let container;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');

    // The container has to be attached for events to fire.
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('should only use values from movementX/Y when event type is mousemove', () => {
    const events = [];
    const onMouseMove = event => {
      events.push(event.movementX);
    };

    const onMouseDown = event => {
      events.push(event.movementX);
    };

    const node = ReactDOM.render(
      <div onMouseMove={onMouseMove} onMouseDown={onMouseDown} />,
      container,
    );

    let event = new MouseEvent('mousemove', {
      relatedTarget: null,
      bubbles: true,
      screenX: 2,
      screenY: 2,
    });

    node.dispatchEvent(event);

    event = new MouseEvent('mousemove', {
      relatedTarget: null,
      bubbles: true,
      screenX: 8,
      screenY: 8,
    });

    node.dispatchEvent(event);

    // Now trigger a mousedown event to see if movementX has changed back to 0
    event = new MouseEvent('mousedown', {
      relatedTarget: null,
      bubbles: true,
      screenX: 25,
      screenY: 65,
    });

    node.dispatchEvent(event);

    expect(events.length).toBe(3);
    expect(events[0]).toBe(0);
    expect(events[1]).toBe(6);
    expect(events[2]).toBe(0); // mousedown event should have movementX at 0
  });
});
