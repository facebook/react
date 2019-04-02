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
let Hover;

describe('Hover event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableEventAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    Hover = require('react-events/hover');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('should support onHover', () => {
    let divRef = React.createRef();
    let events = [];

    function handleOnHover(e) {
      if (e) {
        events.push('hover in');
      } else {
        events.push('hover out');
      }
    }

    function Component() {
      return (
        <Hover onHoverChange={handleOnHover}>
          <div ref={divRef}>Hover me!</div>
        </Hover>
      );
    }

    ReactDOM.render(<Component />, container);

    const mouseOverEvent = document.createEvent('Event');
    mouseOverEvent.initEvent('mouseover', true, true);
    divRef.current.dispatchEvent(mouseOverEvent);

    const mouseOutEvent = document.createEvent('Event');
    mouseOutEvent.initEvent('mouseout', true, true);
    divRef.current.dispatchEvent(mouseOutEvent);

    expect(events).toEqual(['hover in', 'hover out']);
  });

  it('should support onHoverStart and onHoverEnd', () => {
    let divRef = React.createRef();
    let events = [];

    function handleOnHoverStart() {
      events.push('onHoverStart');
    }

    function handleOnHoverEnd() {
      events.push('onHoverEnd');
    }

    function Component() {
      return (
        <Hover onHoverStart={handleOnHoverStart} onHoverEnd={handleOnHoverEnd}>
          <div ref={divRef}>Hover me!</div>
        </Hover>
      );
    }

    ReactDOM.render(<Component />, container);

    const mouseOverEvent = document.createEvent('Event');
    mouseOverEvent.initEvent('mouseover', true, true);
    divRef.current.dispatchEvent(mouseOverEvent);

    const mouseOutEvent = document.createEvent('Event');
    mouseOutEvent.initEvent('mouseout', true, true);
    divRef.current.dispatchEvent(mouseOutEvent);

    expect(events).toEqual(['onHoverStart', 'onHoverEnd']);
  });
});
