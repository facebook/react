/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule validateExplicitKey
 * @flow
 */

/**
 * ReactElementValidator provides a wrapper around a element factory
 * which validates the props passed to the element. This is intended to be
 * used only in DEV and could be replaced by a static type checker for languages
 * that support it.
 */

'use strict';

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
}

/**
 * Gets part of the string which we use as error message for user.
 * We pass the element as the first parameter.
 */
type ErrorMessageCallbackType = (element: ReactElement) => string;

/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */
var ownerHasKeyUseWarning = {};

/**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it. Error statuses are cached so a warning
 * will only be shown once.
 *
 * We use a callback for generating the error status since the error status is
 * composed using different info and dependencies in different places where
 * 'validateExplicitKey' is called.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {ErrorMessageCallbackType} ErrorMessageCallbackType
 */
function validateExplicitKey(
  element: ReactElement,
  getMainErrorMessage: ErrorMessageCallbackType,
  getComponentStackMessage: ErrorMessageCallbackType,
) {
  if (!element._store || element._store.validated || element.key != null) {
    return;
  }
  element._store.validated = true;

  var memoizer = ownerHasKeyUseWarning.uniqueKey ||
    (ownerHasKeyUseWarning.uniqueKey = {});

  const mainErrorMessage = getMainErrorMessage(element);

  if (memoizer[mainErrorMessage]) {
    return;
  }
  memoizer[mainErrorMessage] = true;

  warning(
    false,
    mainErrorMessage + getComponentStackMessage(element),
  );
}

module.exports = validateExplicitKey;
