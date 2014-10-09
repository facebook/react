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

var EventPluginHub;
var EventConstants;
var EventPropagators;
var ReactInstanceHandles;
var ResponderEventPlugin;
var SyntheticEvent;

var GRANDPARENT_ID = '.0';
var PARENT_ID = '.0.0';
var CHILD_ID = '.0.0.0';

var topLevelTypes;
var responderEventTypes;
var spies;

var DUMMY_NATIVE_EVENT = {};
var DUMMY_RENDERED_TARGET = {};

var onStartShouldSetResponder = function(id, cb, capture) {
  var registrationNames = responderEventTypes
    .startShouldSetResponder
    .phasedRegistrationNames;
  EventPluginHub.putListener(
    id,
    capture ? registrationNames.captured : registrationNames.bubbled,
    cb
  );
};

var onScrollShouldSetResponder = function(id, cb, capture) {
  var registrationNames = responderEventTypes
    .scrollShouldSetResponder
    .phasedRegistrationNames;
  EventPluginHub.putListener(
    id,
    capture ? registrationNames.captured : registrationNames.bubbled,
    cb
  );
};

var onMoveShouldSetResponder = function(id, cb, capture) {
  var registrationNames = responderEventTypes
    .moveShouldSetResponder
    .phasedRegistrationNames;
  EventPluginHub.putListener(
    id,
    capture ? registrationNames.captured : registrationNames.bubbled,
    cb
  );
};


var onResponderGrant = function(id, cb) {
  EventPluginHub.putListener(
    id,
    responderEventTypes.responderGrant.registrationName,
    cb
  );
};

var extractForTouchStart = function(renderedTargetID) {
  return ResponderEventPlugin.extractEvents(
    topLevelTypes.topTouchStart,
    DUMMY_NATIVE_EVENT,
    renderedTargetID,
    DUMMY_RENDERED_TARGET
  );
};

var extractForTouchMove = function(renderedTargetID) {
  return ResponderEventPlugin.extractEvents(
    topLevelTypes.topTouchMove,
    DUMMY_NATIVE_EVENT,
    renderedTargetID,
    DUMMY_RENDERED_TARGET
  );
};

var extractForTouchEnd = function(renderedTargetID) {
  return ResponderEventPlugin.extractEvents(
    topLevelTypes.topTouchEnd,
    DUMMY_NATIVE_EVENT,
    renderedTargetID,
    DUMMY_RENDERED_TARGET
  );
};

var extractForMouseDown = function(renderedTargetID) {
  return ResponderEventPlugin.extractEvents(
    topLevelTypes.topMouseDown,
    DUMMY_NATIVE_EVENT,
    renderedTargetID,
    DUMMY_RENDERED_TARGET
  );
};

var extractForMouseMove = function(renderedTargetID) {
  return ResponderEventPlugin.extractEvents(
    topLevelTypes.topMouseMove,
    DUMMY_NATIVE_EVENT,
    renderedTargetID,
    DUMMY_RENDERED_TARGET
  );
};


var extractForMouseUp = function(renderedTargetID) {
  return ResponderEventPlugin.extractEvents(
    topLevelTypes.topMouseUp,
    DUMMY_NATIVE_EVENT,
    renderedTargetID,
    DUMMY_RENDERED_TARGET
  );
};

var extractForScroll = function(renderedTargetID) {
  return ResponderEventPlugin.extractEvents(
    topLevelTypes.topScroll,
    DUMMY_NATIVE_EVENT,
    renderedTargetID,
    DUMMY_RENDERED_TARGET
  );
};


var onGrantChild;
var onGrantParent;
var onGrantGrandParent;


var existsInExtraction = function(extracted, test) {
  if (Array.isArray(extracted)) {
    for (var i = 0; i < extracted.length; i++) {
      if (test(extracted[i])) {
        return true;
      }
    }
  } else if (extracted) {
    return test(extracted);
  }
  return false;
};

/**
 * Helper validators.
 */
