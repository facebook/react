/**
 * @emails react-core
 */

"use strict";

var DelegateWheelEvent;

describe('DelegateWheelEvent', function() {
  var delegate;

  beforeEach(function() {
    DelegateWheelEvent = require('DelegateWheelEvent');

    delegate = function(nativeEvent) {
      return DelegateWheelEvent.getPooled({}, '', nativeEvent);
    };
  });

  it('should normalize properties from the Event interface', function() {
    var target = document.createElement('div');
    var delegateEvent = delegate({srcElement: target});

    expect(delegateEvent.target).toBe(target);
    expect(delegateEvent.type).toBe(undefined);
  });

  it('should normalize properties from the MouseEvent interface', function() {
    expect(delegate({which: 2, button: 1}).button).toBe(1);
  });

  it('should normalize properties from the WheelEvent interface', function() {
    var standardEvent = delegate({deltaX: 10, deltaY: -50});
    expect(standardEvent.deltaX).toBe(10);
    expect(standardEvent.deltaY).toBe(50);

    var webkitEvent = delegate({wheelDeltaX: -10, wheelDeltaY: 50});
    expect(webkitEvent.deltaX).toBe(10);
    expect(webkitEvent.deltaY).toBe(50);
  });

  it('should be able to `preventDefault` and `stopPropagation`', function() {
    var nativeEvent = {};
    var delegateEvent = delegate(nativeEvent);

    expect(delegateEvent.isDefaultPrevented()).toBe(false);
    delegateEvent.preventDefault();
    expect(delegateEvent.isDefaultPrevented()).toBe(true);

    expect(delegateEvent.isPropagationStopped()).toBe(false);
    delegateEvent.stopPropagation();
    expect(delegateEvent.isPropagationStopped()).toBe(true);
  });

  it('should be able to `persist`', function() {
    var delegateEvent = delegate({});

    expect(delegateEvent.isPersistent()).toBe(false);
    delegateEvent.persist();
    expect(delegateEvent.isPersistent()).toBe(true);
  });

});
