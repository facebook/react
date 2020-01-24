/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {createEventTarget} from 'dom-event-testing-library';

let React;
let ReactFeatureFlags;
let ReactDOM;
let useDrag;

describe('Drag event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableDeprecatedFlareAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    useDrag = require('react-interactions/events/drag').useDrag;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.render(null, container);
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
      const listener = useDrag({
        onDragChange: handleOnDrag,
      });
      return (
        <div ref={divRef} DEPRECATED_flareListeners={listener}>
          Drag me!
        </div>
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

    const target = createEventTarget(divRef.current);
    target.pointerup();

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
      const listener = useDrag({
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
      });
      return (
        <div ref={divRef} DEPRECATED_flareListeners={listener}>
          Drag me!
        </div>
      );
    }

    ReactDOM.render(<Component />, container);

    const target = createEventTarget(divRef.current);
    target.pointerdown();

    for (let index = 0; index <= 20; index++) {
      target.pointermove({
        x: index,
        y: index,
      });
    }

    target.pointerup();

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
      const listener = useDrag({
        onDragMove: handleDragMove,
      });
      return (
        <div ref={divRef} DEPRECATED_flareListeners={listener}>
          Drag me!
        </div>
      );
    }

    ReactDOM.render(<Component />, container);

    const target = createEventTarget(divRef.current);

    target.pointerdown();

    for (let index = 0; index <= 20; index++) {
      target.pointermove({
        x: index + 1,
        y: index + 1,
      });
    }

    target.pointerup();

    expect(events).toHaveLength(20);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          diffX: 2,
          diffY: 2,
        }),
        expect.objectContaining({
          diffX: 21,
          diffY: 21,
        }),
      ]),
    );
  });
});
