/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOM;
var ReactTestUtils;

describe('SyntheticEvent', () => {
  var createEvent;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    createEvent = (eventInit, eventOptions) => {
      const defaultEventInit = {
        bubbles: true,
        cancelable: true,
        ...eventOptions,
      };
      var event = new Event(eventInit, defaultEventInit);
      event.initEvent(
        eventInit,
        defaultEventInit.bubbles,
        defaultEventInit.cancelable,
      );
      return event;
    };
  });

  it('should normalize `target` from the nativeEvent', () => {
    var click = jest.fn();
    var container = document.createElement('div');

    var onClick = e => click(e.target);

    var instance = ReactDOM.render(<div onClick={onClick} />, container);

    document.body.appendChild(container);

    var event = createEvent('click', {srcElement: instance});
    var elem = ReactDOM.findDOMNode(instance);
    elem.dispatchEvent(event);
    expect(click).toBeCalledWith(elem);
    document.body.removeChild(container);
  });

  it('should be able to `preventDefault`', () => {
    var click = jest.fn();
    var container = document.createElement('div');

    var onClick = e => {
      click(e.isDefaultPrevented());
      e.preventDefault();
      click(e.isDefaultPrevented());
    };

    var instance = ReactDOM.render(<div onClick={onClick} />, container);

    document.body.appendChild(container);

    var event = createEvent('click', {srcElement: instance});
    var elem = ReactDOM.findDOMNode(instance);
    elem.dispatchEvent(event);
    expect(click.mock.calls[0][0]).toBe(false);
    expect(click.mock.calls[1][0]).toBe(true);
    document.body.removeChild(container);
  });

  it('should be prevented if nativeEvent is prevented', () => {
    var click = jest.fn();
    var container = document.createElement('div');

    var onClick = e => click(e.isDefaultPrevented());

    var instance = ReactDOM.render(<div onClick={onClick} />, container);

    var elem = ReactDOM.findDOMNode(instance);
    ReactTestUtils.SimulateNative.click(elem, {defaultPrevented: true});
    ReactTestUtils.SimulateNative.click(elem, {returnValue: false});

    expect(click.mock.calls[0][0]).toBe(true);
    expect(click.mock.calls[1][0]).toBe(true);
  });

  it('should be able to `stopPropagation`', () => {
    var click = jest.fn();
    var container = document.createElement('div');

    var onClick = e => {
      click(e.isPropagationStopped());
      e.stopPropagation();
      click(e.isPropagationStopped());
    };

    var instance = ReactDOM.render(<div onClick={onClick} />, container);

    document.body.appendChild(container);

    var event = createEvent('click', {srcElement: instance});
    var elem = ReactDOM.findDOMNode(instance);
    elem.dispatchEvent(event);
    expect(click.mock.calls[0][0]).toBe(false);
    expect(click.mock.calls[1][0]).toBe(true);
    document.body.removeChild(container);
  });

  it('should be able to `persist`', () => {
    var click = jest.fn();
    var container = document.createElement('div');

    var onClick = e => {
      click(e.isPersistent());
      e.persist();
      click(e.isPersistent());
    };

    var instance = ReactDOM.render(<div onClick={onClick} />, container);

    document.body.appendChild(container);

    var event = createEvent('click', {srcElement: instance});
    var elem = ReactDOM.findDOMNode(instance);
    elem.dispatchEvent(event);
    expect(click.mock.calls[0][0]).toBe(false);
    expect(click.mock.calls[1][0]).toBe(true);
    document.body.removeChild(container);
  });

  it('should be nullified if the synthetic event has called destructor and log warnings', () => {
    spyOn(console, 'error');
    var target = document.createElement('div');
    var syntheticEvent = createEvent({srcElement: target});
    syntheticEvent.destructor();
    expect(syntheticEvent.type).toBe(null);
    expect(syntheticEvent.nativeEvent).toBe(null);
    expect(syntheticEvent.target).toBe(null);
    // once for each property accessed
    expectDev(console.error.calls.count()).toBe(3);
    // assert the first warning for accessing `type`
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: This synthetic event is reused for performance reasons. If ' +
        "you're seeing this, you're accessing the property `type` on a " +
        'released/nullified synthetic event. This is set to null. If you must ' +
        'keep the original synthetic event around, use event.persist(). ' +
        'See https://fb.me/react-event-pooling for more information.',
    );
  });

  it('should warn when setting properties of a destructored synthetic event', () => {
    spyOn(console, 'error');
    var target = document.createElement('div');
    var syntheticEvent = createEvent({srcElement: target});
    syntheticEvent.destructor();
    expect((syntheticEvent.type = 'MouseEvent')).toBe('MouseEvent');
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: This synthetic event is reused for performance reasons. If ' +
        "you're seeing this, you're setting the property `type` on a " +
        'released/nullified synthetic event. This is effectively a no-op. If you must ' +
        'keep the original synthetic event around, use event.persist(). ' +
        'See https://fb.me/react-event-pooling for more information.',
    );
  });

  it('should warn if the synthetic event has been released when calling `preventDefault`', () => {
    spyOn(console, 'error');
    var syntheticEvent = createEvent({});
    SyntheticEvent.release(syntheticEvent);
    syntheticEvent.preventDefault();
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: This synthetic event is reused for performance reasons. If ' +
        "you're seeing this, you're accessing the method `preventDefault` on a " +
        'released/nullified synthetic event. This is a no-op function. If you must ' +
        'keep the original synthetic event around, use event.persist(). ' +
        'See https://fb.me/react-event-pooling for more information.',
    );
  });

  it('should warn if the synthetic event has been released when calling `stopPropagation`', () => {
    spyOn(console, 'error');
    var syntheticEvent = createEvent({});
    SyntheticEvent.release(syntheticEvent);
    syntheticEvent.stopPropagation();
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: This synthetic event is reused for performance reasons. If ' +
        "you're seeing this, you're accessing the method `stopPropagation` on a " +
        'released/nullified synthetic event. This is a no-op function. If you must ' +
        'keep the original synthetic event around, use event.persist(). ' +
        'See https://fb.me/react-event-pooling for more information.',
    );
  });

  /* TODO: reenable this test. We are currently silencing these warnings when
   using TestUtils.Simulate to avoid spurious warnings that result from the
   way we simulate events. */
  xit(
    'should properly log warnings when events simulated with rendered components',
    () => {
      spyOn(console, 'error');
      var event;
      var element = document.createElement('div');
      function assignEvent(e) {
        event = e;
      }
      var instance = ReactDOM.render(<div onClick={assignEvent} />, element);
      ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(instance));
      expectDev(console.error.calls.count()).toBe(0);

      // access a property to cause the warning
      event.nativeEvent; // eslint-disable-line no-unused-expressions

      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: This synthetic event is reused for performance reasons. If ' +
          "you're seeing this, you're accessing the property `nativeEvent` on a " +
          'released/nullified synthetic event. This is set to null. If you must ' +
          'keep the original synthetic event around, use event.persist(). ' +
          'See https://fb.me/react-event-pooling for more information.',
      );
    },
  );

  it('should warn if Proxy is supported and the synthetic event is added a property', () => {
    spyOn(console, 'error');
    var syntheticEvent = createEvent({});
    syntheticEvent.foo = 'bar';
    SyntheticEvent.release(syntheticEvent);
    expect(syntheticEvent.foo).toBe('bar');
    if (typeof Proxy === 'function') {
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: This synthetic event is reused for performance reasons. If ' +
          "you're seeing this, you're adding a new property in the synthetic " +
          'event object. The property is never released. ' +
          'See https://fb.me/react-event-pooling for more information.',
      );
    } else {
      expectDev(console.error.calls.count()).toBe(0);
    }
  });
});
