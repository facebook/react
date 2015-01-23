/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactRef
 */

'use strict';

var ReactOwner = require('ReactOwner');
var ReactUpdates = require('ReactUpdates');

var accumulate = require('accumulate');
var assign = require('Object.assign');
var forEachAccumulated = require('forEachAccumulated');
var invariant = require('invariant');

function ReactRef() {
  this._value = null;
  this._successCallbacks = null;
  this._failureCallbacks = null;
}

/**
 * Call the enqueued success or failure callbacks for a ref, as appropriate.
 */
function dispatchCallbacks() {
  /*jshint validthis:true */
  var successCallbacks = this._successCallbacks;
  var failureCallbacks = this._failureCallbacks;
  this._successCallbacks = null;
  this._failureCallbacks = null;

  if (this._value) {
    forEachAccumulated(successCallbacks, callSuccess, this);
  } else {
    forEachAccumulated(failureCallbacks, callFailure);
  }
}

/**
 * Call a single success callback, passing the ref's value.
 */
function callSuccess(cb) {
  /*jshint validthis:true */
  cb(this._value);
}

/**
 * Call a single failure callback, passing no arguments.
 */
function callFailure(cb) {
  cb();
}

assign(ReactRef.prototype, {
  /**
   * Get the value of a ref asynchronously. Accepts a success callback and an
   * optional failure callback. If the ref has been rendered, the success
   * callback will be called with the component instance; otherwise, the failure
   * callback will be executed.
   *
   * @param {function} success Callback in case of success
   * @param {?function} failure Callback in case of failure
   */
  then: function(success, failure) {
    invariant(
      typeof success === 'function',
      'ReactRef.then(...): Must provide a success callback.'
    );
    if (this._successCallbacks == null) {
      ReactUpdates.asap(dispatchCallbacks, this);
    }
    this._successCallbacks = accumulate(this._successCallbacks, success);
    if (failure) {
      this._failureCallbacks = accumulate(this._failureCallbacks, failure);
    }
  }
});

function attachFirstClassRef(ref, value) {
  ref._value = value.getPublicInstance();
}

function detachFirstClassRef(ref, value) {
  // Check that `component` is still the current ref because we do not want to
  // detach the ref if another component stole it.
  if (ref._value === value) {
    ref._value = null;
  }
}

function attachRef(ref, component, owner) {
  if (ref instanceof ReactRef) {
    attachFirstClassRef(ref, component);
  } else {
    ReactOwner.addComponentAsRefTo(component, ref, owner);
  }
}

function detachRef(ref, component, owner) {
  if (ref instanceof ReactRef) {
    detachFirstClassRef(ref, component);
  } else {
    ReactOwner.removeComponentAsRefFrom(component, ref, owner);
  }
}

ReactRef.attachRefs = function(instance, element) {
  var ref = element.ref;
  if (ref != null) {
    attachRef(ref, instance, element._owner);
  }
};

ReactRef.updateRefs = function(instance, prevElement, nextElement) {
  // If either the owner or a `ref` has changed, make sure the newest owner
  // has stored a reference to `this`, and the previous owner (if different)
  // has forgotten the reference to `this`. We use the element instead
  // of the public this.props because the post processing cannot determine
  // a ref. The ref conceptually lives on the element.

  // TODO: Should this even be possible? The owner cannot change because
  // it's forbidden by shouldUpdateReactComponent. The ref can change
  // if you swap the keys of but not the refs. Reconsider where this check
  // is made. It probably belongs where the key checking and
  // instantiateReactComponent is done.

  if (nextElement._owner !== prevElement._owner ||
      nextElement.ref !== prevElement.ref) {
    if (prevElement.ref != null) {
      detachRef(prevElement.ref, instance, prevElement._owner);
    }
    // Correct, even if the owner is the same, and only the ref has changed.
    if (nextElement.ref != null) {
      attachRef(nextElement.ref, instance, nextElement._owner);
    }
  }
};

ReactRef.detachRefs = function(instance, element) {
  var ref = element.ref;
  if (ref != null) {
    detachRef(ref, instance, element._owner);
  }
};

module.exports = ReactRef;
