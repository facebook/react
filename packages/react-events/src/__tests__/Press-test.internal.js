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
let Press;

describe('Press event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableEventAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    Press = require('react-events/press');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('should support onPress', () => {
    let buttonRef = React.createRef();
    let events = [];

    function handleOnPress1() {
      events.push('press 1');
    }

    function handleOnPress2() {
      events.push('press 2');
    }

    function handleOnMouseDown() {
      events.push('mousedown');
    }

    function handleKeyDown() {
      events.push('keydown');
    }

    function Component() {
      return (
        <Press onPress={handleOnPress1}>
          <Press onPress={handleOnPress2}>
            <button
              ref={buttonRef}
              onMouseDown={handleOnMouseDown}
              onKeyDown={handleKeyDown}>
              Press me!
            </button>
          </Press>
        </Press>
      );
    }

    ReactDOM.render(<Component />, container);

    const mouseDownEvent = document.createEvent('Event');
    mouseDownEvent.initEvent('mousedown', true, true);
    buttonRef.current.dispatchEvent(mouseDownEvent);

    const mouseUpEvent = document.createEvent('Event');
    mouseUpEvent.initEvent('mouseup', true, true);
    buttonRef.current.dispatchEvent(mouseUpEvent);

    expect(events).toEqual(['mousedown', 'press 2', 'press 1']);

    events = [];
    const keyDownEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    buttonRef.current.dispatchEvent(keyDownEvent);

    // press 1 should not occur as press 2 will preventDefault
    expect(events).toEqual(['keydown', 'press 2']);
  });

  it('should support onPressStart and onPressEnd', () => {
    let divRef = React.createRef();
    let events = [];

    function handleOnPressStart() {
      events.push('onPressStart');
    }

    function handleOnPressEnd() {
      events.push('onPressEnd');
    }

    function Component() {
      return (
        <Press onPressStart={handleOnPressStart} onPressEnd={handleOnPressEnd}>
          <div ref={divRef}>Press me!</div>
        </Press>
      );
    }

    ReactDOM.render(<Component />, container);

    const pointerEnterEvent = document.createEvent('Event');
    pointerEnterEvent.initEvent('pointerdown', true, true);
    divRef.current.dispatchEvent(pointerEnterEvent);

    const pointerLeaveEvent = document.createEvent('Event');
    pointerLeaveEvent.initEvent('pointerup', true, true);
    divRef.current.dispatchEvent(pointerLeaveEvent);

    expect(events).toEqual(['onPressStart', 'onPressEnd']);
  });
});
