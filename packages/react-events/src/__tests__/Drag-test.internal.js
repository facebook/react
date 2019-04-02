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
let ReactFeatureFlags;
let ReactDOM;
let Drag;
let dragMoveOptions = [
  'mousemove',
  true, //canBubble
  true, //cancelable
  window, //event's AbstractView : should be window
  1, // detail : Event's mouse click count
  50, // screenX
  50, // screenY
  50, // clientX
  50, // clientY
];

describe('Drag event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableEventAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    Drag = require('react-events/drag');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('should support onDragChange', () => {
    let divRef = React.createRef();
    let events = [];

    function handleOnDrag(e) {
      if (e) {
        events.push('dragging');
      } else {
        events.push('dragend');
      }
    }

    function Component() {
      return (
        <Drag onDragChange={handleOnDrag}>
          <div ref={divRef}>Drag me!</div>
        </Drag>
      );
    }

    ReactDOM.render(<Component />, container);

    const mouseOverEvent = document.createEvent('Event');
    mouseOverEvent.initEvent('mousedown', true, true);
    divRef.current.dispatchEvent(mouseOverEvent);

    const mouseOutEvent = document.createEvent('MouseEvents');
    mouseOutEvent.initMouseEvent(...dragMoveOptions);
    divRef.current.dispatchEvent(mouseOutEvent);

    const mouseUpEvent = document.createEvent('Event');
    mouseUpEvent.initEvent('mouseup', true, true);
    divRef.current.dispatchEvent(mouseUpEvent);

    expect(events).toEqual(['dragging', 'dragend']);
  });

  it('should support onDragStart and onDragEnd', () => {
    let divRef = React.createRef();
    let events = [];

    function handleDragStart() {
      events.push('dragstart');
    }

    function handleDragEnd() {
      events.push('dragend');
    }

    function Component() {
      return (
        <Drag onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div ref={divRef}>Drag me!</div>
        </Drag>
      );
    }

    ReactDOM.render(<Component />, container);

    const mouseOverEvent = document.createEvent('Event');
    mouseOverEvent.initEvent('mousedown', true, true);
    divRef.current.dispatchEvent(mouseOverEvent);

    const mouseOutEvent = document.createEvent('MouseEvents');
    mouseOutEvent.initMouseEvent(...dragMoveOptions);
    divRef.current.dispatchEvent(mouseOutEvent);

    const mouseUpEvent = document.createEvent('Event');
    mouseUpEvent.initEvent('mouseup', true, true);
    divRef.current.dispatchEvent(mouseUpEvent);

    expect(events).toEqual(['dragstart', 'dragend']);
  });
});
