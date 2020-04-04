/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';

import {
  HostRoot,
  HostPortal,
  HostText,
  Fragment,
  ContextProvider,
  ContextConsumer,
} from './ReactWorkTags';
import describeComponentFrame from 'shared/describeComponentFrame';
import getComponentName from 'shared/getComponentName';

function describeFiber(fiber: Fiber): string {
  switch (fiber.tag) {
    case HostRoot:
    case HostPortal:
    case HostText:
    case Fragment:
    case ContextProvider:
    case ContextConsumer:
      return '';
    default:
      const owner = fiber._debugOwner;
      const source = fiber._debugSource;
      const name = getComponentName(fiber.type);
      let ownerName = null;
      if (owner) {
        ownerName = getComponentName(owner.type);
      }
      return describeComponentFrame(name, source, ownerName);
  }
}

export function getStackByFiberInDevAndProd(workInProgress: Fiber): string {
  let info = '';
  let node = workInProgress;
  do {
    info += describeFiber(node);
    node = node.return;
  } while (node);
  return info;
}
