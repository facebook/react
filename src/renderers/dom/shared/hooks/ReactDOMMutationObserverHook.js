/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMMutationObserverHook
 */

'use strict';

var ReactComponentTreeHook = require('ReactComponentTreeHook');
var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');

var warning = require('warning');

function getStackAddendum(debugID) {
  if (debugID != null) {
    // This can only happen on Stack
    return ReactComponentTreeHook.getStackAddendumByID(debugID);
  } else {
    // This can only happen on Fiber
    return ReactDebugCurrentFiber.getCurrentFiberStackAddendum();
  }
}

function observeMutations(debugID, element) {
  if (!element) {
    return;
  }

  if (MutationObserver) {
    var reactRoot = document.querySelector('[data-reactroot]');
    console.log(reactRoot);
    var config = {
      childList: true,
      subtree: true,
    };

    // eslint-disable-next-line no-inner-declarations
    function callback(mutations) {
      warning(
        false,
        'An outside source is mutating the DOM.%s',
        getStackAddendum(debugID),
      );
    }

    var observer = new MutationObserver(callback);
    observer.observe(reactRoot, config);
  }
}

var ReactDOMMutationObserverHook = {
  onMountComponent(debugID, element) {
    observeMutations(debugID, element);
  },
};

module.exports = ReactDOMMutationObserverHook;
