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

describe('SyntheticMouseEvent', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
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

  it('should correctly calculate movementX/Y for capture phase', () => {
    const events = [];
    const onMouseMove = event => {
      events.push(['move', false, event.movementX, event.movementY]);
    };
    const onMouseMoveCapture = event => {
      events.push(['move', true, event.movementX, event.movementY]);
    };
    const onMouseDown = event => {
      events.push(['down', false, event.movementX, event.movementY]);
    };
    const onMouseDownCapture = event => {
      events.push(['down', true, event.movementX, event.movementY]);
    };

    const node = ReactDOM.render(
      <div
        onMouseMove={onMouseMove}
        onMouseMoveCapture={onMouseMoveCapture}
        onMouseDown={onMouseDown}
        onMouseDownCapture={onMouseDownCapture}
      />,
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
      screenY: 9,
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

    expect(events).toEqual([
      ['move', true, 0, 0],
      ['move', false, 0, 0],
      ['move', true, 6, 7],
      ['move', false, 6, 7],
      ['down', true, 0, 0],
      ['down', false, 0, 0],
    ]);
  });
});
