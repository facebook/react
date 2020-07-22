/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type SubtreeTag = number;

export const NoEffect = /*        */ 0b0000;
export const BeforeMutation = /*  */ 0b0001;
export const Mutation = /*        */ 0b0010;
export const Layout = /*          */ 0b0100;
export const Passive = /*         */ 0b1000;
