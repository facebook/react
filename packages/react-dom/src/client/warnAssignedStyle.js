/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let warnAssignedStyle = () => {};

if (__DEV__) {
  let warnedForInvalidFontFamily = false;

  const isFontFamilyValid = function(currentValue, assignedValue) {
    return currentValue === assignedValue;
  };

  const warnInvalidFontFamilyValue = function(value) {
    if (warnedForInvalidFontFamily) {
      return;
    }

    warnedForInvalidFontFamily = true;
    console.warn(
      "`%s` isn't valid value for fontFamily property. Did you forget to add quotes?",
      value,
    );
  };

  warnAssignedStyle = function(node, name, value) {
    if (
      name === 'fontFamily' &&
      !isFontFamilyValid(node.style.fontFamily, value)
    ) {
      warnInvalidFontFamilyValue(value);
    }
  };
}

export default warnAssignedStyle;
