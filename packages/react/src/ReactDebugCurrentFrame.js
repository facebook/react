/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactElement} from 'shared/ReactElementType';

import describeComponentFrame from 'shared/describeComponentFrame';
import getComponentName from 'shared/getComponentName';

const ReactDebugCurrentFrame = {};

let currentlyValidatingElement = (null: null | ReactElement);

export function setCurrentlyValidatingElement(element: null | ReactElement) {
  if (__DEV__) {
    currentlyValidatingElement = element;
  }
}

if (__DEV__) {
  // Stack implementation injected by the current renderer.
  ReactDebugCurrentFrame.getCurrentStack = (null: null | (() => string));

  ReactDebugCurrentFrame.getStackAddendum = function(): string {
    let stack = '';

    // Add an extra top frame while an element is being validated
    if (currentlyValidatingElement) {
      const name = getComponentName(currentlyValidatingElement.type);
      const owner = currentlyValidatingElement._owner;
      stack += describeComponentFrame(
        name,
        currentlyValidatingElement._source,
        owner && getComponentName(owner.type),
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
