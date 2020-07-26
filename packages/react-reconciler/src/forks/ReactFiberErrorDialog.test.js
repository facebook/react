/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from '../ReactFiber.old';
import type {CapturedValue} from '../ReactCapturedValue';

import {ClassComponent} from '../ReactWorkTags';

export function showErrorDialog(
  boundary: Fiber,
  errorInfo: CapturedValue<mixed>,
): boolean {
  const errorBoundary =
    boundary !== null && boundary.tag === ClassComponent
      ? boundary.stateNode
      : null;

  return !errorBoundary;
}
