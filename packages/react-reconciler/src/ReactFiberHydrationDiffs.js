/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

export type HydrationDiffNode = {
  fiber: Fiber,
  children: Array<HydrationDiffNode>,
  serverProps: void | null | $ReadOnly<{[propName: string]: mixed}> | string, // null means no matching server node
  serverTail: Array<
    | $ReadOnly<{type: string, props: $ReadOnly<{[propName: string]: mixed}>}>
    | string,
  >,
};

export function describeDiff(rootNode: HydrationDiffNode): string {
  return '\n';
}
