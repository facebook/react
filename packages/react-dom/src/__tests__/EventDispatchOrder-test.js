/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

describe('EventDispatchOrder', () => {
  let container;

  // The order we receive here is not ideal since it is expected that the
  // capture listener fire before all bubble listeners. Other React apps
  // might depend on this.
  //
  // @see https://github.com/facebook/react/pull/12919#issuecomment-395224674
  const expectedOrder = [
    'document capture',
    'inner capture',
    'inner bubble',
    'outer capture',
    'outer bubble',
    'document bubble',
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  function produceDispatchOrder(event, reactEvent) {
    const eventOrder = [];
    const track = tag => () => eventOrder.push(tag);
    const outerRef = React.createRef();
    const innerRef = React.createRef();

    function OuterReactApp() {
      return React.createElement('div', {
        ref: outerRef,
        [reactEvent]: track('outer bubble'),
        [reactEvent + 'Capture']: track('outer capture'),
      });
    }

    function InnerReactApp() {
      return React.createElement('div', {
        ref: innerRef,
        [reactEvent]: track('inner bubble'),
        [reactEvent + 'Capture']: track('inner capture'),
      });
    }

    ReactDOM.unmountComponentAtNode(container);
    ReactDOM.render(<OuterReactApp />, container);

    ReactDOM.unmountComponentAtNode(outerRef.current);
    ReactDOM.render(<InnerReactApp />, outerRef.current);

    const trackDocBubble = track('document bubble');
    const trackDocCapture = track('document capture');

    document.addEventListener(event, trackDocBubble);
    document.addEventListener(event, trackDocCapture, true);

    innerRef.current.dispatchEvent(new Event(event, {bubbles: true}));

    document.removeEventListener(event, trackDocBubble);
    document.removeEventListener(event, trackDocCapture, true);

    return eventOrder;
  }

  it('dispatches standard events in the correct order', () => {
    expect(produceDispatchOrder('click', 'onClick')).toEqual(expectedOrder);
  });

  // Scroll and Wheel are attached as captured events directly to the element
  describe('scrolling events', () => {
    it('dispatches scroll events in the correct order', () => {
      expect(produceDispatchOrder('scroll', 'onScroll')).toEqual(expectedOrder);
    });

    it('dispatches scroll events in the correct order', () => {
      expect(produceDispatchOrder('wheel', 'onWheel')).toEqual(expectedOrder);
    });
  });

  // Touch events are attached as bubbled events directly to the element
  describe('touch events', () => {
    it('dispatches touchstart in the correct order', () => {
      expect(produceDispatchOrder('touchstart', 'onTouchStart')).toEqual(
        expectedOrder,
      );
    });

    it('dispatches touchend in the correct order', () => {
      expect(produceDispatchOrder('touchend', 'onTouchEnd')).toEqual(
        expectedOrder,
      );
    });

    it('dispatches touchmove in the correct order', () => {
      expect(produceDispatchOrder('touchmove', 'onTouchMove')).toEqual(
        expectedOrder,
      );
    });

    it('dispatches touchmove in the correct order', () => {
      expect(produceDispatchOrder('touchcancel', 'onTouchCancel')).toEqual(
        expectedOrder,
      );
    });
  });
});
