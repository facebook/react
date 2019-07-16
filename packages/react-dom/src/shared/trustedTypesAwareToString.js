/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Returns true only if Trusted Types are available in global object and the value
 * is a trusted type.
 */
function isTrustedTypesValue(value: any) {
  if (typeof window.TrustedTypes === 'undefined') {
    return false;
  } else {
    return (
      window.TrustedTypes.isHTML(value) ||
      window.TrustedTypes.isScript(value) ||
      window.TrustedTypes.isScriptURL(value) ||
      window.TrustedTypes.isURL(value)
    );
  }
}

/**
 * We allow passing objects with toString method as element attributes or in dangerouslySetInnerHTML
 * and we do validations that the value is safe. Once we do validation we want to use the validated
 * value instead of the object (because object.toString may return something else on next call).
 *
 * If application uses Trusted Types we don't stringify trusted values, but preserve them as objects.
 */
function trustedTypesAwareToString(value: any) {
  if (isTrustedTypesValue(value)) {
    return value;
  } else {
    return '' + value;
  }
}

export default trustedTypesAwareToString;
