/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactElement} from 'shared/ReactElementType';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import describeComponentFrame from 'shared/describeComponentFrame';
import getComponentName from 'shared/getComponentName';

type ReactFrame = {
  fileName?: string | null,
  lineNumber?: number | null,
  name?: string | null,
};

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

  ReactDebugCurrentFrame.currentFiber = (null: null | Fiber);

  ReactDebugCurrentFrame.getStackFrames = function(): ReactFrame[] {
    let frames = [];

    // Add an extra top frame while an element is being validated
    if (currentlyValidatingElement) {
      const _name = getComponentName(currentlyValidatingElement.type);
      const _source = currentlyValidatingElement._source;
      frames.push({
        fileName: _source && _source.fileName.replace(/^.*[\\\/]/, ''),
        lineNumber: _source && _source.lineNumber,
        name: _name,
      });
    }

    // renderer (react-reconciler) injects currentFiber alongside getCurrentStack
    if (ReactDebugCurrentFrame.currentFiber) {
      let node = ReactDebugCurrentFrame.currentFiber;
      do {
        const owner = node._debugOwner;
        const source = node._debugSource;
        frames.push({
          fileName: source && source.fileName.replace(/^.*[\\\/]/, ''),
          lineNumber: source && source.lineNumber,
          name: owner && getComponentName(owner.type),
        });
        node = node.return;
      } while (node);
    }
    return frames;
  };

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
