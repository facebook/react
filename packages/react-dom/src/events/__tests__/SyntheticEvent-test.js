/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var SyntheticEvent;
var React;
var ReactDOM;
var ReactTestUtils;

describe('SyntheticEvent', () => {
  var createEvent;

  beforeEach(() => {
    // TODO: can we express this test with only public API?
    SyntheticEvent = require('events/SyntheticEvent');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');

    createEvent = function(nativeEvent) {
      var target = require('react-dom/src/events/getEventTarget')(nativeEvent);
      return SyntheticEvent.getPooled({}, '', nativeEvent, target);
    };
  });

  it('should normalize `target` from the nativeEvent', () => {
    var target = document.createElement('div');
    var syntheticEvent = createEvent({srcElement: target});

    expect(syntheticEvent.target).toBe(target);
    expect(syntheticEvent.type).toBe(undefined);
  });

  it('should be able to `preventDefault`', () => {
    var nativeEvent = {};
    var syntheticEvent = createEvent(nativeEvent);

    expect(syntheticEvent.isDefaultPrevented()).toBe(false);
    syntheticEvent.preventDefault();
    expect(syntheticEvent.isDefaultPrevented()).toBe(true);

    expect(syntheticEvent.defaultPrevented).toBe(true);

    expect(nativeEvent.returnValue).toBe(false);
  });

  it('should be prevented if nativeEvent is prevented', () => {
    expect(createEvent({defaultPrevented: true}).isDefaultPrevented()).toBe(
      true,
    );
    expect(createEvent({returnValue: false}).isDefaultPrevented()).toBe(true);
  });

  it('should be able to `stopPropagation`', () => {
    var nativeEvent = {};
    var syntheticEvent = createEvent(nativeEvent);

    expect(syntheticEvent.isPropagationStopped()).toBe(false);
    syntheticEvent.stopPropagation();
    expect(syntheticEvent.isPropagationStopped()).toBe(true);

    expect(nativeEvent.cancelBubble).toBe(true);
  });

  it('should be able to `persist`', () => {
    var syntheticEvent = createEvent({});

    expect(syntheticEvent.isPersistent()).toBe(false);
    syntheticEvent.persist();
    expect(syntheticEvent.isPersistent()).toBe(true);
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

  // TODO: reenable this test. We are currently silencing these warnings when
  // using TestUtils.Simulate to avoid spurious warnings that result from the
  // way we simulate events.
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
