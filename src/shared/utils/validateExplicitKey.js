/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule validateExplicitKey
 */

/**
 * ReactElementValidator provides a wrapper around a element factory
 * which validates the props passed to the element. This is intended to be
 * used only in DEV and could be replaced by a static type checker for languages
 * that support it.
 */

'use strict';

var ReactCurrentOwner = require('ReactCurrentOwner');
var getComponentName = require('getComponentName');
var getDeclarationErrorAddendum = require('getDeclarationErrorAddendum');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var {
    getCurrentStackAddendum,
  } = require('ReactComponentTreeHook');
}

/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */
var ownerHasKeyUseWarning = {};

function getCurrentComponentErrorInfo(parentType) {
  if (!parentType) {
    return '';
  }

  var info = getDeclarationErrorAddendum();

  if (!info) {
    var parentName = typeof parentType === 'string'
      ? parentType
      : typeof parentType === 'object' &&
        (parentType.displayName || parentType.name);
    if (parentName) {
      info = `\n\nCheck the top-level render call using <${parentName}>.`;
    }
  }
  return info;
}

/**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it. Error statuses are cached so a warning
 * will only be shown once.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {*} parentType element's parent's type.
 */
function validateExplicitKey(element, parentType) {
  if (!element._store || element._store.validated || element.key != null) {
    return;
  }
  element._store.validated = true;

  var memoizer = ownerHasKeyUseWarning.uniqueKey ||
    (ownerHasKeyUseWarning.uniqueKey = {});

  var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
  if (memoizer[currentComponentErrorInfo]) {
    return;
  }
  memoizer[currentComponentErrorInfo] = true;

  // Usually the current owner is the offender, but if it accepts children as a
  // property, it may be the creator of the child that's responsible for
  // assigning it a key.
  var childOwner = '';
  if (
    element && element._owner && element._owner !== ReactCurrentOwner.current
  ) {
    // Give the component that originally created this child.
    childOwner = ` It was passed a child from ${getComponentName(element._owner)}.`;
  }

  warning(
    false,
    'Each child in an array or iterator should have a unique "key" prop.' +
      '%s%s See https://fb.me/react-warning-keys for more information.%s',
    currentComponentErrorInfo,
    childOwner,
    getCurrentStackAddendum(element),
  );
}

module.exports = validateExplicitKey;
