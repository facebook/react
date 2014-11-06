/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactRef
 */

"use strict";

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

ReactRef.attachRef = function(ref, value) {
  ref._value = value;
};

ReactRef.detachRef = function(ref, value) {
  // Check that `component` is still the current ref because we do not want to
  // detach the ref if another component stole it.
  if (ref._value === value) {
    ref._value = null;
  }
};

module.exports = ReactRef;
