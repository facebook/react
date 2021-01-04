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

describe('SyntheticWheelEvent', () => {
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

  it('should normalize properties from the MouseEvent interface', () => {
    const events = [];
    const onWheel = event => {
      event.persist();
      events.push(event);
    };
    ReactDOM.render(<div onWheel={onWheel} />, container);

    container.firstChild.dispatchEvent(
      new MouseEvent('wheel', {
        bubbles: true,
        button: 1,
      }),
    );

    expect(events.length).toBe(1);
    expect(events[0].button).toBe(1);
  });

  it('should normalize properties from the WheelEvent interface', () => {
    const events = [];
    const onWheel = event => {
      event.persist();
      events.push(event);
    };
    ReactDOM.render(<div onWheel={onWheel} />, container);

    let event = new MouseEvent('wheel', {
      bubbles: true,
    });
    // jsdom doesn't support these so we add them manually.
    Object.assign(event, {
      deltaX: 10,
      deltaY: -50,
    });
    container.firstChild.dispatchEvent(event);

    event = new MouseEvent('wheel', {
      bubbles: true,
    });
    // jsdom doesn't support these so we add them manually.
    Object.assign(event, {
      wheelDeltaX: -10,
      wheelDeltaY: 50,
    });
    container.firstChild.dispatchEvent(event);

    expect(events.length).toBe(2);
    expect(events[0].deltaX).toBe(10);
    expect(events[0].deltaY).toBe(-50);
    expect(events[1].deltaX).toBe(10);
    expect(events[1].deltaY).toBe(-50);
  });

  it('should be able to `preventDefault` and `stopPropagation`', () => {
    const events = [];
    const onWheel = event => {
      expect(event.isDefaultPrevented()).toBe(false);
      event.preventDefault();
      expect(event.isDefaultPrevented()).toBe(true);
      event.persist();
      events.push(event);
    };
    ReactDOM.render(<div onWheel={onWheel} />, container);

    container.firstChild.dispatchEvent(
      new MouseEvent('wheel', {
        bubbles: true,
        deltaX: 10,
        deltaY: -50,
      }),
    );

    container.firstChild.dispatchEvent(
      new MouseEvent('wheel', {
        bubbles: true,
        deltaX: 10,
        deltaY: -50,
      }),
    );

    expect(events.length).toBe(2);
  });
});
