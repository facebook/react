/**
 * Copyright 2013 Facebook, Inc.
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
 * @providesModule ReactUpdates
 */

"use strict";

var invariant = require('invariant');

var isBatchingUpdates = false;

var dirtyComponents = [];

/**
 * Call the provided function in a context within which calls to `setState` and
 * friends are batched such that components aren't updated unnecessarily.
 */
function batchedUpdates(callback) {
  if (isBatchingUpdates) {
    // We're already executing in an environment where updates will be batched,
    // so this is a no-op.
    callback();
    return;
  }

  isBatchingUpdates = true;

  try {
    callback();
    // TODO: Sort components by depth such that parent components update first
    for (var i = 0; i < dirtyComponents.length; i++) {
      // If a component is unmounted before pending changes apply, ignore them
      // TODO: Queue unmounts in the same list to avoid this happening at all
      var component = dirtyComponents[i];
      if (component.isMounted()) {
        // If performUpdateIfNecessary happens to enqueue any new updates, we
        // shouldn't execute the callbacks until the next render happens, so
        // stash the callbacks first
        var callbacks = component._pendingCallbacks;
        component._pendingCallbacks = null;
        component.performUpdateIfNecessary();
        if (callbacks) {
          for (var j = 0; j < callbacks.length; j++) {
            callbacks[j].call(component);
          }
        }
      }
    }
  } catch (error) {
    // IE8 requires `catch` in order to use `finally`.
    throw error;
  } finally {
    dirtyComponents.length = 0;
    isBatchingUpdates = false;
  }
}

/**
 * Mark a component as needing a rerender, adding an optional callback to a
 * list of functions which will be executed once the rerender occurs.
 */
function enqueueUpdate(component, callback) {
  invariant(
    !callback || typeof callback === "function",
    'enqueueUpdate(...): You called `setProps`, `replaceProps`, ' +
    '`setState`, `replaceState`, or `forceUpdate` with a callback that ' +
    'isn\'t callable.'
  );

  if (!isBatchingUpdates) {
    component.performUpdateIfNecessary();
    callback && callback();
    return;
  }

  dirtyComponents.push(component);

  if (callback) {
    if (component._pendingCallbacks) {
      component._pendingCallbacks.push(callback);
    } else {
      component._pendingCallbacks = [callback];
    }
  }
}

var ReactUpdates = {
  batchedUpdates: batchedUpdates,
  enqueueUpdate: enqueueUpdate
};

module.exports = ReactUpdates;
