/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';

import {HostComponent} from 'shared/ReactWorkTags';
import warning from 'shared/warning';

type HostContext = Object;

type TextInstance =
  | Text
  | {|
      text: string,
      id: number,
      hidden: boolean,
      context: HostContext,
    |};

type Instance =
  | Element
  | {|
      type: string,
      id: number,
      children: Array<Instance | TextInstance>,
      text: string | null,
      prop: any,
      hidden: boolean,
      context: HostContext,
    |};

export default function getElementFromTouchHitTarget(
  targetFiber: Fiber,
): null | Instance {
  // Traverse through child fibers and find the first host components
  let node = targetFiber.child;
  let hostComponent = null;

  while (node !== null) {
    if (node.tag === HostComponent) {
      if (__DEV__) {
        if (hostComponent === null) {
          hostComponent = node.stateNode;
        } else {
          warning(
            false,
            '<TouchHitTarget> must only have a single DOM element as a child. ' +
              'Found many children.',
          );
        }
        while (node !== null) {
          if (node === targetFiber) {
            return hostComponent;
          } else if (node.sibling !== null) {
            node = node.sibling;
            break;
          }
          node = node.return;
        }
      } else {
        return node.stateNode;
      }
    } else if (node.child !== null) {
      node = node.child;
    } else if (node.sibling !== null) {
      node = node.sibling;
    } else {
      break;
    }
  }
  if (__DEV__) {
    warning(
      hostComponent !== null,
      '<TouchHitTarget> must have a single DOM element as a child. ' +
        'Found no children.',
    );
  }
  return hostComponent;
}
