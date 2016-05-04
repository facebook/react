/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getInstanceDisplayName
 */
'use strict';

/*
 * This function returns a user-readable name for the instance passed in. Only use
 * this for UX elements or messages to the user; do not depend on the names
 * for logical decisions, as they could change over time.
 * @param {ReactComponent} instance the instance for which to get a display name.
 */
function getInstanceDisplayName(instance) {
  var element = instance._currentElement;
  if (element == null) {
    return '#empty';
  } else if (typeof element === 'string' || typeof element === 'number') {
    return '#text';
  } else if (typeof element.type === 'string') {
    return element.type;
  } else if (instance.getName) {
    return instance.getName() || 'Unknown';
  } else {
    return element.type.displayName || element.type.name || 'Unknown';
  }
}

module.exports = getInstanceDisplayName;
