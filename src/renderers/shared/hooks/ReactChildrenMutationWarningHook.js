/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactChildrenMutationWarningHook
 * @flow
 */

'use strict';

var ReactComponentTreeHook = require('ReactComponentTreeHook');

var warning = require('warning');

import type { DebugID } from 'ReactInstanceType';

function handleElement(debugID, element) {
  if (element == null) {
    return;
  }
  if (element._shadowChildren === undefined) {
    return;
  }
  if (element._shadowChildren === element.props.children) {
    return;
  }
  var isMutated = false;
  if (Array.isArray(element._shadowChildren)) {
    if (element._shadowChildren.length === element.props.children.length) {
      for (var i = 0; i < element._shadowChildren.length; i++) {
        if (element._shadowChildren[i] !== element.props.children[i]) {
          isMutated = true;
        }
      }
    } else {
      isMutated = true;
    }
  }
  if (!Array.isArray(element._shadowChildren) || isMutated) {
    warning(
      false,
      'Component\'s children should not be mutated.%s',
      ReactComponentTreeHook.getStackAddendumByID(debugID),
    );
  }
}

var ReactChildrenMutationWarningHook = {
  onMountComponent(debugID: DebugID): void {
    handleElement(debugID, ReactComponentTreeHook.getElement(debugID));
  },
  onUpdateComponent(debugID: DebugID): void {
    handleElement(debugID, ReactComponentTreeHook.getElement(debugID));
  },
};

module.exports = ReactChildrenMutationWarningHook;
