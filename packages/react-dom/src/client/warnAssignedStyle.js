/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let warnAssignedStyle = () => {};

if (__DEV__) {
  let warnedForInvalidFontFamily = false;

  const isStyleValueValid = function(currentValue, assignedValue) {
    return currentValue === assignedValue;
  };

  const warnInvalidStyleValue = function(name, value) {
    if (warnedForInvalidFontFamily) {
      return;
    }

    warnedForInvalidFontFamily = true;
    console.warn(
      "`%s` isn't valid value for `%s` property.",
      value,
      name
    );
  };

  warnAssignedStyle = function(node, name, value) {
    if (!isStyleValueValid(node.style[name], value)
    ) {
      warnInvalidStyleValue(name, value);
    }
  };
}

export default warnAssignedStyle;