function assertGrantEvent(id, extracted) {
  var test = function(event) {
    return event instanceof SyntheticEvent &&
      event.dispatchConfig === responderEventTypes.responderGrant &&
      event.dispatchMarker === id;
  };
  expect(ResponderEventPlugin.getResponderID()).toBe(id);
  expect(existsInExtraction(extracted, test)).toBe(true);
}

function assertResponderMoveEvent(id, extracted) {
  var test = function(event) {
    return event instanceof SyntheticEvent &&
      event.dispatchConfig === responderEventTypes.responderMove &&
      event.dispatchMarker === id;
  };
  expect(ResponderEventPlugin.getResponderID()).toBe(id);
  expect(existsInExtraction(extracted, test)).toBe(true);
}

function assertTerminateEvent(id, extracted) {
  var test = function(event) {
    return event instanceof SyntheticEvent &&
      event.dispatchConfig === responderEventTypes.responderTerminate &&
      event.dispatchMarker === id;
  };
  expect(ResponderEventPlugin.getResponderID()).not.toBe(id);
  expect(existsInExtraction(extracted, test)).toBe(true);
}

function assertRelease(id, extracted) {
  var test = function(event) {
    return event instanceof SyntheticEvent &&
      event.dispatchConfig === responderEventTypes.responderRelease &&
      event.dispatchMarker === id;
  };
  expect(ResponderEventPlugin.getResponderID()).toBe(null);
  expect(existsInExtraction(extracted, test)).toBe(true);
}


function assertNothingExtracted(extracted) {
  expect(Array.isArray(extracted)).toBe(false);  // No grant events.
  expect(Array.isArray(extracted)).toBeFalsy();
}


/**
 * TODO:
 * - Test that returning false from `responderTerminationRequest` will never
 *   cause the responder to be lost.
 * - Automate some of this testing by providing config data - generalize.
 */

