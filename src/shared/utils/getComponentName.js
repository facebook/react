/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getComponentName
 */

'use strict';

/**
 * Returns the component name, if any.
 *
 * This is to provide consistent logic for choosing the name: prefer
 * `displayName` and fall back on `name`.
 *
 * @param {ReactComponent} component
 * @return {?string} Name, if any.
 */
function getComponentName(component) {
  return component && (component.displayName || component.name);
}

module.exports = getComponentName;
