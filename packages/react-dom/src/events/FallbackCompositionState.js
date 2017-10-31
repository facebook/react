/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var getTextContentAccessor = require('../client/getTextContentAccessor');

/**
 * This helper object stores information about text content of a target node,
 * allowing comparison of content before and after a given event.
 *
 * Identify the node where selection currently begins, then observe
 * both its text content and its current position in the DOM. Since the
 * browser may natively replace the target node during composition, we can
 * use its position to find its replacement.
 * 
 *
 */
var compositionState = {
  _root: null,
  _startText: null,
  _fallbackText: null,
};

var FallbackCompositionState = {
  initialize(nativeEventTarget) {
    compositionState._root = nativeEventTarget;
    compositionState._startText = FallbackCompositionState.getText();
    return true;
  },
  reset() {
    compositionState._root = null;
    compositionState._startText = null;
    compositionState._fallbackText = null;
  },
  getData() {
    if (compositionState._fallbackText) {
      return compositionState._fallbackText;
    }

    var start;
    var startValue = compositionState._startText;
    var startLength = startValue.length;
    var end;
    var endValue = FallbackCompositionState.getText();
    var endLength = endValue.length;

    for (start = 0; start < startLength; start++) {
      if (startValue[start] !== endValue[start]) {
        break;
      }
    }

    var minEnd = startLength - start;
    for (end = 1; end <= minEnd; end++) {
      if (startValue[startLength - end] !== endValue[endLength - end]) {
        break;
      }
    }

    var sliceTail = end > 1 ? 1 - end : undefined;
    compositionState._fallbackText = endValue.slice(start, sliceTail);
    return compositionState._fallbackText;
  },
  getText() {
    if ('value' in compositionState._root) {
      return compositionState._root.value;
    }
    return compositionState._root[getTextContentAccessor()];
  },
};

module.exports = FallbackCompositionState;
