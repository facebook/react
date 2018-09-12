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
    let node;
    let expectedCount = 0;

    const eventHandler = syntheticEvent => {
      expect(syntheticEvent.isDefaultPrevented()).toBe(false);
      syntheticEvent.preventDefault();
      expect(syntheticEvent.isDefaultPrevented()).toBe(true);
      expect(syntheticEvent.defaultPrevented).toBe(true);

      expectedCount++;
    };
    node = ReactDOM.render(<div onClick={eventHandler} />, container);

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);
    node.dispatchEvent(event);

    expect(expectedCount).toBe(1);
  });

  it('should be prevented if nativeEvent is prevented', () => {
    let node;
    let expectedCount = 0;

    const eventHandler = syntheticEvent => {
      expect(syntheticEvent.isDefaultPrevented()).toBe(true);

      expectedCount++;
    };
    node = ReactDOM.render(<div onClick={eventHandler} />, container);

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
    let node;
    let expectedCount = 0;

    const eventHandler = syntheticEvent => {
      expect(syntheticEvent.isPropagationStopped()).toBe(false);
      syntheticEvent.stopPropagation();
      expect(syntheticEvent.isPropagationStopped()).toBe(true);

      expectedCount++;
    };
    node = ReactDOM.render(<div onClick={eventHandler} />, container);

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);
    node.dispatchEvent(event);

    expect(expectedCount).toBe(1);
  });

  it('should indicate that it is persisted and warn when calling `persist`', () => {
    let node;
    let syntheticEvent;

    const eventHandler = e => {
      expect(e.isPersistent()).toBe(true);
      expect(() => e.persist()).toWarnDev(
        'Deprecated SyntheticEvent.persist called for click event',
        {withoutStack: true},
      );
      syntheticEvent = e;
      expect(e.isPersistent()).toBe(true);
    };
    node = ReactDOM.render(<div onClick={eventHandler} />, container);

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);
    node.dispatchEvent(event);

    expect(syntheticEvent.type).toBe('click');
  });

  // TODO: we might want to re-add a warning like this in the future,
  // but it shouldn't use Proxies because they make debugging difficult.
  // Or we might disallow this pattern altogether:
  // https://github.com/facebook/react/issues/13224
  xit('should warn if a property is added to the synthetic event', () => {
    let node;
    let expectedCount = 0;
    let syntheticEvent;

    const eventHandler = e => {
      expect(() => {
        e.foo = 'bar';
      }).toWarnDev(
        'Warning: This synthetic event is reused for performance reasons. If ' +
          "you're seeing this, you're adding a new property in the synthetic " +
          'event object. The property is never released. ' +
          'See https://fb.me/react-event-pooling for more information.',
        {withoutStack: true},
      );
      syntheticEvent = e;
      expectedCount++;
    };
    node = ReactDOM.render(<div onClick={eventHandler} />, container);

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);

    node.dispatchEvent(event);

    expect(syntheticEvent.foo).toBe('bar');
    expect(expectedCount).toBe(1);
  });
});
