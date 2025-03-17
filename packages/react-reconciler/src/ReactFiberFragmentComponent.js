/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import type {FragmentInstanceType, Instance} from './ReactFiberConfig';
import {
  updateFragmentInstance,
  createFragmentInstance,
} from './ReactFiberConfig';
import {HostComponent, HostRoot} from './ReactWorkTags';

export function createFragmentComponentInstance(
  fiber: Fiber,
): FragmentInstanceType {
  return createFragmentInstance(fiber, getFragmentParentHostInstance(fiber));
}

export function updateFragmentComponentInstance(
  fiber: Fiber,
  fragmentInstance: FragmentInstanceType,
): void {
  updateFragmentInstance(
    fiber,
    getFragmentParentHostInstance(fiber),
    fragmentInstance,
  );
}

function getFragmentParentHostInstance(fiber: Fiber): Instance {
  let parent = fiber.return;
  while (parent !== null) {
    if (parent.tag === HostRoot) {
      return parent.stateNode.containerInfo;
    }
    if (parent.tag === HostComponent) {
      return parent.stateNode;
    }
    parent = parent.return;
  }

  throw new Error(
    'Expected to find a host parent. This error is likely caused by a bug ' +
      'in React. Please file an issue.',
  );
}
