/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactComponent
 */

'use strict';

var ReactUpdateQueue = require('ReactUpdateQueue');

var invariant = require('invariant');
var warning = require('warning');

/**
 * Base class helpers for the updating state of a component.
 */
function ReactComponent(props, context) {
  this.props = props;
  this.context = context;
}

/**
 * Sets a subset of the state. Always use this to mutate
 * state. You should treat `this.state` as immutable.
 *
 * There is no guarantee that `this.state` will be immediately updated, so
 * accessing `this.state` after calling this method may return the old value.
 *
 * There is no guarantee that calls to `setState` will run synchronously,
 * as they may eventually be batched together.  You can provide an optional
 * callback that will be executed when the call to setState is actually
 * completed.
 *
 * When a function is provided to setState, it will be called at some point in
 * the future (not synchronously). It will be called with the up to date
 * component arguments (state, props, context). These values can be different
 * from this.* because your function may be called after receiveProps but before
 * shouldComponentUpdate, and this new state, props, and context will not yet be
 * assigned to this.
 *
 * @param {object|function} partialState Next partial state or function to
 *        produce next partial state to be merged with current state.
 * @param {?function} callback Called after state is updated.
 * @final
 * @protected
 */
ReactComponent.prototype.setState = function(partialState, callback) {
  invariant(
    typeof partialState === 'object' ||
    typeof partialState === 'function' ||
    partialState == null,
    'setState(...): takes an object of state variables to update or a ' +
    'function which returns an object of state variables.'
  );
  if (__DEV__) {
    warning(
      partialState != null,
      'setState(...): You passed an undefined or null state object; ' +
      'instead, use forceUpdate().'
    );
  }
  ReactUpdateQueue.enqueueSetState(this, partialState);
  if (callback) {
    ReactUpdateQueue.enqueueCallback(this, callback);
  }
};

/**
 * Forces an update. This should only be invoked when it is known with
 * certainty that we are **not** in a DOM transaction.
 *
 * You may want to call this when you know that some deeper aspect of the
 * component's state has changed but `setState` was not called.
 *
 * This will not invoke `shouldUpdateComponent`, but it will invoke
 * `componentWillUpdate` and `componentDidUpdate`.
 *
 * @param {?function} callback Called after update is complete.
 * @final
 * @protected
 */
ReactComponent.prototype.forceUpdate = function(callback) {
  ReactUpdateQueue.enqueueForceUpdate(this);
  if (callback) {
    ReactUpdateQueue.enqueueCallback(this, callback);
  }
};

/**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */
if (__DEV__) {
  var deprecatedAPIs = {
    getDOMNode: 'getDOMNode',
    isMounted: 'isMounted',
    replaceState: 'replaceState',
    setProps: 'setProps'
  };
  var defineDeprecationWarning = function(methodName, displayName) {
    try {
      Object.defineProperty(ReactComponent.prototype, methodName, {
        get: function() {
          warning(
            false,
            '%s(...) is deprecated in plain JavaScript React classes.',
            displayName
          );
          return undefined;
        }
      });
    } catch (x) {
      // IE will fail on defineProperty (es5-shim/sham too)
    }
  };
  for (var fnName in deprecatedAPIs) {
    if (deprecatedAPIs.hasOwnProperty(fnName)) {
      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    }
  }
}

module.exports = ReactComponent;
