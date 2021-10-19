/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Will this ever overflow in the lifetime of an app? Probably not
let interactionID: number = 0;
export function getInteractionID(): number {
  return interactionID++;
}
