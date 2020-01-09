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

  it('should be able to `persist`', () => {
    let node;
    let expectedCount = 0;
    let syntheticEvent;

    const eventHandler = e => {
      expect(e.isPersistent()).toBe(false);
      e.persist();
      syntheticEvent = e;
      expect(e.isPersistent()).toBe(true);

      expectedCount++;
    };
    node = ReactDOM.render(<div onClick={eventHandler} />, container);

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);
    node.dispatchEvent(event);

    expect(syntheticEvent.type).toBe('click');
    expect(syntheticEvent.bubbles).toBe(true);
    expect(syntheticEvent.cancelable).toBe(true);
    expect(expectedCount).toBe(1);
  });

  it('should be nullified and log warnings if the synthetic event has not been persisted', () => {
    let node;
    let expectedCount = 0;
    let syntheticEvent;

    const eventHandler = e => {
      syntheticEvent = e;

      expectedCount++;
    };
    node = ReactDOM.render(<div onClick={eventHandler} />, container);

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);
    node.dispatchEvent(event);

    const getExpectedWarning = property =>
      'Warning: This synthetic event is reused for performance reasons. If ' +
      `you're seeing this, you're accessing the property \`${property}\` on a ` +
      'released/nullified synthetic event. This is set to null. If you must ' +
      'keep the original synthetic event around, use event.persist(). ' +
      'See https://fb.me/react-event-pooling for more information.';

    // once for each property accessed
    expect(() =>
      expect(syntheticEvent.type).toBe(null),
    ).toErrorDev(getExpectedWarning('type'), {withoutStack: true});
    expect(() =>
      expect(syntheticEvent.nativeEvent).toBe(null),
    ).toErrorDev(getExpectedWarning('nativeEvent'), {withoutStack: true});
    expect(() =>
      expect(syntheticEvent.target).toBe(null),
    ).toErrorDev(getExpectedWarning('target'), {withoutStack: true});

    expect(expectedCount).toBe(1);
  });

  it('should warn when setting properties of a synthetic event that has not been persisted', () => {
    let node;
    let expectedCount = 0;
    let syntheticEvent;

    const eventHandler = e => {
      syntheticEvent = e;

      expectedCount++;
    };
    node = ReactDOM.render(<div onClick={eventHandler} />, container);

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);
    node.dispatchEvent(event);

    expect(() => {
      syntheticEvent.type = 'MouseEvent';
    }).toErrorDev(
      'Warning: This synthetic event is reused for performance reasons. If ' +
        "you're seeing this, you're setting the property `type` on a " +
        'released/nullified synthetic event. This is effectively a no-op. If you must ' +
        'keep the original synthetic event around, use event.persist(). ' +
        'See https://fb.me/react-event-pooling for more information.',
      {withoutStack: true},
    );
    expect(expectedCount).toBe(1);
  });

  it('should warn when calling `preventDefault` if the synthetic event has not been persisted', () => {
    let node;
    let expectedCount = 0;
    let syntheticEvent;

    const eventHandler = e => {
      syntheticEvent = e;
      expectedCount++;
    };
    node = ReactDOM.render(<div onClick={eventHandler} />, container);

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);
    node.dispatchEvent(event);

    expect(() =>
      syntheticEvent.preventDefault(),
    ).toErrorDev(
      'Warning: This synthetic event is reused for performance reasons. If ' +
        "you're seeing this, you're accessing the method `preventDefault` on a " +
        'released/nullified synthetic event. This is a no-op function. If you must ' +
        'keep the original synthetic event around, use event.persist(). ' +
        'See https://fb.me/react-event-pooling for more information.',
      {withoutStack: true},
    );
    expect(expectedCount).toBe(1);
  });

  it('should warn when calling `stopPropagation` if the synthetic event has not been persisted', () => {
    let node;
    let expectedCount = 0;
    let syntheticEvent;

    const eventHandler = e => {
      syntheticEvent = e;
      expectedCount++;
    };
    node = ReactDOM.render(<div onClick={eventHandler} />, container);

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);

    node.dispatchEvent(event);

    expect(() =>
      syntheticEvent.stopPropagation(),
    ).toErrorDev(
      'Warning: This synthetic event is reused for performance reasons. If ' +
        "you're seeing this, you're accessing the method `stopPropagation` on a " +
        'released/nullified synthetic event. This is a no-op function. If you must ' +
        'keep the original synthetic event around, use event.persist(). ' +
        'See https://fb.me/react-event-pooling for more information.',
      {withoutStack: true},
    );
    expect(expectedCount).toBe(1);
  });

  it('should warn when calling `isPropagationStopped` if the synthetic event has not been persisted', () => {
    let node;
    let expectedCount = 0;
    let syntheticEvent;

    const eventHandler = e => {
      syntheticEvent = e;
      expectedCount++;
    };
    node = ReactDOM.render(<div onClick={eventHandler} />, container);

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);
    node.dispatchEvent(event);

    expect(() =>
      expect(syntheticEvent.isPropagationStopped()).toBe(false),
    ).toErrorDev(
      'Warning: This synthetic event is reused for performance reasons. If ' +
        "you're seeing this, you're accessing the method `isPropagationStopped` on a " +
        'released/nullified synthetic event. This is a no-op function. If you must ' +
        'keep the original synthetic event around, use event.persist(). ' +
        'See https://fb.me/react-event-pooling for more information.',
      {withoutStack: true},
    );
    expect(expectedCount).toBe(1);
  });

  it('should warn when calling `isDefaultPrevented` if the synthetic event has not been persisted', () => {
    let node;
    let expectedCount = 0;
    let syntheticEvent;

    const eventHandler = e => {
      syntheticEvent = e;
      expectedCount++;
    };
    node = ReactDOM.render(<div onClick={eventHandler} />, container);

    const event = document.createEvent('Event');
    event.initEvent('click', true, true);
    node.dispatchEvent(event);

    expect(() =>
      expect(syntheticEvent.isDefaultPrevented()).toBe(false),
    ).toErrorDev(
      'Warning: This synthetic event is reused for performance reasons. If ' +
        "you're seeing this, you're accessing the method `isDefaultPrevented` on a " +
        'released/nullified synthetic event. This is a no-op function. If you must ' +
        'keep the original synthetic event around, use event.persist(). ' +
        'See https://fb.me/react-event-pooling for more information.',
      {withoutStack: true},
    );
    expect(expectedCount).toBe(1);
  });

  it('should properly log warnings when events simulated with rendered components', () => {
    let event;
    function assignEvent(e) {
      event = e;
    }
    const node = ReactDOM.render(<div onClick={assignEvent} />, container);
    node.click();

    // access a property to cause the warning
    expect(() => {
      event.nativeEvent; // eslint-disable-line no-unused-expressions
    }).toErrorDev(
      'Warning: This synthetic event is reused for performance reasons. If ' +
        "you're seeing this, you're accessing the property `nativeEvent` on a " +
        'released/nullified synthetic event. This is set to null. If you must ' +
        'keep the original synthetic event around, use event.persist(). ' +
        'See https://fb.me/react-event-pooling for more information.',
      {withoutStack: true},
    );
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
      }).toErrorDev(
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
