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

    function handleOnDrag() {
      events.push({isChanged: true});
    }

    function Component() {
      return (
        <Drag onDragChange={handleOnDrag}>
          <div ref={divRef}>Drag me!</div>
        </Drag>
      );
    }

    ReactDOM.render(<Component />, container);

    const mouseOverEvent = document.createEvent('MouseEvents');
    mouseOverEvent.initEvent('mousedown', true, true);
    divRef.current.dispatchEvent(mouseOverEvent);

    const mouseMoveEvent = document.createEvent('MouseEvents');
    for (let index = 0; index <= 20; index++) {
      mouseMoveEvent.initMouseEvent(
        'mousemove',
        true,
        true,
        window,
        1,
        index,
        index,
        50,
        50,
      );
      divRef.current.dispatchEvent(mouseMoveEvent);
    }
    divRef.current.dispatchEvent(mouseMoveEvent);

    const mouseUpEvent = document.createEvent('MouseEvents');
    mouseUpEvent.initEvent('mouseup', true, true);
    divRef.current.dispatchEvent(mouseUpEvent);

    expect(events).toHaveLength(2);
    expect(events).toEqual(
      expect.arrayContaining([expect.objectContaining({isChanged: true})]),
    );
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

    const mouseOverEvent = document.createEvent('MouseEvents');
    mouseOverEvent.initEvent('mousedown', true, true);
    divRef.current.dispatchEvent(mouseOverEvent);

    const mouseMoveEvent = document.createEvent('MouseEvents');
    for (let index = 0; index <= 20; index++) {
      mouseMoveEvent.initMouseEvent(
        'mousemove',
        true,
        true,
        window,
        1,
        index,
        index,
        50,
        50,
      );
      divRef.current.dispatchEvent(mouseMoveEvent);
    }
    divRef.current.dispatchEvent(mouseMoveEvent);

    const mouseUpEvent = document.createEvent('MouseEvents');
    mouseUpEvent.initEvent('mouseup', true, true);
    divRef.current.dispatchEvent(mouseUpEvent);

    expect(events).toEqual(['dragstart', 'dragend']);
  });

  it('should support onDragMove', () => {
    let divRef = React.createRef();
    let events = [];

    function handleDragMove(e) {
      events.push({
        diffX: e.diffX,
        diffY: e.diffY,
      });
    }

    function Component() {
      return (
        <Drag onDragMove={handleDragMove}>
          <div ref={divRef}>Drag me!</div>
        </Drag>
      );
    }

    ReactDOM.render(<Component />, container);

    const mouseOverEvent = document.createEvent('MouseEvents');
    mouseOverEvent.initEvent('mousedown', true, true);
    divRef.current.dispatchEvent(mouseOverEvent);

    const mouseMoveEvent = document.createEvent('MouseEvents');
    for (let index = 0; index <= 20; index++) {
      mouseMoveEvent.initMouseEvent(
        'mousemove',
        true,
        true,
        window,
        1,
        index,
        index,
        50,
        50,
      );
      divRef.current.dispatchEvent(mouseMoveEvent);
    }

    const mouseUpEvent = document.createEvent('MouseEvents');
    mouseUpEvent.initEvent('mouseup', true, true);
    divRef.current.dispatchEvent(mouseUpEvent);
    expect(events).toHaveLength(20);
    let index = 0;
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          diffX: index,
          diffY: index++,
        }),
      ]),
    );
  });
});
