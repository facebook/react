/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  PendingBlockComponent,
  ResolvedBlockComponent,
  RejectedBlockComponent,
  BlockComponent,
} from 'react/src/ReactBlock';

import {
  Uninitialized,
  Pending,
  Resolved,
  Rejected,
} from './ReactLazyStatusTags';

export function initializeBlockComponentType<Props, Payload, Data>(
  blockComponent: BlockComponent<Props, Payload, Data>,
): void {
  if (blockComponent._status === Uninitialized) {
    const thenableOrTuple = blockComponent._fn(blockComponent._data);
    if (typeof thenableOrTuple.then !== 'function') {
      let tuple: [any, any] = (thenableOrTuple: any);
      const resolved: ResolvedBlockComponent<
        Props,
        Data,
      > = (blockComponent: any);
      resolved._status = Resolved;
      resolved._data = tuple[0];
      resolved._fn = tuple[1];
      return;
    }
    const thenable = (thenableOrTuple: any);
    // Transition to the next state.
    const pending: PendingBlockComponent<Props, Data> = (blockComponent: any);
    pending._status = Pending;
    pending._data = thenable;
    pending._fn = null;
    thenable.then(
      (tuple: [any, any]) => {
        if (blockComponent._status === Pending) {
          // Transition to the next state.
          const resolved: ResolvedBlockComponent<
            Props,
            Data,
          > = (blockComponent: any);
          resolved._status = Resolved;
          resolved._data = tuple[0];
          resolved._fn = tuple[1];
        }
      },
      error => {
        if (blockComponent._status === Pending) {
          // Transition to the next state.
          const rejected: RejectedBlockComponent = (blockComponent: any);
          rejected._status = Rejected;
          rejected._data = error;
        }
      },
    );
  }
}
