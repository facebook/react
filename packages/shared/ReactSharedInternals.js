/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

const ReactSharedInternals =
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

// Add fallback for newer renderers running with older react package versions.
// Current owner and dispatcher used to share the same ref,
// but PR #14548 split them out to better support the react-debug-tools package.
if (!ReactSharedInternals.hasOwnProperty('ReactCurrentDispatcher')) {
  const {ReactCurrentOwner} = ReactSharedInternals;
  ReactSharedInternals.ReactCurrentDispatcher = {
    get current() {
      return ReactCurrentOwner.currentDispatcher;
    },
    set current(value) {
      ReactCurrentOwner.currentDispatcher = value;
    },
  };
}

export default ReactSharedInternals;