describe('ResponderEventPlugin', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();

    EventPluginHub = require('EventPluginHub');
    EventConstants = require('EventConstants');
    EventPropagators = require('EventPropagators');
    ReactInstanceHandles = require('ReactInstanceHandles');
    ResponderEventPlugin = require('ResponderEventPlugin');
    SyntheticEvent = require('SyntheticEvent');
    EventPluginHub.injection.injectInstanceHandle(ReactInstanceHandles);

    // dumpCache, in open-source tests, only resets existing mocks. It does not
    // reset module-state though -- so we need to do this explicitly in the test
    // for now. Once that's no longer the case, we can delete this line.
    EventPluginHub.__purge();

    topLevelTypes = EventConstants.topLevelTypes;
    responderEventTypes = ResponderEventPlugin.eventTypes;

    spies = {
      onStartShouldSetResponderChild: function() {},
      onStartShouldSetResponderParent: function() {},
      onStartShouldSetResponderParentCapture: function() {},
      onStartShouldSetResponderGrandParent: function() {},
      onMoveShouldSetResponderParent: function() {},
      onScrollShouldSetResponderParent: function() {}
    };

    onGrantChild = function() {};
    onGrantParent = function() {};
    onGrantGrandParent = function() {};
  });

  it('should not auto-set responder on touch start', function() {
    // Notice we're not registering the startShould* handler.
    var extracted = extractForTouchStart(CHILD_ID);
    assertNothingExtracted(extracted);
    expect(ResponderEventPlugin.getResponderID()).toBe(null);
  });

  it('should not auto-set responder on mouse down', function() {
    // Notice we're not registering the startShould* handler.
    var extracted = extractForMouseDown(CHILD_ID);
    assertNothingExtracted(extracted);
    expect(ResponderEventPlugin.getResponderID()).toBe(null);
    extractForMouseUp(CHILD_ID); // Let up!
    expect(ResponderEventPlugin.getResponderID()).toBe(null);

    // Register `onMoveShould*` handler.
    spyOn(spies, 'onMoveShouldSetResponderParent').andReturn(true);
    onMoveShouldSetResponder(PARENT_ID, spies.onMoveShouldSetResponderParent);
    onResponderGrant(PARENT_ID, onGrantParent);
    // Move mouse while not pressing down
    extracted = extractForMouseMove(CHILD_ID);
    assertNothingExtracted(extracted);
    // Not going to call `onMoveShould`* if not touching.
    expect(spies.onMoveShouldSetResponderParent.callCount).toBe(0);
    expect(ResponderEventPlugin.getResponderID()).toBe(null);

    // Now try the move extraction again, this time while holding down, and not
    // letting up.
    extracted = extractForMouseDown(CHILD_ID);
    assertNothingExtracted(extracted);
    expect(ResponderEventPlugin.getResponderID()).toBe(null);

    // Now moving can set the responder, if pressing down, even if there is no
    // current responder.
    extracted = extractForMouseMove(CHILD_ID);
    expect(spies.onMoveShouldSetResponderParent.callCount).toBe(1);
    expect(ResponderEventPlugin.getResponderID()).toBe(PARENT_ID);
    assertGrantEvent(PARENT_ID, extracted);

    extractForMouseUp(CHILD_ID);
    expect(ResponderEventPlugin.getResponderID()).toBe(null);
  });

  it('should not extract a grant/release event if double start', function() {
    // Return true - we should become the responder.
    var extracted;
    spyOn(spies, 'onStartShouldSetResponderChild').andReturn(true);
    onStartShouldSetResponder(CHILD_ID, spies.onStartShouldSetResponderChild);
    onResponderGrant(CHILD_ID, onGrantChild);

    extracted = extractForTouchStart(CHILD_ID);
    assertGrantEvent(CHILD_ID, extracted);
    expect(spies.onStartShouldSetResponderChild.callCount).toBe(1);

    // Now we do *not* clear out the touch via a simulated touch end. This mocks
    // out an environment that likely will never happen, but could in some odd
    // error state so it's nice to make sure we recover gracefully.
    // extractForTouchEnd(CHILD_ID); // Clear the responder
    extracted = extractForTouchStart(CHILD_ID);
    assertNothingExtracted();
    expect(spies.onStartShouldSetResponderChild.callCount).toBe(2);
  });

  it('should bubble/capture responder on start', function() {
    // Return true - we should become the responder.
    var extracted;
    spyOn(spies, 'onStartShouldSetResponderParent').andReturn(true);
    spyOn(spies, 'onStartShouldSetResponderChild').andReturn(true);
    onStartShouldSetResponder(CHILD_ID, spies.onStartShouldSetResponderChild);
    onStartShouldSetResponder(PARENT_ID, spies.onStartShouldSetResponderParent);
    onResponderGrant(CHILD_ID, onGrantChild);
    onResponderGrant(PARENT_ID, onGrantParent);

    // Nothing extracted if no responder.
    extracted = extractForTouchMove(GRANDPARENT_ID);
    assertNothingExtracted(extracted);

    extracted = extractForTouchStart(CHILD_ID);
    assertGrantEvent(CHILD_ID, extracted);
    expect(spies.onStartShouldSetResponderChild.callCount).toBe(1);
    expect(spies.onStartShouldSetResponderParent.callCount).toBe(0);

    // Even if moving on the grandparent, the child will receive responder moves
    // (This is even true for mouse interactions - which we should absolutely
    // test)
    extracted = extractForTouchMove(GRANDPARENT_ID);
    assertResponderMoveEvent(CHILD_ID, extracted);
    extracted = extractForTouchMove(CHILD_ID); // Test move on child node too.
    assertResponderMoveEvent(CHILD_ID, extracted);

    // Reset the responder - id passed here shouldn't matter:
    // TODO: Test varying the id here.
    extracted = extractForTouchEnd(GRANDPARENT_ID); // Clear the responder
    assertRelease(CHILD_ID, extracted);

    // Now make sure the parent requests responder on capture.
    spyOn(spies, 'onStartShouldSetResponderParentCapture').andReturn(true);
    onStartShouldSetResponder(
      PARENT_ID,
      spies.onStartShouldSetResponderParent,
      true    // Capture
    );
    onResponderGrant(PARENT_ID, onGrantGrandParent);
    extracted = extractForTouchStart(PARENT_ID);
    expect(ResponderEventPlugin.getResponderID()).toBe(PARENT_ID);
    assertGrantEvent(PARENT_ID, extracted);
    // Now move on various nodes, ensuring that the responder move is emitted to
    // the parent node.
    extracted = extractForTouchMove(GRANDPARENT_ID);
    assertResponderMoveEvent(PARENT_ID, extracted);
    extracted = extractForTouchMove(CHILD_ID); // Test move on child node too.
    assertResponderMoveEvent(PARENT_ID, extracted);

    // Reset the responder - id passed here shouldn't matter:
    // TODO: Test varying the id here.
    extracted = extractForTouchEnd(GRANDPARENT_ID); // Clear the responder
    assertRelease(PARENT_ID, extracted);

  });

  it('should invoke callback to ask if responder is desired', function() {
    // Return true - we should become the responder.
    spyOn(spies, 'onStartShouldSetResponderChild').andReturn(true);
    onStartShouldSetResponder(CHILD_ID, spies.onStartShouldSetResponderChild);

    var extracted = extractForTouchStart(CHILD_ID);
    assertNothingExtracted(extracted);
    expect(spies.onStartShouldSetResponderChild.callCount).toBe(1);
    expect(ResponderEventPlugin.getResponderID()).toBe(CHILD_ID);
    extractForTouchEnd(CHILD_ID); // Clear the responder

    // Now try returning false - we should not become the responder.
    spies.onStartShouldSetResponderChild.andReturn(false);
    onStartShouldSetResponder(CHILD_ID, spies.onStartShouldSetResponderChild);
    extracted = extractForTouchStart(CHILD_ID);
    assertNothingExtracted(extracted);
    expect(spies.onStartShouldSetResponderChild.callCount).toBe(2);
    expect(ResponderEventPlugin.getResponderID()).toBe(null);
    extractForTouchEnd(CHILD_ID);
    expect(ResponderEventPlugin.getResponderID()).toBe(null); // Still null

    // Same thing as before but return true from "shouldSet".
    spies.onStartShouldSetResponderChild.andReturn(true);
    onStartShouldSetResponder(CHILD_ID, spies.onStartShouldSetResponderChild);
    onResponderGrant(CHILD_ID, onGrantChild);
    extracted = extractForTouchStart(CHILD_ID);
    expect(spies.onStartShouldSetResponderChild.callCount).toBe(3);
    assertGrantEvent(CHILD_ID, extracted);
    extracted = extractForTouchEnd(CHILD_ID); // Clear the responder
    assertRelease(CHILD_ID, extracted);
  });

  it('should give up responder to parent on move iff allowed', function() {
    // Return true - we should become the responder.
    var extracted;
    spyOn(spies, 'onStartShouldSetResponderChild').andReturn(true);
    spyOn(spies, 'onMoveShouldSetResponderParent').andReturn(true);
    onStartShouldSetResponder(CHILD_ID, spies.onStartShouldSetResponderChild);
    onMoveShouldSetResponder(PARENT_ID, spies.onMoveShouldSetResponderParent);
    onResponderGrant(CHILD_ID, onGrantChild);
    onResponderGrant(PARENT_ID, onGrantParent);

    spies.onStartShouldSetResponderChild.andReturn(true);
    onStartShouldSetResponder(CHILD_ID, spies.onStartShouldSetResponderChild);
    extracted = extractForTouchStart(CHILD_ID);
    expect(spies.onStartShouldSetResponderChild.callCount).toBe(1);
    expect(spies.onMoveShouldSetResponderParent.callCount).toBe(0); // none yet
    assertGrantEvent(CHILD_ID, extracted);    // Child is the current responder

    extracted = extractForTouchMove(CHILD_ID);
    expect(spies.onMoveShouldSetResponderParent.callCount).toBe(1);
    assertGrantEvent(PARENT_ID, extracted);
    assertTerminateEvent(CHILD_ID, extracted);

    extracted = extractForTouchEnd(CHILD_ID); // Clear the responder
    assertRelease(PARENT_ID, extracted);
  });

  it('should responder move only on direct responder', function() {
    // Return true - we should become the responder.
    spyOn(spies, 'onStartShouldSetResponderChild').andReturn(true);
    onStartShouldSetResponder(CHILD_ID, spies.onStartShouldSetResponderChild);

    var extracted = extractForTouchStart(CHILD_ID);
    assertNothingExtracted(extracted);
    expect(spies.onStartShouldSetResponderChild.callCount).toBe(1);
    expect(ResponderEventPlugin.getResponderID()).toBe(CHILD_ID);
    extractForTouchEnd(CHILD_ID); // Clear the responder
    expect(ResponderEventPlugin.getResponderID()).toBe(null);

    // Now try returning false - we should not become the responder.
    spies.onStartShouldSetResponderChild.andReturn(false);
    onStartShouldSetResponder(CHILD_ID, spies.onStartShouldSetResponderChild);
    extracted = extractForTouchStart(CHILD_ID);
    assertNothingExtracted(extracted);
    expect(spies.onStartShouldSetResponderChild.callCount).toBe(2);
    expect(ResponderEventPlugin.getResponderID()).toBe(null);
    extractForTouchEnd(CHILD_ID); // Clear the responder

    // Same thing as before but return true from "shouldSet".
    spies.onStartShouldSetResponderChild.andReturn(true);
    onStartShouldSetResponder(CHILD_ID, spies.onStartShouldSetResponderChild);
    onResponderGrant(CHILD_ID, onGrantChild);
    extracted = extractForTouchStart(CHILD_ID);
    expect(spies.onStartShouldSetResponderChild.callCount).toBe(3);
    assertGrantEvent(CHILD_ID, extracted);
    extracted = extractForTouchEnd(CHILD_ID); // Clear the responder
    assertRelease(CHILD_ID, extracted);
  });

  it('should give up responder to parent on scroll iff allowed', function() {
    // Return true - we should become the responder.
    var extracted;
    spyOn(spies, 'onStartShouldSetResponderChild').andReturn(true);
    spyOn(spies, 'onMoveShouldSetResponderParent').andReturn(false);
    spyOn(spies, 'onScrollShouldSetResponderParent').andReturn(true);
    onStartShouldSetResponder(CHILD_ID, spies.onStartShouldSetResponderChild);
    onMoveShouldSetResponder(PARENT_ID, spies.onMoveShouldSetResponderParent);
    onScrollShouldSetResponder(
      PARENT_ID,
      spies.onScrollShouldSetResponderParent
    );
    onResponderGrant(CHILD_ID, onGrantChild);
    onResponderGrant(PARENT_ID, onGrantParent);

    spies.onStartShouldSetResponderChild.andReturn(true);
    onStartShouldSetResponder(CHILD_ID, spies.onStartShouldSetResponderChild);
    extracted = extractForTouchStart(CHILD_ID);
    expect(spies.onStartShouldSetResponderChild.callCount).toBe(1);
    expect(spies.onMoveShouldSetResponderParent.callCount).toBe(0); // none yet
    assertGrantEvent(CHILD_ID, extracted);    // Child is the current responder

    extracted = extractForTouchMove(CHILD_ID);
    expect(spies.onMoveShouldSetResponderParent.callCount).toBe(1);
    assertNothingExtracted(extracted);

    extracted = extractForScroll(CHILD_ID); // Could have been parent here too.
    expect(spies.onScrollShouldSetResponderParent.callCount).toBe(1);
    assertGrantEvent(PARENT_ID, extracted);
    assertTerminateEvent(CHILD_ID, extracted);

    extracted = extractForTouchEnd(CHILD_ID); // Clear the responder
    assertRelease(PARENT_ID, extracted);
  });


});
