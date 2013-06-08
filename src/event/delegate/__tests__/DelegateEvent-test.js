/**
 * @emails react-core
 */

"use strict";

var DelegateEvent;

describe('DelegateEvent', function() {
  var delegate;

  beforeEach(function() {
    DelegateEvent = require('DelegateEvent');

    delegate = function(nativeEvent) {
      return DelegateEvent.getPooled({}, '', nativeEvent);
    };
  });

  it('should normalize `target` from the nativeEvent', function() {
    var target = document.createElement('div');
    var delegateEvent = delegate({srcElement: target});

    expect(delegateEvent.target).toBe(target);
    expect(delegateEvent.type).toBe(undefined);
  });

  it('should be able to `preventDefault`', function() {
    var nativeEvent = {};
    var delegateEvent = delegate(nativeEvent);

    expect(delegateEvent.isDefaultPrevented()).toBe(false);
    delegateEvent.preventDefault();
    expect(delegateEvent.isDefaultPrevented()).toBe(true);

    expect(delegateEvent.defaultPrevented).toBe(true);

    expect(nativeEvent.returnValue).toBe(false);
  });

  it('should be prevented if nativeEvent is prevented', function() {
    expect(delegate({defaultPrevented: true}).isDefaultPrevented()).toBe(true);
    expect(delegate({returnValue: false}).isDefaultPrevented()).toBe(true);
  });

  it('should be able to `stopPropagation`', function() {
    var nativeEvent = {};
    var delegateEvent = delegate(nativeEvent);

    expect(delegateEvent.isPropagationStopped()).toBe(false);
    delegateEvent.stopPropagation();
    expect(delegateEvent.isPropagationStopped()).toBe(true);

    expect(nativeEvent.cancelBubble).toBe(true);
  });

  it('should be able to `persist`', function() {
    var delegateEvent = delegate({});

    expect(delegateEvent.isPersistent()).toBe(false);
    delegateEvent.persist();
    expect(delegateEvent.isPersistent()).toBe(true);
  });

});
