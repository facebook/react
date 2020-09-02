/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// TODO: Move this to ReactFiberFlags so it's easier to line up the bits
export type SubtreeFlags = number;

export const NoFlags = /*        */ 0b00000;
export const BeforeMutation = /*  */ 0b00001;
export const Mutation = /*        */ 0b00010;
export const Layout = /*          */ 0b00100;
export const Passive = /*         */ 0b01000;
export const PassiveStatic = /*   */ 0b10000;
