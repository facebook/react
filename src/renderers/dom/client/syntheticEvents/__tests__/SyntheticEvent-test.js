/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var SyntheticEvent;

describe('SyntheticEvent', function() {
  var createEvent;

  beforeEach(function() {
    SyntheticEvent = require('SyntheticEvent');

    createEvent = function(nativeEvent) {
      var target = require('getEventTarget')(nativeEvent);
      return SyntheticEvent.getPooled({}, '', nativeEvent, target);
    };
  });

  it('should normalize `target` from the nativeEvent', function() {
    var target = document.createElement('div');
    var syntheticEvent = createEvent({srcElement: target});

    expect(syntheticEvent.target).toBe(target);
    expect(syntheticEvent.type).toBe(undefined);
  });

  it('should be able to `preventDefault`', function() {
    var nativeEvent = {};
    var syntheticEvent = createEvent(nativeEvent);

    expect(syntheticEvent.isDefaultPrevented()).toBe(false);
    syntheticEvent.preventDefault();
    expect(syntheticEvent.isDefaultPrevented()).toBe(true);

    expect(syntheticEvent.defaultPrevented).toBe(true);

    expect(nativeEvent.returnValue).toBe(false);
  });

  it('should be prevented if nativeEvent is prevented', function() {
    expect(
      createEvent({defaultPrevented: true}).isDefaultPrevented()
    ).toBe(true);
    expect(createEvent({returnValue: false}).isDefaultPrevented()).toBe(true);
  });

  it('should be able to `stopPropagation`', function() {
    var nativeEvent = {};
    var syntheticEvent = createEvent(nativeEvent);

    expect(syntheticEvent.isPropagationStopped()).toBe(false);
    syntheticEvent.stopPropagation();
    expect(syntheticEvent.isPropagationStopped()).toBe(true);

    expect(nativeEvent.cancelBubble).toBe(true);
  });

  it('should be able to `persist`', function() {
    var syntheticEvent = createEvent({});

    expect(syntheticEvent.isPersistent()).toBe(false);
    syntheticEvent.persist();
    expect(syntheticEvent.isPersistent()).toBe(true);
  });

  it('should warn if the synthetic event has been released when calling `preventDefault`', function() {
    spyOn(console, 'error');
    var syntheticEvent = createEvent({});
    SyntheticEvent.release(syntheticEvent);
    syntheticEvent.preventDefault();
    expect(console.error.calls.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toBe(
      'Warning: This synthetic event is reused for performance reasons. If ' +
      'you\'re seeing this, you\'re calling `preventDefault` on a ' +
      'released/nullified synthetic event. This is a no-op. See ' +
      'https://fb.me/react-event-pooling for more information.'
    );
  });

  it('should warn if the synthetic event has been released when calling `stopPropagation`', function() {
    spyOn(console, 'error');
    var syntheticEvent = createEvent({});
    SyntheticEvent.release(syntheticEvent);
    syntheticEvent.stopPropagation();
    expect(console.error.calls.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toBe(
      'Warning: This synthetic event is reused for performance reasons. If ' +
      'you\'re seeing this, you\'re calling `stopPropagation` on a ' +
      'released/nullified synthetic event. This is a no-op. See ' +
      'https://fb.me/react-event-pooling for more information.'
    );
  });
});
