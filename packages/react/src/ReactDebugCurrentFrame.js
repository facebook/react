/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactElement} from 'shared/ReactElementType';

import {describeUnknownElementTypeFrameInDEV} from 'shared/ReactComponentStackFrame';

const ReactDebugCurrentFrame = {};

let currentlyValidatingElement = (null: null | ReactElement);

export function setCurrentlyValidatingElement(element: null | ReactElement) {
  if (__DEV__) {
    currentlyValidatingElement = element;
  }
}

if (__DEV__) {
  ReactDebugCurrentFrame.setCurrentlyValidatingElement = function(
    element: null | ReactElement,
  ) {
    if (__DEV__) {
      currentlyValidatingElement = element;
    }
  };
  // Stack implementation injected by the current renderer.
  ReactDebugCurrentFrame.getCurrentStack = (null: null | (() => string));

  ReactDebugCurrentFrame.getStackAddendum = function(): string {
    let stack = '';

    // Add an extra top frame while an element is being validated
    if (currentlyValidatingElement) {
      const owner = currentlyValidatingElement._owner;
      stack += describeUnknownElementTypeFrameInDEV(
        currentlyValidatingElement.type,
        currentlyValidatingElement._source,
        owner ? owner.type : null,
      );
    }

    // Delegate to the injected renderer-specific implementation
    const impl = ReactDebugCurrentFrame.getCurrentStack;
    if (impl) {
      stack += impl() || '';
    }

    return stack;
  };
}

export default ReactDebugCurrentFrame;
