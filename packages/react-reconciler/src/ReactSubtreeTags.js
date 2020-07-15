/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type SubtreeTag = number;

export const NoEffect = /*        */ 0b000;
export const BeforeMutation = /*  */ 0b001;
export const Mutation = /*        */ 0b010;
export const Layout = /*          */ 0b100;
