/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactRef
 * @flow
 */

'use strict';

var ReactOwner = require('ReactOwner');

import type {ReactInstance} from 'ReactInstanceType';
import type {ReactElement} from 'ReactElementType';

var ReactRef = {};

if (__DEV__) {
  var ReactCompositeComponentTypes = require('ReactCompositeComponentTypes');
  var ReactComponentTreeHook = require('react/lib/ReactComponentTreeHook');
  var warning = require('fbjs/lib/warning');

  var warnedAboutStatelessRefs = {};
}

function attachRef(ref, component, owner) {
  if (__DEV__) {
    if (
      component._compositeType ===
      ReactCompositeComponentTypes.StatelessFunctional
    ) {
      let info = '';
      let ownerName;
      if (owner) {
        if (typeof owner.getName === 'function') {
          ownerName = owner.getName();
        }
        if (ownerName) {
          info += '\n\nCheck the render method of `' + ownerName + '`.';
        }
      }

      let warningKey = ownerName || component._debugID;
      let element = component._currentElement;
      if (element && element._source) {
        warningKey = element._source.fileName +
          ':' +
          element._source.lineNumber;
      }
      if (!warnedAboutStatelessRefs[warningKey]) {
        warnedAboutStatelessRefs[warningKey] = true;
        warning(
          false,
          'Stateless function components cannot be given refs. ' +
            'Attempts to access this ref will fail.%s%s',
          info,
          ReactComponentTreeHook.getStackAddendumByID(component._debugID),
        );
      }
    }
  }

  if (typeof ref === 'function') {
    ref(component.getPublicInstance());
  } else {
    // Legacy ref
    ReactOwner.addComponentAsRefTo(component, ref, owner);
  }
}

function detachRef(ref, component, owner) {
  if (typeof ref === 'function') {
    ref(null);
  } else {
    // Legacy ref
    ReactOwner.removeComponentAsRefFrom(component, ref, owner);
  }
}

ReactRef.attachRefs = function(
  instance: ReactInstance,
  element: ReactElement | string | number | null | false,
): void {
  if (element === null || typeof element !== 'object') {
    return;
  }
  var ref = element.ref;
  if (ref != null) {
    attachRef(ref, instance, element._owner);
  }
};

ReactRef.shouldUpdateRefs = function(
  prevElement: ReactElement | string | number | null | false,
  nextElement: ReactElement | string | number | null | false,
): boolean {
  // If either the owner or a `ref` has changed, make sure the newest owner
  // has stored a reference to `this`, and the previous owner (if different)
  // has forgotten the reference to `this`. We use the element instead
  // of the public this.props because the post processing cannot determine
  // a ref. The ref conceptually lives on the element.

  // TODO: Should this even be possible? The owner cannot change because
  // it's forbidden by shouldUpdateReactComponent. The ref can change
  // if you swap the keys of but not the refs. Reconsider where this check
  // is made. It probably belongs where the key checking and
  // instantiateReactComponent is done.

  var prevRef = null;
  var prevOwner = null;
  if (prevElement !== null && typeof prevElement === 'object') {
    prevRef = prevElement.ref;
    prevOwner = prevElement._owner;
  }

  var nextRef = null;
  var nextOwner = null;
  if (nextElement !== null && typeof nextElement === 'object') {
    nextRef = nextElement.ref;
    nextOwner = nextElement._owner;
  }

  return prevRef !== nextRef ||
    // If owner changes but we have an unchanged function ref, don't update refs
    (typeof nextRef === 'string' && nextOwner !== prevOwner);
};

ReactRef.detachRefs = function(
  instance: ReactInstance,
  element: ReactElement | string | number | null | false,
): void {
  if (element === null || typeof element !== 'object') {
    return;
  }
  var ref = element.ref;
  if (ref != null) {
    detachRef(ref, instance, element._owner);
  }
};

module.exports = ReactRef;
