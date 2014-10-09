/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

"use strict";

var SyntheticWheelEvent;

describe('SyntheticWheelEvent', function() {
  var createEvent;

  beforeEach(function() {
    SyntheticWheelEvent = require('SyntheticWheelEvent');

    createEvent = function(nativeEvent) {
      return SyntheticWheelEvent.getPooled({}, '', nativeEvent);
    };
  });

  it('should normalize properties from the Event interface', function() {
    var target = document.createElement('div');
    var syntheticEvent = createEvent({srcElement: target});

    expect(syntheticEvent.target).toBe(target);
    expect(syntheticEvent.type).toBe(undefined);
  });

  it('should normalize properties from the MouseEvent interface', function() {
    expect(createEvent({which: 2, button: 1}).button).toBe(1);
  });

  it('should normalize properties from the WheelEvent interface', function() {
    var standardEvent = createEvent({deltaX: 10, deltaY: -50});
    expect(standardEvent.deltaX).toBe(10);
    expect(standardEvent.deltaY).toBe(-50);

    var webkitEvent = createEvent({wheelDeltaX: -10, wheelDeltaY: 50});
    expect(webkitEvent.deltaX).toBe(10);
    expect(webkitEvent.deltaY).toBe(-50);
  });

  it('should be able to `preventDefault` and `stopPropagation`', function() {
    var nativeEvent = {};
    var syntheticEvent = createEvent(nativeEvent);

    expect(syntheticEvent.isDefaultPrevented()).toBe(false);
    syntheticEvent.preventDefault();
    expect(syntheticEvent.isDefaultPrevented()).toBe(true);

    expect(syntheticEvent.isPropagationStopped()).toBe(false);
    syntheticEvent.stopPropagation();
    expect(syntheticEvent.isPropagationStopped()).toBe(true);
  });

  it('should be able to `persist`', function() {
    var syntheticEvent = createEvent({});

    expect(syntheticEvent.isPersistent()).toBe(false);
    syntheticEvent.persist();
    expect(syntheticEvent.isPersistent()).toBe(true);
  });

});
